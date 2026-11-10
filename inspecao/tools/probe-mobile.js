const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2];const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});const p=await ctx.newPage();
await p.route('**/*',r=>{const u=r.request().url();(u.startsWith('file:')||u.includes('cdnjs'))?r.continue():r.abort()});
await p.addInitScript('window.__SEED='+fs.readFileSync(path.join(__dirname,'seed.json'),'utf8')+';');await p.addInitScript({path:path.join(__dirname,'mock-claude.js')});
await p.goto('file://'+path.resolve(file));await p.waitForTimeout(1800);
console.log(await p.evaluate(()=>{const de=document.documentElement;const w=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>de.clientWidth+1&&getComputedStyle(e).position!=='fixed'}).slice(0,8).map(e=>e.tagName+'.'+String(e.className&&e.className.baseVal!==undefined?'svg':e.className).slice(0,40)+' r='+Math.round(e.getBoundingClientRect().right)+' w='+Math.round(e.getBoundingClientRect().width));return {sw:de.scrollWidth,cw:de.clientWidth,w}}));await b.close()})();
