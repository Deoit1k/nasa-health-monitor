/* Cache only this app's public shell, never observations or external requests. */
const CACHE='orbit-health-shell-v2';
const ASSETS=['./','./index.html','./css/variables.css','./css/layout.css','./css/components.css','./css/journal.css','./js/vendor/chart.umd.js','./js/health-domain.js','./js/storage.js','./js/charts.js','./js/telemetry.js','./js/protocols.js','./js/journal.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('orbit-health-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET' || url.origin !== self.location.origin)return;
  const asset=new URL(event.request.url);asset.search='';
  if(!ASSETS.some(path=>new URL(path,self.registration.scope).href===asset.href))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    try {
      const response=await fetch(event.request);
      if(response.ok)await cache.put(asset.href,response.clone());
      return response;
    } catch(error) {
      const cached=await cache.match(asset.href);
      if(cached)return cached;
      throw error;
    }
  }));
});
