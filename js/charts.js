/* Chart rendering and body interaction only; state belongs to the controllers. */
(function () {
  'use strict';
  let radiationChartInstance=null, hydrationChartInstance=null;
  const colors=['#ff2a55','#00e5ff','#6ca8fc'];
  function chart(canvas, datasets, axes) {
    const ctx=canvas.getContext('2d');
    return new Chart(ctx,{type:'line',data:{labels:[],datasets:datasets.map((name,i)=>{
      const gradient=ctx.createLinearGradient(0,0,0,190);
      gradient.addColorStop(0,i===0&&axes==='radiation'?'rgba(255,42,85,.25)':'rgba(0,229,255,.18)');gradient.addColorStop(1,'rgba(0,0,0,0)');
      return {label:name,data:[],borderColor:axes==='radiation'?colors[0]:colors[i+1],backgroundColor:gradient,fill:i===0,borderWidth:2,pointRadius:3,tension:0,spanGaps:false,yAxisID:axes==='recovery'&&i===1?'stress':'y'};
    })},options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:axes!=='radiation',labels:{color:'#afc2d3',font:{size:11}}}},scales:{x:{grid:{color:'#172d3e'},ticks:{color:'#91a7bb',maxTicksLimit:4,maxRotation:0}},y:{beginAtZero:true,grid:{color:'#172d3e'},ticks:{color:'#91a7bb'},...(axes==='recovery'?{title:{display:true,text:'Sleep (h)',color:'#afc2d3'},suggestedMax:10}:{title:{display:true,text:'mSv',color:'#afc2d3'}})},...(axes==='recovery'?{stress:{position:'right',min:0,max:100,grid:{drawOnChartArea:false},ticks:{color:'#91a7bb'},title:{display:true,text:'Stress (%)',color:'#afc2d3'}}}:{})}}});
  }
  function render(records,mode) {
    const demo=mode==='simulation';
    const radiation=document.getElementById('chart-radiation'),recovery=document.getElementById('chart-hydration');
    if(typeof Chart==='undefined') { document.getElementById('chart-fallback').hidden=false; radiation.parentElement.hidden=true; recovery.parentElement.hidden=true; return; }
    if(!radiationChartInstance)radiationChartInstance=chart(radiation,['Cumulative dose (mSv)'],'radiation');
    // Recreate for axes/units when changing between actual recovery and modeled percentages.
    if(hydrationChartInstance && hydrationChartInstance.demo!==demo) {hydrationChartInstance.destroy();hydrationChartInstance=null;}
    if(!hydrationChartInstance){hydrationChartInstance=chart(recovery,demo?['Modeled hydration (%)','Modeled metabolism (%)']:['Sleep (h)','Stress (%)'],demo?'percent':'recovery');hydrationChartInstance.demo=demo;if(demo){hydrationChartInstance.options.scales.y.max=100;hydrationChartInstance.options.scales.y.title.text='%';}}
    const labels=records.map(r=>demo?`Day ${r.days}`:new Date(r.observedAt).toISOString().slice(5,16).replace('T',' ')+'Z');
    radiationChartInstance.data.labels=labels;radiationChartInstance.data.datasets[0].data=records.map(r=>r.radiation);radiationChartInstance.update('none');
    hydrationChartInstance.data.labels=labels;
    hydrationChartInstance.data.datasets[0].data=records.map(r=>demo?r.hydration:r.sleep);
    hydrationChartInstance.data.datasets[1].data=records.map(r=>demo?r.metabolism:r.stress);hydrationChartInstance.update('none');
  }
  function initBody() {
    const tooltip=document.getElementById('silhouette-tooltip');
    const targets={head:'sleep',chest:'heartRate',abdomen:'temperature',knees:'exercise'};
    const descriptions={head:'Sleep and well-being: track sleep hours, mood and perceived stress.',chest:'Cardiovascular observations: record resting heart rate and paired blood pressure.',abdomen:'Core observations: record body temperature and daily fluid intake.',knees:'Activity: record exercise minutes; bone density cannot be inferred from activity or time in space.'};
    for(const [name,target] of Object.entries(targets)) {
      const zone=document.getElementById('zone-'+name);zone.setAttribute('aria-label',descriptions[name]);
      function show(event) {
        const demo=document.body.dataset.mode==='simulation';
        document.getElementById('tooltip-zone-title').textContent=name.toUpperCase();
        document.getElementById('tooltip-zone-status').textContent=demo?zone.dataset.status:'Observation navigation';
        document.getElementById('tooltip-zone-load').textContent=demo?`Modeled load: ${zone.dataset.load}`:'Load: not measured';
        document.getElementById('tooltip-zone-temp').textContent=demo?`Modeled temperature: ${zone.dataset.temp}`:'Local temperature: not measured';
        tooltip.style.display='flex';tooltip.setAttribute('aria-hidden','false');zone.setAttribute('aria-describedby','silhouette-tooltip');
        const bounds=zone.getBoundingClientRect();const x=event.clientX||bounds.left, y=event.clientY||bounds.top;
        tooltip.style.left=Math.max(8,x-tooltip.offsetWidth-18)+'px';tooltip.style.top=Math.max(80,Math.min(innerHeight-80,y))+'px';
      }
      function hide(){tooltip.style.display='none';tooltip.setAttribute('aria-hidden','true');zone.removeAttribute('aria-describedby');}
      function activate(){document.getElementById('body-detail').textContent=descriptions[name];if(document.body.dataset.mode==='journal'){const input=document.getElementById(target);input.focus();input.scrollIntoView({block:'center'});}}
      zone.addEventListener('mouseenter',show);zone.addEventListener('mousemove',show);zone.addEventListener('mouseleave',hide);zone.addEventListener('focus',show);zone.addEventListener('blur',hide);zone.addEventListener('click',activate);
      zone.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activate();}if(event.key==='Escape')hide();});
    }
  }
  window.JournalCharts={render,initBody};
})();
