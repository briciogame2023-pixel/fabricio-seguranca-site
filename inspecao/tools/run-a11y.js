/* Auditoria de acessibilidade (axe-core, WCAG 2.x A/AA) nas telas principais, claro e escuro. */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{
  const [file,...only]=process.argv.slice(2);const axe=fs.readFileSync(path.join(__dirname,'axe.min.js'),'utf8');
  const b=await chromium.launch();const telas=only.length?only:['inicio','nova','acomp','trein','ocs','dds','ranking','feed','usuarios','minhas','acidentologia','rsp','ipar','sim','etq','comunic','notif','erg','pert','acid','maoobra','baserh','vinculos','gestao','radar'];
  const tot={};let n=0;
  for(const tema of ['light','dark']){
    const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',colorScheme:tema});const p=await ctx.newPage();
    await p.route('**/*',r=>{const u=r.request().url();(u.startsWith('file:')||u.includes('cdnjs'))?r.continue():r.abort()});
    await p.addInitScript('window.__SEED={};');await p.addInitScript({path:path.join(__dirname,'mock-claude.js')});
    await p.goto('file://'+path.resolve(file));await p.waitForTimeout(1200);await p.addScriptTag({content:axe});
    for(const v of telas){
      await p.evaluate(v=>{try{go(v,undefined,true)}catch(e){}},v);await p.waitForTimeout(250);
      const r=await p.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
      n++;r.violations.forEach(x=>{const k=x.id+' ['+x.impact+']';(tot[k]=tot[k]||{c:0,ex:new Set(),help:x.help});tot[k].c+=x.nodes.length;x.nodes.slice(0,2).forEach(nd=>tot[k].ex.add(tema+':'+v+' '+nd.target.join(' ').slice(0,70)))})}
    await ctx.close()}
  console.log('telas x temas auditadas:',n);
  const ks=Object.keys(tot);if(!ks.length)console.log('Nenhuma violação.');
  ks.sort((a,b)=>tot[b].c-tot[a].c).forEach(k=>console.log(k,'×'+tot[k].c,'—',tot[k].help,'\n    ',[...tot[k].ex].slice(0,3).join('\n     ')));
  await b.close();
})();
