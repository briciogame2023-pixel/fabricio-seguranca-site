/* captura uma tela com o seed de teste: node shot.js arquivo.html saida.png [view] [largura] [altura] [tema] [fullPage] */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const [file,out,view='inicio',w='1440',h='900',tema='light',full='1']=process.argv.slice(2);
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:+w,height:+h},reducedMotion:'reduce',colorScheme:tema});const p=await ctx.newPage();const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))errs.push(m.text())});
await p.route('**/*',r=>{const u=r.request().url();(u.startsWith('file:')||u.includes('cdnjs'))?r.continue():r.abort()});
await p.addInitScript('window.__SEED='+fs.readFileSync(path.join(__dirname,'seed.json'),'utf8')+';');await p.addInitScript({path:path.join(__dirname,'mock-claude.js')});
await p.goto('file://'+path.resolve(file));await p.waitForTimeout(1800);
if(view!=='inicio')await p.evaluate(v=>go(v),view);await p.waitForTimeout(500);
await p.screenshot({path:out,fullPage:full==='1'});console.log('erros:',errs.length?errs:'nenhum');await b.close()})();
