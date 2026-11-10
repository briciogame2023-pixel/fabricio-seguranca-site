/* Testes de interação do shell: sidebar, busca, configurações, móvel, tema. */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{
  const [file,out]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch();const R=[];const ok=(n,c,d='')=>{R.push([c?'OK ':'FALHA',n,d]);};
  async function nova(w,h,extra={}){const ctx=await b.newContext({viewport:{width:w,height:h},reducedMotion:'reduce',...extra});const p=await ctx.newPage();p.errs=[];
    p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))p.errs.push(m.text())});
    await p.route('**/*',r=>{const u=r.request().url();(u.startsWith('file:')||u.includes('cdnjs'))?r.continue():r.abort()});
    await p.addInitScript('window.__SEED={};');await p.addInitScript({path:path.join(__dirname,'mock-claude.js')});
    await p.goto('file://'+path.resolve(file));await p.waitForTimeout(1200);return p}
  /* DESKTOP */
  let p=await nova(1440,900);
  ok('sidebar visível no desktop',await p.isVisible('#drawer .di'));
  ok('item ativo marcado (aria-current)',await p.locator('#drawer .di[aria-current=page]').count()===1);
  ok('skip-link existe',await p.locator('a.skip').count()===1);
  await p.click('.sb-col');await p.waitForTimeout(300);
  ok('sidebar recolhe',await p.evaluate(()=>document.body.classList.contains('sb-min')));
  await p.hover('#drawer .di[data-go=trein]');await p.waitForTimeout(250);
  ok('tooltip no modo recolhido',await p.evaluate(()=>document.querySelector('.sb-tip').classList.contains('on')&&document.querySelector('.sb-tip').textContent.length>0),await p.textContent('.sb-tip'));
  await p.screenshot({path:out+'/desk-recolhida.png'});
  await p.click('.sb-col');await p.waitForTimeout(250);
  ok('sidebar expande',await p.evaluate(()=>!document.body.classList.contains('sb-min')));
  await p.click('#drawer .ds[data-g="Comunidade"]');ok('grupo recolhe',await p.evaluate(()=>document.querySelector('#drawer .ds[data-g="Comunidade"]').getAttribute('aria-expanded')==='false'));
  await p.click('#drawer .ds[data-g="Comunidade"]');
  await p.keyboard.press('Control+k');await p.waitForTimeout(200);
  ok('paleta Ctrl+K abre',await p.isVisible('.pal'));
  await p.keyboard.type('trein');await p.waitForTimeout(150);
  ok('paleta filtra',(await p.locator('.pal-l button').count())>=1,await p.locator('.pal-l button').first().innerText());
  await p.screenshot({path:out+'/desk-paleta.png'});
  await p.keyboard.press('Enter');await p.waitForTimeout(400);
  ok('paleta navega (Enter) para Treinamentos',(await p.textContent('#ttl')).includes('Treinamentos'),await p.textContent('#ttl'));
  ok('paleta fecha ao navegar',!(await p.isVisible('.pal').catch(()=>false)));
  await p.click('#cfg');await p.waitForTimeout(200);
  ok('popover de configurações abre',await p.isVisible('.pop'));await p.screenshot({path:out+'/desk-config.png'});
  await p.click('.pop [data-t=dark]');await p.waitForTimeout(250);
  ok('tema escuro aplicado',await p.evaluate(()=>document.documentElement.dataset.theme==='dark'));
  await p.goto('file://'+path.resolve(file));await p.waitForTimeout(1200);
  await p.evaluate(()=>go('inicio'));await p.waitForTimeout(300);await p.screenshot({path:out+'/desk-escuro.png'});
  ok('tema persiste após recarregar',await p.evaluate(()=>document.documentElement.dataset.theme==='dark'));
  await p.keyboard.press('Escape');
  ok('sem erros de console (desktop)',p.errs.length===0,p.errs.join(' | ').slice(0,200));
  /* TECLADO: Tab chega à sidebar */
  p=await nova(1440,900);await p.keyboard.press('Tab');ok('1º Tab foca o skip-link',await p.evaluate(()=>document.activeElement.classList.contains('skip')));
  /* TABLET */
  p=await nova(820,1100);ok('tablet: sidebar oculta/off-canvas (abaixo de 1000px)',!(await p.evaluate(()=>document.querySelector('#drawer').getBoundingClientRect().right>1)));
  await p.screenshot({path:out+'/tablet-inicio.png'});
  /* MÓVEL */
  p=await nova(390,844,{hasTouch:true,isMobile:true,deviceScaleFactor:2});
  ok('móvel: barra inferior visível',await p.isVisible('.nav'));ok('móvel: busca de topo oculta',!(await p.isVisible('#busca')));
  await p.screenshot({path:out+'/mob-inicio.png'});
  await p.click('#menu');await p.waitForTimeout(350);
  ok('móvel: menu abre',await p.evaluate(()=>document.querySelector('#drawer').classList.contains('open')));ok('móvel: aria-expanded true',await p.getAttribute('#menu','aria-expanded')==='true');
  await p.screenshot({path:out+'/mob-menu.png'});
  await p.keyboard.press('Escape');await p.waitForTimeout(300);ok('móvel: Esc fecha menu',await p.evaluate(()=>!document.querySelector('#drawer').classList.contains('open')));
  await p.click('.nav [data-go=acomp]');await p.waitForTimeout(400);ok('móvel: navegação inferior funciona',(await p.textContent('#ttl')).includes('Acompanhamento'));
  const ov=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);ok('móvel: sem rolagem horizontal',!ov);
  await p.screenshot({path:out+'/mob-acoes.png'});
  ok('sem erros de console (móvel)',p.errs.length===0,p.errs.join(' | ').slice(0,200));
  console.log(R.map(r=>r.join(' | ')).join('\n'));console.log('\nFALHAS:',R.filter(r=>r[0]!=='OK ').length,'de',R.length);
  await b.close();
})();
