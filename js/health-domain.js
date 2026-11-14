/* Pure domain rules. Numeric review thresholds are illustrative, not clinical limits. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HealthDomain = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const UNITS = Object.freeze({heartRate:'BPM',temperature:'°C',sleep:'h',mood:'1–5',stress:'%',systolic:'mmHg',diastolic:'mmHg',radiation:'mSv',fluid:'mL',exercise:'min'});
  const BOUNDS = {heartRate:[20,250],temperature:[30,43],sleep:[0,24],mood:[1,5],stress:[0,100],systolic:[50,260],diastolic:[30,180],radiation:[0,10000],fluid:[0,10000],exercise:[0,1440]};
  const REQUIRED = ['heartRate','temperature','sleep','mood','stress'];
  const TASKS = ['measurements','exercise','wellbeing'];
  const RULES = ['heart','pressure','temperature','sleep','wellbeing','radiation'];
  const SOURCES = Object.freeze({hazards:'https://www.nasa.gov/hrp/hazards/',risks:'https://www.nasa.gov/hrp/risks/',research:'https://www.nasa.gov/hrp/ongoing-hrp-research/',radiation:'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp'});
  const empty = () => ({version:1,records:[],acknowledgements:[],tasks:{}});
  function timestamp(value, now) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value)) || Date.parse(value)>now) throw Error('Choose a valid observation time that is not in the future.');
    const date=value.slice(0,10); if(new Date(date).toISOString().slice(0,10)!==date) throw Error('Invalid calendar date.');
    return new Date(value).toISOString();
  }
  function observation(raw, now=Date.now()) {
    if(!raw || typeof raw!=='object' || Array.isArray(raw)) throw Error('Invalid observation.');
    if(typeof raw.id!=='string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(raw.id)) throw Error('Invalid record identifier.');
    if(raw.source && raw.source!=='manual') throw Error('Only manual journal observations can be saved.');
    const result={id:raw.id,observedAt:timestamp(raw.observedAt,now),source:'manual',units:{...UNITS}};
    for(const [field,[min,max]] of Object.entries(BOUNDS)) {
      const value=raw[field];
      if(value==='' || value===null || value===undefined) {
        if(REQUIRED.includes(field)) throw Error(`${field} is required.`);
        result[field]=null; continue;
      }
      if(!['string','number'].includes(typeof value) || (typeof value==='string' && !/^\d+(\.\d+)?$/.test(value.trim()))) throw Error(`${field} must be a number.`);
      const n=Number(value);
      if(!Number.isFinite(n) || n<min || n>max || (['mood','stress','heartRate','systolic','diastolic','fluid','exercise'].includes(field) && !Number.isInteger(n))) throw Error(`${field} must be ${min}–${max}${field==='mood'?' (whole number)':''}.`);
      result[field]=n;
    }
    if((result.systolic===null)!==(result.diastolic===null) || (result.systolic!==null && result.systolic<=result.diastolic)) throw Error('Enter both blood pressure values; systolic must exceed diastolic.');
    if(raw.note!==undefined && (typeof raw.note!=='string' || raw.note.length>1000)) throw Error('Notes must be text of at most 1000 characters.');
    result.note=raw.note || '';
    return result;
  }
  function ordered(records) {
    if(records.length>365) throw Error('Journal capacity is 365 observations. Export a backup before starting a new journal.');
    const sorted=[...records].sort((a,b)=>a.observedAt.localeCompare(b.observedAt)||a.id.localeCompare(b.id));
    let dose=null;
    for(const r of sorted) if(r.radiation!==null) {
      if(dose!==null && r.radiation<dose) throw Error('Cumulative radiation cannot decrease across dated observations. Check the dose, units and observation time.');
      dose=r.radiation;
    }
    return sorted;
  }
  function upsert(state, record) {
    return {...state,records:ordered([...state.records.filter(r=>r.id!==record.id),record]),acknowledgements:state.acknowledgements.filter(a=>a.recordId!==record.id)};
  }
  function validateState(raw, now=Date.now()) {
    if(!raw || raw.version!==1 || !Array.isArray(raw.records) || raw.records.length>365 || !Array.isArray(raw.acknowledgements) || raw.acknowledgements.length>2190 || !raw.tasks || typeof raw.tasks!=='object' || Array.isArray(raw.tasks)) throw Error('Unsupported or invalid journal backup (schema version 1 required).');
    const records=ordered(raw.records.map(r=>{
      if(r.source!=='manual' || JSON.stringify(r.units)!==JSON.stringify(UNITS)) throw Error('Invalid observation provenance or units.');
      return observation(r,now);
    }));
    const ids=new Set(records.map(r=>r.id)); if(ids.size!==records.length) throw Error('Duplicate record IDs.');
    const acknowledgementKeys=new Set();
    const acknowledgements=raw.acknowledgements.map(a=>{
      if(!a || !ids.has(a.recordId)||!RULES.includes(a.ruleId)) throw Error('Invalid review event.');
      const key=a.recordId+':'+a.ruleId; if(acknowledgementKeys.has(key)) throw Error('Duplicate review event.'); acknowledgementKeys.add(key);
      return {recordId:a.recordId,ruleId:a.ruleId,at:timestamp(a.at,now)};
    });
    const tasks={}; if(Object.keys(raw.tasks).length>366) throw Error('Too many checklist dates.');
    for(const [date,values] of Object.entries(raw.tasks)) {
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date || date>new Date(now).toISOString().slice(0,10) || !values || typeof values!=='object'||Array.isArray(values)) throw Error('Invalid checklist date.');
      tasks[date]={};
      for(const [key,value] of Object.entries(values)) {if(!TASKS.includes(key)||typeof value!=='boolean') throw Error('Invalid checklist item.'); tasks[date][key]=value;}
    }
    return {version:1,records,acknowledgements,tasks};
  }
  function merge(current, incoming, now=Date.now()) {
    const a=validateState(current,now),b=validateState(incoming,now), byId=new Map(a.records.map(r=>[r.id,r]));
    for(const record of b.records) {
      if(byId.has(record.id) && JSON.stringify(byId.get(record.id))!==JSON.stringify(record)) throw Error(`Conflicting record ${record.id}. Existing data was not changed.`);
      byId.set(record.id,record);
    }
    const acks=new Map([...b.acknowledgements,...a.acknowledgements].map(v=>[v.recordId+':'+v.ruleId,v]));
    const tasks={...a.tasks};
    for(const [day,items] of Object.entries(b.tasks)) {tasks[day]={...items,...tasks[day]};}
    return validateState({version:1,records:[...byId.values()],acknowledgements:[...acks.values()],tasks},now);
  }
  function evaluate(r, previous) {
    if(!r)return [];
    const out=[];
    const add=(id,title,reason,rule,hazard,source=SOURCES.risks)=>out.push({id,title,reason,rule,hazard,source});
    if(r.heartRate<50||r.heartRate>100) add('heart','Confirm resting heart rate',`${r.heartRate} BPM recorded at rest.`,'Resting heart rate < 50 or > 100 BPM','Gravity fields');
    if(r.systolic!==null && (r.systolic>=140||r.systolic<90||r.diastolic>=90||r.diastolic<60)) add('pressure','Recheck blood pressure',`${r.systolic}/${r.diastolic} mmHg recorded.`,'Systolic < 90 or ≥ 140, or diastolic < 60 or ≥ 90 mmHg','Gravity fields');
    if(r.temperature<35.5||r.temperature>=38) add('temperature','Confirm temperature',`${r.temperature} °C recorded.`,'Temperature < 35.5 or ≥ 38 °C','Hostile / closed environment');
    if(r.sleep<6) add('sleep','Review sleep and recovery',`${r.sleep} hours of sleep reported.`,'Sleep < 6 h','Isolation and confinement');
    if(r.mood<=2||r.stress>=70) add('wellbeing','Check in on well-being',`Mood ${r.mood}/5; self-reported stress ${r.stress}%.`,'Mood ≤ 2/5 or stress ≥ 70%','Isolation and confinement');
    if(r.radiation!==null && (!previous || previous.radiation===null || r.radiation>previous.radiation)) add('radiation','Review dosimeter record',`${r.radiation} mSv cumulative dose; ${previous?.radiation!=null?`change +${(r.radiation-previous.radiation).toFixed(2)} mSv since the prior dose record`:'first available dose record'}.`,'First dose record or any cumulative increase; no safety limit inferred','Space radiation',SOURCES.radiation);
    return out;
  }
  function csv(records) {
    const fields=['id','observedAt','source',...Object.keys(UNITS),'note'];
    const cell=value=>{let s=value==null?'':String(value);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
    return '\uFEFF'+[fields.map(k=>cell(UNITS[k]?`${k}_${UNITS[k]}`:k)).join(','),...records.map(r=>fields.map(k=>cell(r[k])).join(','))].join('\r\n');
  }
  function simulate({radiation=42,days=120,stress=24}={}) {
    const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));
    radiation=clamp(radiation,0,500);days=clamp(days,1,1000);stress=clamp(stress,0,100);
    const zones={};
    for(const [name,load] of Object.entries({head:stress,chest:20+stress*.7,abdomen:15+radiation*.12,knees:20+days*.08})) {
      const n=Math.round(clamp(load,0,100));zones[name]={load:n,temp:(36.4+n*.018).toFixed(1),status:n>=85?'CRITICAL':n>=70?'WARNING':n>=50?'ELEVATED':'NOMINAL'};
    }
    return {source:'simulated',heartRate:Math.round(62+stress*.65),temperature:36.6,sleep:Math.round((8-stress*.04)*10)/10,mood:stress>=70?2:4,stress,radiation,systolic:null,diastolic:null,bone:Math.max(70,100-days*.015),hydration:Math.max(50,98-stress*.25),metabolism:Math.min(100,60+stress*.4),days,zones};
  }
  return {UNITS,BOUNDS,SOURCES,TASKS,empty,observation,upsert,validateState,merge,evaluate,csv,simulate};
});
