/* Percorre todas as telas, mede erros de console e tira capturas.
   uso: node run-tour.js <arquivo.html> <pastaSaida> [largura] [altura] */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{
  const [file,out,w='1440',h='900']=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:+w,height:+h},deviceScaleFactor:1,reducedMotion:'reduce'});
  const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:')||u.includes('cdnjs')||u.includes('fonts.g'))return r.continue();r.abort()});
  const seed=fs.existsSync(path.join(__dirname,'seed.json'))?fs.readFileSync(path.join(__dirname,'seed.json'),'utf8'):'{}';
  await p.addInitScript('window.__SEED='+seed+';');
  await p.addInitScript({path:path.join(__dirname,'mock-claude.js')});
  await p.goto('file://'+path.resolve(file));await p.waitForTimeout(1500);
  const views=await p.evaluate(()=>{try{return Object.keys({erg:1,inicio:1,meu:1,radar:1,feed:1,dds:1,ranking:1,nova:1,gestao:1,ident:1,quest:1,resumo:1,done:1,acomp:1,acoes:1,hist:1,detalhe:1,acao:1,notif:1,cadastro:1,usuarios:1,vinculos:1,equipe:1,maoobra:1,baserh:1,ocs:1,ocsnova:1,ocsresumo:1,ocsok:1,ocsver:1,relatorio:1,minhas:1,trein:1,treinadd:1,trcad:1,tarefa:1,trrest:1,trcursof:1,trturmaf:1,treinpes:1,turma:1,carteira:1,acid:1,acidnovo:1,pert:1,rsp:1,rspnova:1,rspver:1,acidform:1,comunic:1,sim:1,acidentologia:1,ipar:1,iparver:1,etq:1,etqver:1,comunicdet:1})}catch(e){return[]}});
  const res={};
  for(const v of views){
    const before=errs.length;
    try{await p.evaluate(v=>{window.go(v,undefined,true)},v);await p.waitForTimeout(250);
      const info=await p.evaluate(()=>({t:document.querySelector('#ttl')?.textContent||document.querySelector('h1,h2')?.textContent||'',len:document.querySelector('#app')?.innerText.length||0}));
      res[v]={ok:true,...info,erros:errs.slice(before)};
      await p.screenshot({path:path.join(out,v+'.png'),fullPage:false});
    }catch(e){res[v]={ok:false,erro:e.message.slice(0,120)}}
  }
  fs.writeFileSync(path.join(out,'_relatorio.json'),JSON.stringify({erros:errs,views:res},null,1));
  const bad=Object.entries(res).filter(([k,v])=>!v.ok||v.erros?.length);
  console.log('telas',views.length,'| com erro:',bad.length,'| erros totais:',errs.length);
  bad.slice(0,15).forEach(([k,v])=>console.log(' -',k,JSON.stringify(v.erros||v.erro).slice(0,160)));
  await b.close();
})();
