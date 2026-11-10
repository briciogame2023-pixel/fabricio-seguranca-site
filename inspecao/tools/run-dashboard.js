/* Testa o dashboard executivo contra o seed sintético, recalculando os valores esperados direto dos dados brutos. */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{
  const [file,out]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
  const seed=JSON.parse(fs.readFileSync(path.join(__dirname,'seed.json'),'utf8'));const I=Object.values(seed.inspecoes),A=Object.values(seed.acoes),HOJE='2026-11-10';
  const R=[];const ok=(n,c,d='')=>R.push([c?'OK ':'FALHA',n,d]);
  const b=await chromium.launch();
  async function nova(w,h,sd,tema='light',touch=false){const ctx=await b.newContext({viewport:{width:w,height:h},reducedMotion:'reduce',colorScheme:tema,hasTouch:touch,isMobile:touch});const p=await ctx.newPage();p.errs=[];
    p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))p.errs.push(m.text())});
    await p.route('**/*',r=>{const u=r.request().url();(u.startsWith('file:')||u.includes('cdnjs'))?r.continue():r.abort()});
    await p.addInitScript('window.__SEED='+JSON.stringify(sd)+';');await p.addInitScript({path:path.join(__dirname,'mock-claude.js')});
    await p.goto('file://'+path.resolve(file));await p.waitForTimeout(1600);return p}
  const kpi=async p=>p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.exk')].map(e=>[e.querySelector('.exk-l').textContent.trim(),e.querySelector('.exk-v').textContent.trim()])));
  const pick=async(p,id,v)=>{await p.selectOption('#'+id,v);await p.waitForTimeout(400)};
  const ano=I.filter(i=>i.data.startsWith('2026')),acAno=A.filter(a=>a.data.startsWith('2026'));
  const venc=a=>a.status!=='Concluída'&&a.prazo<HOJE;
  let p=await nova(1440,900,seed);
  let k=await kpi(p);
  ok('KPIs com dados batem com o cálculo bruto',k['Inspeções realizadas']==='82'&&k['Não conformidades']==='310'&&k['NC tratadas']==='166'&&k['Ações vencidas']==='130'&&k['Ações em andamento']==='14',JSON.stringify(k));
  ok('7 indicadores exibidos (sem pendentes/em andamento de inspeção)',Object.keys(k).length===7);
  ok('semáforo com regra (crítica: 130 de 144 vencidas)',(await p.textContent('.ex-sit h3'))==='Situação crítica');
  for(const t of ['Evolução das inspeções','Índice de conformidade','Distribuição por categoria','Distribuição por área','Não conformidades por classificação','Pendências por responsável','Evolução dos planos de ação','Últimas inspeções','Últimas irregularidades','Ações atualizadas','Aguardando conclusão'])
    ok('bloco presente: '+t,(await p.locator('h4',{hasText:t}).count())>=1);
  /* Responsável */
  const resp='Pessoa Teste 2';const aR=acAno.filter(a=>a.responsavel===resp);
  await pick(p,'xf-resp',resp);k=await kpi(p);
  ok('filtro Responsável: ações vencidas',k['Ações vencidas']===String(aR.filter(venc).length),`${k['Ações vencidas']} esperado ${aR.filter(venc).length}`);
  ok('filtro Responsável: NC = ações do responsável',k['Não conformidades']===String(aR.length),`${k['Não conformidades']} esperado ${aR.length}`);
  ok('chip de filtro ativo visível',await p.locator('[data-xrm="resp"]').count()===1);
  await p.click('[data-xlimpa]');await p.waitForTimeout(400);k=await kpi(p);ok('Limpar tudo restaura',k['Inspeções realizadas']==='82'&&k['Ações vencidas']==='130');
  /* Status */
  await pick(p,'xf-status','Atrasadas');k=await kpi(p);
  ok('filtro Status=Vencida: só vencidas',k['Ações vencidas']==='130'&&k['Ações em andamento']==='0'&&k['Ações concluídas']==='0',JSON.stringify(k));
  ok('Status=Vencida: NC = 130',k['Não conformidades']==='130');
  await p.click('[data-xlimpa]');await p.waitForTimeout(300);
  await pick(p,'xf-status','Concluídas');k=await kpi(p);ok('Status=Concluída: NC tratadas = NC',k['NC tratadas']===k['Não conformidades']&&k['Ações vencidas']==='0',JSON.stringify(k));
  await p.click('[data-xlimpa]');await p.waitForTimeout(300);
  /* Categoria */
  await pick(p,'xf-tipo','area');k=await kpi(p);const nArea=ano.filter(i=>i.tipo==='area').length;
  ok('filtro Categoria',k['Inspeções realizadas']===String(nArea),`${k['Inspeções realizadas']} esperado ${nArea}`);
  await p.click('[data-xlimpa]');await p.waitForTimeout(300);
  /* Área */
  const area=ano[0].area;await pick(p,'xf-area',area);k=await kpi(p);const exA=ano.filter(i=>i.area===area).length;
  ok('filtro Área',k['Inspeções realizadas']===String(exA),`${k['Inspeções realizadas']} esperado ${exA}`);
  await p.click('[data-xlimpa]');await p.waitForTimeout(300);
  /* Período mês atual */
  await p.click('[data-xper] [data-v=mes]');await p.waitForTimeout(400);k=await kpi(p);const mes=I.filter(i=>i.data.startsWith('2026-11')).length;
  ok('período Mês atual',k['Inspeções realizadas']===String(mes),`${k['Inspeções realizadas']} esperado ${mes}`);
  await p.click('[data-xper] [data-v=ano]');await p.waitForTimeout(300);
  /* alternância dos gráficos */
  await p.click('#xCatSeg [data-v=nc]');await p.waitForTimeout(300);ok('categoria alterna para NC',(await p.locator('h4',{hasText:'Distribuição por categoria'}).locator('xpath=..').locator('span').innerText()).includes('Não conformidades'));
  await p.click('#xAreaSeg [data-v=conf]');await p.waitForTimeout(300);ok('área alterna para conformidade',(await p.textContent('.gcard:has(#xAreaSeg) header span')).includes('Menor conformidade'));
  /* cliques de pendência e navegação */
  await p.click('[data-xresp]');await p.waitForTimeout(300);ok('clicar no responsável filtra',await p.locator('[data-xrm="resp"]').count()===1);
  await p.click('[data-xlimpa]');await p.waitForTimeout(300);
  await p.click('.ex-it[data-xdet]');await p.waitForTimeout(500);ok('última inspeção abre o relatório',(await p.textContent('#ttl')).trim()==='Relatório',await p.textContent('#ttl'));
  await p.evaluate(()=>go('inicio'));await p.waitForTimeout(500);
  await p.click('.gcard:has(h4:text("Últimas irregularidades")) .ex-it');await p.waitForTimeout(500);ok('irregularidade abre a ação',(await p.textContent('#ttl')).trim()==='Ação',await p.textContent('#ttl'));
  await p.evaluate(()=>go('inicio'));await p.waitForTimeout(500);
  await p.click('.gcard:has(h4:text("Ações atualizadas")) .ex-it');await p.waitForTimeout(500);ok('ação atualizada abre a ação',(await p.textContent('#ttl')).trim()==='Ação');
  await p.evaluate(()=>go('inicio'));await p.waitForTimeout(500);
  /* aba detalhada preserva o painel original */
  await p.click('[data-xaba=det]');await p.waitForTimeout(600);
  ok('aba Detalhado: painel original (acidentes/OCS) preservado',(await p.locator('.gcard h4',{hasText:'Acidentes mês a mês'}).count())===1&&(await p.locator('.exk').count())===0);
  ok('aba Detalhado: filtros originais funcionam',await p.locator('#fD [data-per]').count()===1);
  await p.screenshot({path:out+'/dash-detalhado.png',fullPage:false});
  await p.click('[data-xaba=exec]');await p.waitForTimeout(400);
  ok('sem erros de console (com dados)',p.errs.length===0,p.errs.join('|').slice(0,200));
  await p.screenshot({path:out+'/dash-exec-desktop.png',fullPage:true});
  await p.context().close();
  /* rascunho em andamento */
  p=await nova(1440,900,seed);
  await p.evaluate(()=>{draft={tipo:'area',ident:{data:hoje(),turno:'',inspetor:'Teste'},respostas:['C','C',null],ncs:{},idx:2};saveDraft()});await p.evaluate(()=>go('inicio'));await p.waitForTimeout(700);
  ok('rascunho aparece em "Aguardando conclusão"',(await p.locator('[data-xretomar]').count())===1,await p.locator('[data-xretomar]').first().innerText().catch(()=>''));
  await p.click('[data-xretomar]');await p.waitForTimeout(500);ok('"Continuar" retoma a inspeção',(await p.evaluate(()=>view))==='quest');
  await p.context().close();
  /* estado vazio (banco sem dados) */
  p=await nova(1440,900,{});
  ok('estado vazio: mensagem honesta',(await p.textContent('.ex-sit h3'))==='Sem dados no período');
  k=await kpi(p);ok('estado vazio: zeros e traço (nada inventado)',k['Inspeções realizadas']==='0'&&k['Taxa de conformidade']==='—'&&k['Não conformidades']==='0',JSON.stringify(k));
  ok('estado vazio: sem erros',p.errs.length===0,p.errs.join('|').slice(0,200));
  await p.screenshot({path:out+'/dash-vazio.png',fullPage:false});await p.context().close();
  /* móvel e escuro */
  p=await nova(390,844,seed,'light',true);
  ok('móvel: sem rolagem horizontal',!(await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1)));
  const ex=await p.evaluate(()=>{const cw=document.documentElement.clientWidth,bad=[];document.querySelectorAll('#app *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.right>cw+2&&!e.closest('svg,.seg,.fchips'))bad.push(e.className)});return bad.slice(0,5)});ok('móvel: nenhum elemento estoura a tela',ex.length===0,ex.join(','));
  await p.screenshot({path:out+'/dash-mobile.png',fullPage:true});await p.context().close();
  p=await nova(1440,900,seed,'dark');await p.screenshot({path:out+'/dash-escuro.png',fullPage:false});await p.context().close();
  console.log(R.map(r=>r.join(' | ')).join('\n'));console.log('\nFALHAS:',R.filter(r=>r[0]!=='OK ').length,'de',R.length);await b.close();
})();
