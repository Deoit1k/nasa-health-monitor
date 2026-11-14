/* Biometric readouts and deterministic simulation controls. No journal persistence. */
(function(){
 'use strict';
 function render(record,mode){
   const r=record,demo=mode==='simulation',D=HealthDomain;
   const findingIds=new Set(D.evaluate(r,null).map(f=>f.id));
   function metric(id,value,status,attention){document.getElementById('val-'+id).textContent=value??'—';const node=document.getElementById('status-'+id);node.textContent=status;node.className='vital-status-pill'+(attention?' status-warning':'');}
   metric('heart-rate',r?.heartRate,r?(findingIds.has('heart')?'Review':demo?'Simulated':'Recorded'):'No data',findingIds.has('heart'));
   metric('radiation',r?.radiation==null?null:Number(r.radiation).toFixed(2),r?.radiation==null?'No data':demo?'Simulated':'Dose record',false);
   metric('bone-mass',demo?r.bone.toFixed(1):null,demo?'Modeled':'Unavailable',false);
   metric('stress',r?.stress,r?(findingIds.has('wellbeing')?'Review':demo?'Simulated':'Self-report'):'No data',findingIds.has('wellbeing'));
   const details=[['Temperature',r?.temperature==null?'Not recorded':`${r.temperature} °C`],['Blood pressure',r?.systolic==null?'Not recorded':`${r.systolic}/${r.diastolic} mmHg`],['Sleep',r?.sleep==null?'Not recorded':`${r.sleep} h`],['Mood',r?.mood==null?'Not recorded':`${r.mood} / 5`],['Fluid intake',r?.fluid==null?'Not recorded':`${r.fluid} mL`],['Exercise',r?.exercise==null?'Not recorded':`${r.exercise} min`]];
   const dl=document.getElementById('secondary-vitals');dl.replaceChildren();details.forEach(([label,value])=>{const item=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;item.append(dt,dd);dl.append(item);});
   for(const name of ['head','chest','abdomen','knees']){const zone=document.getElementById('zone-'+name),data=demo?r.zones[name]:null;zone.dataset.load=data?data.load+'%':'Not measured';zone.dataset.temp=data?data.temp+' °C':'Not measured';zone.dataset.status=data?data.status:'NOT MEASURED';zone.querySelectorAll('.zone-glow-shape').forEach(s=>{const color=data?.load>=70?'#ff9100':'#00e5ff';s.style.stroke=color;s.style.fill=color+'33';});}
   document.getElementById('body-title').textContent=demo?'Modeled body zones':'Explore health domains';document.getElementById('body-description').textContent=demo?'Illustrative model only. These are not local temperature or load measurements.':'Select a region to find related observations. This is navigation, not a thermal scan.';
   document.querySelectorAll('.vital-code').forEach((n,i)=>n.textContent=demo?['Simulated resting pulse','Simulated cumulative dose','Illustrative bone model','Simulated scenario stress'][i]:['Manually recorded','Manual dosimeter entry','Requires a dedicated measurement','Self-report / not a sensor reading'][i]);
 }
 function init(onChange){
   const presets={nominal:[42,120,24],'eva-high':[165,180,58],'solar-storm':[420,240,82],'deep-space':[310,680,72],reentry:[85,420,65]};
   const ids=['radiation','days','stress'];
   function update(){ids.forEach((key,i)=>document.getElementById('disp-slider-'+key).textContent=document.getElementById('slider-'+key).value+[' mSv',' d','%'][i]);onChange();}
   document.getElementById('sim-preset-select').addEventListener('change',event=>{const values=presets[event.target.value];if(!values)return;ids.forEach((key,i)=>document.getElementById('slider-'+key).value=values[i]);update();});
   ids.forEach(key=>document.getElementById('slider-'+key).addEventListener('input',()=>{document.getElementById('sim-preset-select').value='custom';update();}));
   document.getElementById('reset-simulation').addEventListener('click',()=>{document.getElementById('sim-preset-select').value='nominal';ids.forEach((key,i)=>document.getElementById('slider-'+key).value=presets.nominal[i]);update();});
 }
 function snapshot(){return HealthDomain.simulate(Object.fromEntries(['radiation','days','stress'].map(key=>[key,document.getElementById('slider-'+key).value])));}
 window.Telemetry={render,init,snapshot};
})();
