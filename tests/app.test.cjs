const {test}=require('node:test'); const assert=require('node:assert/strict'); const fs=require('node:fs'); const path=require('node:path');
const root=path.join(__dirname,'..'); const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('journal exposes preserved integration IDs and daily workflow',()=>{
 for(const id of ['val-heart-rate','status-heart-rate','val-radiation','status-radiation','val-bone-mass','status-bone-mass','val-stress','status-stress','sim-preset-select','slider-radiation','slider-days','slider-stress','protocols-container','zone-head','zone-chest','zone-abdomen','zone-knees','checkin-form','journal-history','import-preview','journal-mode','simulation-mode']) assert.ok(html.includes(`id="${id}"`),id);
 assert.ok(html.includes('mission emergency procedure')); assert.ok(html.includes('not NASA clinical limits'));
});
test('application shell references local scripts and no remote fonts or fake treatment actions',()=>{
 assert.ok(!html.includes('fonts.googleapis.com')); assert.ok(!html.includes('Amifostine'));
 for(const match of html.matchAll(/<script[^>]*src="([^"]+)"/g)){assert.ok(!match[1].startsWith('https:'));assert.ok(fs.existsSync(path.join(root,match[1])),match[1]);}
});
test('offline shell lists every referenced local asset and avoids caching external health traffic',()=>{
 const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 for(const match of html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g))assert.ok(worker.includes("'./"+match[1]+"'"),match[1]);
 assert.ok(worker.includes("url.origin !== self.location.origin"));
});
test('observation time accepts seconds used by the default and restored timestamps',()=>{
 assert.match(html,/<input[^>]*name="observedAt"[^>]*step="1"/);
});
