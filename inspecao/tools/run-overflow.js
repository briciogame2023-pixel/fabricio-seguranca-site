/* Detecta rolagem horizontal e elementos que estouram a tela, em todas as telas, por largura. */
const {chromium}=require('playwright');const path=require('path');
(async()=>{
  const [file,...ws]=process.argv.slice(2);const widths=(ws.length?ws:['390','820']).map(Number);const b=await chromium.launch();
  for(const w of widths){
    const ctx=await b.newContext({viewport:{width:w,height:900},reducedMotion:'reduce',hasTouch:w<900,isMobile:w<900});const p=await ctx.newPage();
    await p.route('**/*',r=>{const u=r.request().url();(u.startsWith('file:')||u.includes('cdnjs'))?r.continue():r.abort()});
    await p.addInitScript('window.__SEED={};');await p.addInitScript({path:path.join(__dirname,'mock-claude.js')});
    await p.goto('file://'+path.resolve(file));await p.waitForTimeout(1200);
    const views=['inicio','nova','acomp','acoes','hist','notif','cadastro','usuarios','vinculos','equipe','maoobra','baserh','ocs','ocsnova','ocsresumo','ocsver','relatorio','minhas','trein','treinadd','trcad','tarefa','trrest','trcursof','trturmaf','treinpes','turma','carteira','acid','acidnovo','pert','rsp','rspnova','rspver','acidform','comunic','sim','acidentologia','ipar','iparver','etq','etqver','comunicdet','dds','ranking','feed','radar','gestao','erg','meu'];
    const ruins=[];
    for(const v of views){
      const r=await p.evaluate(v=>{try{go(v,undefined,true)}catch(e){return null}return null},v);await p.waitForTimeout(220);
      const o=await p.evaluate(()=>{const de=document.documentElement,cw=de.clientWidth;const bad=[];document.querySelectorAll('#app *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width>0&&r.right>cw+2&&getComputedStyle(e).position!=='fixed'&&!e.closest('[style*="overflow"],.tabs,.seg,.stcards,.fchips,.ergnav,.tbl,.ipscroll,table,.cvwrap,.nav,svg'))bad.push(e.tagName+'.'+(e.className&&e.className.baseVal===undefined?String(e.className).split(' ')[0]:''))});return{sw:de.scrollWidth,cw,bad:[...new Set(bad)].slice(0,4)}});
      if(o.sw>o.cw+1||o.bad.length)ruins.push(v+' sw='+o.sw+'/'+o.cw+' '+o.bad.join(','))}
    console.log(`largura ${w}px: ${views.length-ruins.length}/${views.length} telas sem estouro`);ruins.forEach(x=>console.log('  -',x));await ctx.close()}
  await b.close();
})();
