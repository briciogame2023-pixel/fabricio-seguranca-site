const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const file=process.argv[2];const axe=fs.readFileSync(path.join(__dirname,'axe.min.js'),'utf8');const seed=fs.readFileSync(path.join(__dirname,'seed.json'),'utf8');const b=await chromium.launch();const tot={};let n=0;
for(const tema of['light','dark'])for(const aba of['exec','det'])for(const w of[1440,390]){
  const ctx=await b.newContext({viewport:{width:w,height:900},reducedMotion:'reduce',colorScheme:tema,hasTouch:w<500,isMobile:w<500});const p=await ctx.newPage();
  await p.route('**/*',r=>{const u=r.request().url();(u.startsWith('file:')||u.includes('cdnjs'))?r.continue():r.abort()});
  await p.addInitScript('window.__SEED='+seed+';');await p.addInitScript({path:path.join(__dirname,'mock-claude.js')});
  await p.goto('file://'+path.resolve(file));await p.waitForTimeout(1600);await p.addScriptTag({content:axe});
  if(aba==='det'){await p.click('[data-xaba=det]');await p.waitForTimeout(600)}
  const r=await p.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));n++;
  r.violations.forEach(x=>{const k=x.id+' ['+x.impact+']';(tot[k]=tot[k]||{c:0,ex:new Set(),h:x.help});tot[k].c+=x.nodes.length;x.nodes.slice(0,3).forEach(nd=>tot[k].ex.add(`${tema}/${aba}/${w}: `+nd.target.join(' ').slice(0,80)+' | '+(nd.any[0]&&nd.any[0].message||'').slice(0,90)))});await ctx.close()}
console.log('combinações auditadas:',n);const ks=Object.keys(tot);if(!ks.length)console.log('Nenhuma violação.');ks.forEach(k=>console.log(k,'×'+tot[k].c,tot[k].h,'\n   ',[...tot[k].ex].slice(0,4).join('\n    ')));await b.close()})();
