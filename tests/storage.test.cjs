const {test}=require('node:test'); const assert=require('node:assert/strict');
const S=require('../js/storage.js'); const D=require('../js/health-domain.js');
test('empty storage loads a valid empty journal; save and reload roundtrip',()=>{
 let value=null; const store={getItem:()=>value,setItem:(k,v)=>{value=v;}};
 assert.deepEqual(S.load(store).state,D.empty()); assert.equal(S.save(store,D.empty()).ok,true);
 assert.deepEqual(S.load(store).state,D.empty());
});
test('corrupt storage is protected from writes and available for recovery',()=>{
 let writes=0; const store={getItem:()=>'{broken',setItem:()=>writes++};
 const result=S.load(store); assert.equal(result.blocked,true); assert.equal(result.raw,'{broken');
 assert.equal(S.save(store,D.empty(),result.blocked).ok,false); assert.equal(writes,0);
});
test('unavailable storage and quota failures return usable session with explicit errors',()=>{
 const broken={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('quota');}};
 assert.ok(S.load(broken).error); assert.ok(S.save(broken,D.empty()).error);
});
test('failed initial read never overwrites unread data if storage later becomes writable',()=>{
 let writes=0;const store={getItem:()=>{throw Error('temporary failure');},setItem:()=>writes++};
 const loaded=S.load(store);assert.equal(loaded.blocked,true);S.save(store,D.empty(),loaded.blocked);assert.equal(writes,0);
});
