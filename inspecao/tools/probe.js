const {chromium}=require('playwright');const path=require('path');
(async()=>{const [file,view]=process.argv.slice(2);const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.route('**/*',r=>{const u=r.request().url();(u.startsWith('file:')||u.includes('cdnjs'))?r.continue():r.abort()});
await p.addInitScript('window.__SEED={};');await p.addInitScript({path:path.join(__dirname,'mock-claude.js')});
await p.goto('file://'+path.resolve(file));await p.waitForTimeout(1200);await p.evaluate(v=>go(v,undefined,true),view);await p.waitForTimeout(400);
console.log(JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('#app svg')].map(s=>({w:Math.round(s.getBoundingClientRect().width),h:Math.round(s.getBoundingClientRect().height),cls:s.getAttribute('class'),par:s.parentElement.className||s.parentElement.tagName,html:s.outerHTML.slice(0,140)})).filter(x=>x.w>120||x.h>120)),null,1));await b.close()})();
