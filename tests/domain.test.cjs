const {test} = require('node:test');
const assert = require('node:assert/strict');
const D = require('../js/health-domain.js');
const now = Date.parse('2026-11-14T12:00:00Z');
const raw = (extra={}) => ({id:'a', observedAt:'2026-11-14T10:00:00Z', heartRate:72, temperature:36.7, sleep:8, mood:4, stress:20, ...extra});
const record = (extra={}) => D.observation(raw(extra),now);

test('optional measurements remain null; normalized records carry units and provenance',()=>{
 const r=record(); assert.equal(r.radiation,null); assert.equal(r.systolic,null);
 assert.equal(r.source,'manual'); assert.equal(r.units.radiation,'mSv'); assert.equal(r.units.temperature,'°C');
});
test('validates required values, strict numbers, paired pressure, times and note size',()=>{
 for(const bad of [{heartRate:''},{heartRate:Infinity},{heartRate:'72junk'},{temperature:50},{mood:2.5},{sleep:-1},{stress:101},{systolic:120},{systolic:80,diastolic:90},{observedAt:'bad'},{observedAt:'2026-11-15T00:00:00Z'},{note:'x'.repeat(1001)}]) assert.throws(()=>record(bad));
});
test('upsert sorts history, rejects decreasing dose on either side and capacity overflow',()=>{
 let s=D.empty(); s=D.upsert(s,record({id:'b',radiation:12}));
 s=D.upsert(s,record({observedAt:'2026-11-13T10:00:00Z',radiation:10}));
 assert.deepEqual(s.records.map(r=>r.id),['a','b']);
 assert.throws(()=>D.upsert(s,record({id:'c',observedAt:'2026-11-12T10:00:00Z',radiation:11})));
 assert.throws(()=>D.upsert(s,record({radiation:14,observedAt:'2026-11-13T10:00:00Z'})));
 const full={...D.empty(),records:Array.from({length:365},(_,i)=>record({id:'r'+i}))};
 assert.throws(()=>D.upsert(full,record({id:'overflow'})));
});
test('editing invalidates only that record acknowledgements',()=>{
 let s=D.upsert(D.empty(),record()); s.acknowledgements=[{recordId:'a',ruleId:'sleep',at:'2026-11-14T11:00:00Z'}];
 s=D.upsert(s,record({sleep:4})); assert.equal(s.acknowledgements.length,0);
});
test('state validation rejects malformed metadata, duplicates and simulator provenance',()=>{
 const s=D.upsert(D.empty(),record()); assert.deepEqual(D.validateState(s,now),s);
 for(const bad of [{...s,version:99},{...s,records:[s.records[0],s.records[0]]},{...s,records:[{...s.records[0],source:'simulated'}]},{...s,tasks:{'bad':{exercise:true}}},{...s,acknowledgements:[{recordId:'absent',ruleId:'sleep',at:'2026-11-14T11:00:00Z'}]}]) assert.throws(()=>D.validateState(bad,now));
});
test('backup merge is atomic, ignores identical IDs, rejects conflicts, and merges tasks',()=>{
 const s=D.upsert(D.empty(),record()); const incoming=D.upsert(D.empty(),record({id:'b'}));
 incoming.tasks['2026-11-14']={exercise:true}; const merged=D.merge(s,incoming,now);
 assert.equal(merged.records.length,2); assert.equal(merged.tasks['2026-11-14'].exercise,true);
 assert.equal(D.merge(s,s,now).records.length,1);
 assert.throws(()=>D.merge(s,D.upsert(D.empty(),record({sleep:2})),now)); assert.equal(s.records[0].sleep,8);
});
test('review rules explain triggered measurements without claiming NASA clinical limits',()=>{
 const r=record({heartRate:110,temperature:38.1,sleep:4,mood:1,stress:90,radiation:15});
 const findings=D.evaluate(r,record({radiation:10}));
 for(const id of ['heart','temperature','sleep','wellbeing','radiation']) assert.ok(findings.some(f=>f.id===id));
 findings.forEach(f=>{assert.ok(f.reason);assert.ok(f.rule);assert.ok(f.source.startsWith('https://'));});
 assert.equal(D.evaluate(record(),null).length,0);
});
test('CSV protects formula cells and escapes quotes; includes units and missing blanks',()=>{
 const csv=D.csv([record({note:'=HYPERLINK("bad")'})]);
 assert.ok(csv.includes('radiation_mSv')); assert.ok(csv.includes("'=HYPERLINK")); assert.ok(csv.includes('""bad""'));
});
test('simulation is deterministic, separate provenance, cumulative dose and modeled zones',()=>{
 const a=D.simulate({radiation:420,days:240,stress:82}); assert.deepEqual(a,D.simulate({radiation:420,days:240,stress:82}));
 assert.equal(a.radiation,420); assert.equal(a.source,'simulated'); assert.ok(a.zones.head.load>0);
});
test('backup accepts equivalent units regardless of JSON property ordering',()=>{
 const s=D.upsert(D.empty(),record());s.records[0].units=Object.fromEntries(Object.entries(s.records[0].units).reverse());
 assert.equal(D.validateState(s,now).records.length,1);
});
test('historical review context selects the requested record and its preceding dose only',()=>{
 let s=D.empty();
 for(const r of [record({id:'first',observedAt:'2026-11-12T10:00:00Z',radiation:10}),record({id:'middle',observedAt:'2026-11-13T10:00:00Z',radiation:12,sleep:4}),record({id:'last',radiation:15})])s=D.upsert(s,r);
 const context=D.reviewContext(s,'middle');assert.equal(context.record.id,'middle');assert.equal(context.previousDose.radiation,10);
 assert.ok(D.evaluate(context.record,context.previousDose).some(f=>f.id==='sleep'));
 assert.equal(D.reviewContext(s,null).record.id,'last');assert.equal(D.reviewContext(D.empty(),null).record,null);
});
test('dose corrections and imported preceding doses invalidate dependent radiation reviews',()=>{
 let s=D.upsert(D.empty(),record({id:'first',observedAt:'2026-11-13T10:00:00Z',radiation:10}));s=D.upsert(s,record({id:'last',radiation:12}));
 s.acknowledgements=[{recordId:'last',ruleId:'radiation',at:'2026-11-14T11:00:00Z'},{recordId:'last',ruleId:'heart',at:'2026-11-14T11:00:00Z'}];
 const corrected=D.upsert(s,record({id:'first',observedAt:'2026-11-13T10:00:00Z',radiation:1}));
 assert.ok(!corrected.acknowledgements.some(a=>a.ruleId==='radiation'));assert.ok(corrected.acknowledgements.some(a=>a.ruleId==='heart'));
 const imported=D.upsert(D.empty(),record({id:'between',observedAt:'2026-11-14T09:00:00Z',radiation:11}));
 assert.ok(!D.merge(s,imported,now).acknowledgements.some(a=>a.ruleId==='radiation'));
});
test('backup rejects acknowledgements preceding the referenced observation',()=>{
 const s=D.upsert(D.empty(),record());s.acknowledgements=[{recordId:'a',ruleId:'sleep',at:'2026-11-01T00:00:00Z'}];
 assert.throws(()=>D.validateState(s,now));
});
