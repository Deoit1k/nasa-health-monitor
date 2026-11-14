// Local preview server. Exposes only the application shell, never repository files.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const assets=new Set(['index.html','sw.js','css/variables.css','css/layout.css','css/components.css','css/journal.css','js/vendor/chart.umd.js','js/health-domain.js','js/storage.js','js/charts.js','js/telemetry.js','js/protocols.js','js/journal.js']);
const port=Number(process.argv[2]||8765);
http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';}catch{res.writeHead(400).end();return;}
  if(!['GET','HEAD'].includes(req.method)||!assets.has(name)){res.writeHead(404).end('Not found');return;}
  fs.readFile(path.join(__dirname,name),(error,data)=>{
    if(error){res.writeHead(404).end('Not found');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(name)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
  });
}).listen(port,'127.0.0.1',()=>console.log(`Orbit Health: http://127.0.0.1:${port}`));
