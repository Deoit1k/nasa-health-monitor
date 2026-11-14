/* Personal journal orchestration. User/imported text is rendered as text only. */
(function () {
  'use strict';
  const D=HealthDomain, $=id=>document.getElementById(id);
  const storage={getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)};
  const loaded=JournalStore.load(storage);
  let state=loaded.state,mode='journal',editing=null,pendingImport=null;
  const localTime=iso=>{const date=iso?new Date(iso):new Date();return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,19);};
  const utc=iso=>new Date(iso).toISOString().slice(0,19).replace('T',' ')+' UTC';
  const element=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n;};
  function message(value,error=false){$('app-message').textContent=value;$('app-message').classList.toggle('error',error);}
  function save(){const result=JournalStore.save(storage,state,loaded.blocked);$('storage-warning').hidden=result.ok;if(!result.ok)$('storage-warning').textContent=result.error;}
  function download(name,contents,type){const url=URL.createObjectURL(new Blob([contents],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function latest(){return state.records.at(-1)||null;}
  function previousDose(){return [...state.records.slice(0,-1)].reverse().find(r=>r.radiation!==null)||null;}
  function resetForm(){editing=null;$('checkin-form').reset();$('observedAt').value=localTime();$('form-title').textContent='Daily check-in';$('save-checkin').textContent='Save check-in';$('cancel-edit').hidden=true;$('form-error').textContent='';}
  function edit(record){
    editing=record.id;
    for(const [key,value] of Object.entries(record)){const input=$('checkin-form').elements.namedItem(key);if(input)input.value=key==='observedAt'?localTime(value):value??'';}
    $('form-title').textContent='Edit observation';$('save-checkin').textContent='Save correction';$('cancel-edit').hidden=false;$('form-error').textContent='';$('observedAt').focus();$('checkin-panel').scrollIntoView({block:'start'});
  }
  function review(ruleId){const r=latest();if(!r || mode!=='journal')return;if(state.acknowledgements.some(a=>a.recordId===r.id&&a.ruleId===ruleId))return;state={...state,acknowledgements:[...state.acknowledgements,{recordId:r.id,ruleId,at:new Date().toISOString()}]};save();render();message('Review recorded. The observation and finding remain visible.');}
  function renderHistory(){
    const node=$('journal-history');node.replaceChildren();$('record-count').textContent=`${state.records.length} / 365`;
    if(!state.records.length){node.append(element('p','Your journal is empty. Your first check-in will appear here.','help'));return;}
    for(const r of [...state.records].reverse()){
      const row=element('article',undefined,'history-entry'),details=element('div'),time=element('time',utc(r.observedAt));time.dateTime=r.observedAt;
      details.append(time,element('p',`${r.heartRate} BPM · ${r.temperature} °C · sleep ${r.sleep} h · mood ${r.mood}/5 · stress ${r.stress}% · ${r.radiation===null?'dose not recorded':r.radiation+' mSv'}`));
      if(r.note)details.append(element('p',r.note));
      const button=element('button','Edit');button.type='button';button.setAttribute('aria-label',`Edit observation ${utc(r.observedAt)}`);button.addEventListener('click',()=>edit(r));row.append(details,button);node.append(row);
    }
  }
  function renderTrends(records){
    const demo=mode==='simulation',head=$('trend-head'),body=$('trend-body');head.replaceChildren();body.replaceChildren();const tr=element('tr');
    (demo?['Scenario day','Dose (mSv)','Hydration (%)','Metabolism (%)']:['Time (UTC)','Dose (mSv)','Sleep (h)','Stress (%)']).forEach(v=>{const th=element('th',v);th.scope='col';tr.append(th);});head.append(tr);
    for(const r of records){const row=element('tr');(demo?[r.days,r.radiation,r.hydration,r.metabolism]:[utc(r.observedAt),r.radiation,r.sleep,r.stress]).forEach(v=>row.append(element('td',v??'—')));body.append(row);}
    if(!records.length){const cell=element('td','No observations to plot.');cell.colSpan=4;const row=element('tr');row.append(cell);body.append(row);}
    $('recovery-chart-title').textContent=demo?'Modeled hydration & metabolism · %':'Sleep · hours / stress · %';$('chart-mode-label').textContent=demo?'One simulated scenario point':'Recorded observations · gaps preserved';
    JournalCharts.render(records,mode);
  }
  function renderTasks(){
    const day=new Date().toISOString().slice(0,10),tasks=state.tasks[day]||{};
    $('task-date').textContent=`${day} · UTC mission routine`;
    document.querySelectorAll('[data-task]').forEach(input=>input.checked=Boolean(tasks[input.dataset.task]));
    $('task-progress').textContent=`${D.TASKS.filter(key=>tasks[key]).length} / 3`;
  }
  function renderSummary(record){
    if(mode==='simulation'){$('summary-label').textContent='Mission simulator';$('summary-title').textContent='Explore a mission scenario';$('summary-detail').textContent=`Day ${record.days} · deterministic illustrative model · no sensor connected · not saved` ;return;}
    $('summary-label').textContent='Daily health overview';
    if(!record){$('summary-title').textContent="Start with today's check-in";$('summary-detail').textContent='No observations yet. Record how you feel and what you measured.';return;}
    const age=Math.max(0,(Date.now()-Date.parse(record.observedAt))/3600000),findings=D.evaluate(record,previousDose()),open=findings.filter(f=>!state.acknowledgements.some(a=>a.recordId===record.id&&a.ruleId===f.id)).length;
    $('summary-title').textContent=age>24?'Your latest observation is stale':open?`${open} review ${open===1?'prompt':'prompts'} to check`:'Your latest check-in is recorded';
    const previous=state.records.at(-2),delta=previous?` · resting pulse ${record.heartRate-previous.heartRate>=0?'+':''}${record.heartRate-previous.heartRate} BPM vs prior observation`:'';
    $('summary-detail').textContent=`Latest: ${utc(record.observedAt)} · ${age.toFixed(1)} h ago${age>24?' · over 24 h old; record a fresh check-in':''}${delta}. No sensor feed connected.`;
  }
  function render(){
    const demo=mode==='simulation',record=demo?Telemetry.snapshot():latest();
    document.body.dataset.mode=mode;
    document.querySelectorAll('.journal-only').forEach(n=>n.hidden=demo);$('simulation-panel').hidden=!demo;
    $('journal-mode').setAttribute('aria-pressed',String(!demo));$('simulation-mode').setAttribute('aria-pressed',String(demo));
    $('mode-description').textContent=demo?'Simulation is separate from your journal.':'Your observations stay on this device.';
    Telemetry.render(record,mode);Protocols.render(record,demo?null:previousDose(),demo?[]:state.acknowledgements,review);
    renderSummary(record);renderTrends(demo?[record]:state.records);renderHistory();renderTasks();
    $('utc-clock').textContent=new Date().toISOString().slice(0,16).replace('T',' ')+' UTC';
  }
  $('checkin-form').addEventListener('submit',event=>{
    event.preventDefault();$('form-error').textContent='';
    try{
      const data=Object.fromEntries(new FormData(event.currentTarget)),date=new Date(data.observedAt);
      if(!Number.isFinite(date.getTime()))throw Error('Choose a valid observation time.');
      data.observedAt=date.toISOString();data.id=editing||crypto.randomUUID();
      const record=D.observation(data);state=D.upsert(state,record);save();resetForm();render();message('Check-in saved in this session. Review the observations and any prompts below.');
    }catch(error){$('form-error').textContent=error.message;}
  });
  $('cancel-edit').addEventListener('click',resetForm);
  $('journal-mode').addEventListener('click',()=>{mode='journal';render();message('Personal journal opened. Simulation values were not saved.');});
  $('simulation-mode').addEventListener('click',()=>{mode='simulation';render();message('Simulation opened. Your journal stays separate.');});
  document.querySelectorAll('[data-task]').forEach(input=>input.addEventListener('change',()=>{
    const day=new Date().toISOString().slice(0,10),tasks={...state.tasks,[day]:{...state.tasks[day],[input.dataset.task]:input.checked}};
    // Checklist retention is bounded independently of observations; no observation is removed.
    Object.keys(tasks).sort().slice(0,-366).forEach(key=>delete tasks[key]);state={...state,tasks};save();renderTasks();
  }));
  $('export-json').addEventListener('click',()=>download('orbit-health-backup.json',JSON.stringify(state,null,2),'application/json'));
  $('export-csv').addEventListener('click',()=>download('orbit-health-observations.csv',D.csv(state.records),'text/csv;charset=utf-8'));
  function cancelImport(){pendingImport=null;$('import-preview').hidden=true;$('import-file').value='';}
  $('import-file').addEventListener('change',async event=>{
    pendingImport=null;$('import-preview').hidden=true;
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>2*1024*1024)throw Error('Backup exceeds the 2 MB import limit.');
      const incoming=D.validateState(JSON.parse(await file.text())),merged=D.merge(state,incoming);
      pendingImport=incoming;$('import-detail').textContent=`Validated backup: ${incoming.records.length} observations; ${merged.records.length-state.records.length} new. Existing records are preserved; review events and routines will be merged. Confirm to apply.`;$('import-preview').hidden=false;
    }catch(error){message(`Import not applied: ${error.message}`,true);event.target.value='';}
  });
  $('confirm-import').addEventListener('click',()=>{
    if(!pendingImport)return;
    try{state=D.merge(state,pendingImport);save();cancelImport();render();message('Backup merged. Existing observations were preserved.');}catch(error){cancelImport();message(`Import not applied: ${error.message}`,true);}
  });
  $('cancel-import').addEventListener('click',cancelImport);
  if(loaded.error){$('storage-warning').textContent=loaded.error;$('storage-warning').hidden=false;}
  if(loaded.raw!==null){$('recover-storage').hidden=false;$('recover-storage').addEventListener('click',()=>download('orbit-health-original-storage.txt',loaded.raw,'text/plain'));}
  function connection(){const offline=navigator.onLine===false;$('offline-status').textContent=offline?'Offline · local journal':location.protocol==='file:'?'Local file · offline install requires localhost':'Local journal · no cloud sync';}
  window.addEventListener('online',connection);window.addEventListener('offline',connection);
  window.addEventListener('storage',event=>{if(event.key===JournalStore.KEY){loaded.blocked=true;$('storage-warning').hidden=false;$('storage-warning').textContent='The journal changed in another tab. This tab will not overwrite it. Export your session, then reload to use the saved version.';}});
  Telemetry.init(()=>{if(mode==='simulation')render();});JournalCharts.initBody();resetForm();render();connection();
  setInterval(()=>{renderSummary(mode==='simulation'?Telemetry.snapshot():latest());renderTasks();$('utc-clock').textContent=new Date().toISOString().slice(0,16).replace('T',' ')+' UTC';},60000);
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{$('offline-status').textContent=navigator.onLine?'Offline cache ready · local journal':'Offline · local journal';}).catch(()=>{$('offline-status').textContent='Local journal · offline cache unavailable';});
  window.JournalApp={render,state:()=>structuredClone(state),review};
})();
