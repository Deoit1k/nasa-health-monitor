const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
test('journal charts plot epoch coordinates with true elapsed-time spacing and preserve missing gaps',()=>{
 const captured=[];class Chart{constructor(ctx,config){Object.assign(this,config);captured.push(this);}update(){}destroy(){}}
 const canvas={getContext:()=>({createLinearGradient:()=>({addColorStop(){}})})};
 const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/charts.js'),'utf8'),{window,Chart,document:{getElementById:()=>canvas}});
 const times=['2026-11-01T10:00:00Z','2026-11-01T10:01:00Z','2026-11-14T10:00:00Z'];
 window.JournalCharts.render(times.map((observedAt,i)=>({observedAt,radiation:i===1?null:i,sleep:7,stress:20})),'journal');
 assert.equal(captured[0].options.scales.x.type,'linear');
 assert.deepEqual(Array.from(captured[0].data.datasets[0].data,p=>p.x),times.map(Date.parse));
 assert.equal(captured[0].data.datasets[0].data[1].y,null);assert.equal(captured[0].data.datasets[0].spanGaps,false);
 assert.equal(captured[1].data.datasets[1].yAxisID,'stress');
});
