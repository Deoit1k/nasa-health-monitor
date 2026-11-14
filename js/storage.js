(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./health-domain.js'):root.HealthDomain);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.JournalStore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(D){
  'use strict';
  const KEY='astronaut-health-journal-v1';
  function load(storage){
    let raw=null;
    try {raw=storage.getItem(KEY);return {state:raw===null?D.empty():D.validateState(JSON.parse(raw)),blocked:false,raw:null};}
    catch(error){return {state:D.empty(),blocked:true,raw,error:raw!==null?'Saved journal could not be read. Original data is protected; download it for recovery. This session will not overwrite it.':'Browser storage could not be read. Existing data is protected until reload. Work remains in this tab only; export a backup before closing.'};}
  }
  function save(storage,state,blocked=false){
    if(blocked)return {ok:false,error:'Original saved data is protected. Export this session before closing.'};
    try {storage.setItem(KEY,JSON.stringify(D.validateState(state)));return {ok:true};}
    catch(error){return {ok:false,error:'Could not save to browser storage. Your work remains in this tab; export a backup before closing.'};}
  }
  return {KEY,load,save};
});
