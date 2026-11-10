/* ==========================================================================
   INSPEÇÕES SSMA — Dashboard executivo (Painel geral > aba "Executivo")
   Usa SOMENTE os dados reais já carregados pelo app (INSP, ACOES) e os mesmos
   filtros/funções do painel original (dInsp, dAcoes, stAcao, vencida, gráficos).
   Nada é inventado: sem dado, o bloco mostra estado vazio.
   A visão anterior continua intacta na aba "Detalhado".
   ========================================================================== */
(()=>{
"use strict";
if(typeof vInicio!=="function"||typeof dInsp!=="function")return;
const _vInicio=window.vInicio,_bindInicio=bind.inicio;
let aba="exec",catVis="tipo",areaVis="insp";
const E=s=>esc(String(s==null?"":s));
const LI=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${(window.__LUC||{})[n]||""}</svg>`;
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const semNum=t=>String(t||"").replace(/^\s*\d+\.\s*/,"");
const curto=(t,n)=>t.length>n?t.slice(0,n-1)+"…":t;
const pt=(a,b)=>String(a).localeCompare(String(b),"pt-BR");
const ST_ROT={"Concluídas":"Concluída","Em andamento":"Em andamento","Atrasadas":"Vencida"};

/* ---------- dados filtrados (mesmos filtros do app + Categoria, Responsável e Status) ---------- */
function base(F,semPer){
  const mapa=new Map(ACOES.map(a=>[a._id,a]));
  let ins=dInsp(F,semPer).filter(inspVisivel);
  let ac=dAcoes(F,semPer).filter(acaoVisivel);
  if(F.tipo){ins=ins.filter(i=>i.tipo===F.tipo);const nm=CL[F.tipo]&&CL[F.tipo].nome;ac=ac.filter(a=>a.tipoNome===nm)}
  if(F.resp){ac=ac.filter(a=>a.responsavel===F.resp);
    ins=ins.filter(i=>i.inspetor===F.resp||i.responsavel_area===F.resp||(i.ncs||[]).some(n=>{const a=mapa.get(n.acaoId);return a&&a.responsavel===F.resp}))}
  if(F.status)ac=ac.filter(a=>stAcao(a)===F.status);
  /* não conformidades = itens "NC" das inspeções filtradas, ligados à ação criada para cada uma */
  let ncs=[];ins.forEach(i=>(i.ncs||[]).forEach(n=>{if(n.acaoExcluida)return;const a=mapa.get(n.acaoId);ncs.push({i,n,a,st:a?stAcao(a):"Sem ação"})}));
  if(F.resp)ncs=ncs.filter(x=>x.a&&x.a.responsavel===F.resp);
  if(F.status)ncs=ncs.filter(x=>x.st===F.status);
  return {ins,ac,ncs};
}
function indicadores(F){
  const {ins,ac,ncs}=base(F);
  const co=sum(ins,i=>i.totais.conformes),ap=sum(ins,i=>i.totais.aplicaveis);
  const conc=ac.filter(a=>stAcao(a)==="Concluídas"),noPrazo=conc.filter(a=>!a.prazo||(a.conclusao&&a.conclusao.data<=a.prazo));
  const and=ac.filter(a=>stAcao(a)==="Em andamento"),ven=ac.filter(a=>stAcao(a)==="Atrasadas");
  const trat=ncs.filter(x=>x.st==="Concluídas");
  return {ins,ac,ncs,conf:ap?co/ap*100:null,co,ap,conc:conc.length,noPrazo:conc.length?noPrazo.length/conc.length*100:null,and:and.length,ven:ven.length,
    abertas:and.length+ven.length,nc:ncs.length,trat:trat.length,pTrat:ncs.length?trat.length/ncs.length*100:null};
}

/* ---------- blocos ---------- */
function semaforo(m,F){
  const porArea=(()=>{const c={};m.ins.forEach(i=>{c[i.area]=c[i.area]||{c:0,a:0};c[i.area].c+=i.totais.conformes;c[i.area].a+=i.totais.aplicaveis});return Object.entries(c).filter(([,v])=>v.a).map(([k,v])=>[k,v.c/v.a*100]).sort((a,b)=>a[1]-b[1])})();
  const resp=(()=>{const c={};m.ac.filter(a=>a.status!=="Concluída").forEach(a=>{const k=a.responsavel||"Sem responsável";c[k]=(c[k]||0)+1});return Object.entries(c).sort((a,b)=>b[1]-a[1])})();
  if(!m.ins.length&&!m.ac.length)return `<section class="ex-sit s-vazio" aria-label="Situação geral"><div class="ex-sit-ic">${LI("triangle-alert")}</div><div><h3>Sem dados no período</h3><p>Nenhuma inspeção ou ação registrada com os filtros atuais. Amplie o período ou limpe os filtros.</p></div></section>`;
  const pVen=m.abertas?m.ven/m.abertas*100:0;
  const nivel=(m.conf!==null&&m.conf<80)||pVen>20?"crit":(m.conf!==null&&m.conf<90)||m.ven>0?"aten":"ok";
  const titulo={ok:"Operação sob controle",aten:"Atenção necessária",crit:"Situação crítica"}[nivel];
  const pts=[];
  if(m.conf!==null)pts.push(`Conformidade das inspeções em <b>${pct(m.conf)}</b> (meta ≥ 90%)`);
  if(m.abertas)pts.push(m.ven?`<b>${m.ven}</b> de ${m.abertas} ações abertas estão vencidas`:`Nenhuma das ${m.abertas} ações abertas está vencida`);
  if(porArea.length&&porArea[0][1]<90)pts.push(`Menor conformidade: <b>${E(porArea[0][0])}</b> (${pct(porArea[0][1])})`);
  if(resp.length&&resp[0][1]>1)pts.push(`Mais pendências: <b>${E(resp[0][0])}</b> (${resp[0][1]} ações abertas)`);
  if(m.nc&&m.pTrat!==null)pts.push(`${m.trat} de ${m.nc} não conformidades já tratadas (${pct(m.pTrat)})`);
  return `<section class="ex-sit s-${nivel}" aria-label="Situação geral"><div class="ex-sit-ic" aria-hidden="true">${nivel==="ok"?LI("shield-check"):LI("triangle-alert")}</div>
    <div class="ex-sit-tx"><span class="ex-eyebrow">Situação geral</span><h3>${titulo}</h3><ul>${pts.map(p=>`<li>${p}</li>`).join("")}</ul></div>
    <details class="ex-como"><summary>Como é calculado</summary><p><b>Crítica</b>: conformidade abaixo de 80% ou mais de 20% das ações abertas vencidas. <b>Atenção</b>: conformidade abaixo de 90% ou qualquer ação vencida. <b>Sob controle</b>: conformidade a partir de 90% e nenhuma ação vencida. As faixas são as mesmas já usadas na conformidade por área.</p></details></section>`;
}
function kpis(m){
  const k=(rot,v,cls,sub,barra)=>`<div class="exk ${cls||""}" role="listitem"><span class="exk-l">${rot}</span><b class="exk-v">${v}</b>${barra!=null?`<span class="exk-bar" aria-hidden="true"><i style="width:${Math.max(0,Math.min(100,barra))}%"></i></span>`:""}${sub?`<small>${sub}</small>`:""}</div>`;
  const cc=m.conf==null?"":m.conf>=90?"k-ok":m.conf>=80?"k-warn":"k-bad";
  return `<div class="ex-kpis" role="list" aria-label="Indicadores principais">
   ${k("Inspeções realizadas",m.ins.length,"",m.ins.length?"todas concluídas":"nenhuma no período")}
   ${k("Taxa de conformidade",m.conf==null?"—":pct(m.conf),cc,m.conf==null?"sem itens avaliados":`${m.co} conformes de ${m.ap} aplicáveis`,m.conf)}
   ${k("Não conformidades",m.nc,m.nc?"k-bad":"","identificadas nas inspeções")}
   ${k("NC tratadas",m.trat,m.trat?"k-ok":"",m.pTrat==null?"sem NC no período":`${pct(m.pTrat)} das NC (ação concluída)`,m.pTrat)}
   ${k("Ações em andamento",m.and,m.and?"k-info":"",`${m.abertas} abertas no total`)}
   ${k("Ações vencidas",m.ven,m.ven?"k-bad":"k-ok",m.ven?"prazo já passou":"nenhuma vencida")}
   ${k("Ações concluídas",m.conc,m.conc?"k-ok":"",m.noPrazo==null?"sem ações concluídas":`${pct(m.noPrazo)} dentro do prazo`,m.noPrazo)}
  </div>
  <p class="ex-nota">Inspeções pendentes ou em andamento não são contadas: o app só grava a inspeção quando ela é concluída. O rascunho em andamento aparece em “Atividade recente”.</p>`;
}
function gauge(v){
  const r=54,c=2*Math.PI*r,len=v==null?0:c*Math.min(100,v)/100,cor=v==null?"var(--line-strong)":v>=90?"var(--ok-fill)":v>=80?"var(--warn-fill)":"var(--bad-fill)";
  return `<svg viewBox="0 0 140 140" class="ex-gauge" role="img" aria-label="Índice de conformidade: ${v==null?"sem dados":pct(v)}"><circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="14"/>
   <circle cx="70" cy="70" r="${r}" fill="none" stroke="${cor}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 70 70)"/>
   <text x="70" y="72" text-anchor="middle" class="ex-gv">${v==null?"—":pct(v)}</text><text x="70" y="92" text-anchor="middle" class="ex-gl">conformidade</text></svg>`;
}
const card=(t,sub,corpo,extra,cls)=>`<section class="gcard ex-c ${cls||""}"><header><div><h4>${t}</h4>${sub?`<span>${sub}</span>`:""}</div>${extra||""}</header>${corpo}</section>`;
const seg=(id,ops,cur)=>`<div class="seg mini" id="${id}">${ops.map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${cur===v}">${l}</button>`).join("")}</div>`;

function porMesX(F){
  const ms=mesesDe(F),Fs={...F,per:"tudo"},b=base(Fs,true);
  return ms.map(m=>{const i=b.ins.filter(x=>(x.data||"").startsWith(m.k)),a=b.ac.filter(x=>(x.data||"").startsWith(m.k));
    const co=sum(i,x=>x.totais.conformes),ap=sum(i,x=>x.totais.aplicaveis);
    return {...m,ins:i.length,conf:ap?Math.round(co/ap*1000)/10:null,
      conc:a.filter(x=>stAcao(x)==="Concluídas").length,and:a.filter(x=>stAcao(x)==="Em andamento").length,atr:a.filter(x=>stAcao(x)==="Atrasadas").length}});
}
function pendencias(m){
  const c={};m.ac.filter(a=>a.status!=="Concluída").forEach(a=>{const k=a.responsavel||"Sem responsável";c[k]=c[k]||{p:0,v:0};vencida(a)?c[k].v++:c[k].p++});
  const l=Object.entries(c).sort((a,b)=>(b[1].p+b[1].v)-(a[1].p+a[1].v)||b[1].v-a[1].v).slice(0,8);
  if(!l.length)return `<div class="gvazio">Nenhuma ação em aberto.</div>`;
  const mx=Math.max(...l.map(([,v])=>v.p+v.v));
  return `<div class="ex-pr" role="list">${l.map(([n,v])=>`<button type="button" class="ex-pr-r" role="listitem" data-xresp="${E(n)}" title="Filtrar por ${E(n)}"><span class="ex-pr-n">${E(curto(n,34))}</span>
    <span class="ex-pr-t" aria-hidden="true"><i class="p" style="width:${v.p/mx*100}%"></i><i class="v" style="width:${v.v/mx*100}%"></i></span>
    <span class="ex-pr-v"><b>${v.p+v.v}</b>${v.v?` <em>${v.v} vencida${v.v>1?"s":""}</em>`:""}</span></button>`).join("")}</div>
    <div class="ex-leg"><span><i class="p"></i>No prazo</span><span><i class="v"></i>Vencidas</span></div>`;
}
function recentes(m){
  const dt=x=>{const d=x&&String(x).slice(0,10);return d?br(d):""};
  const dh=x=>{if(!x)return "";const d=new Date(x);return isNaN(d)?"":d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})+" "+d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})};
  const vazio=t=>`<p class="ex-vz">${t}</p>`;
  const lastIns=[...m.ins].sort((a,b)=>String(b.criadoEm||b.data).localeCompare(String(a.criadoEm||a.data))).slice(0,5);
  const lastNC=[...m.ncs].sort((a,b)=>String(b.i.criadoEm||b.i.data).localeCompare(String(a.i.criadoEm||a.i.data))).slice(0,5);
  const lastAc=[...m.ac].filter(a=>a.atualizadoEm).sort((a,b)=>String(b.atualizadoEm).localeCompare(String(a.atualizadoEm))).slice(0,5);
  let rasc=null;try{rasc=loadDraft()}catch(e){}
  const insL=lastIns.map(i=>{const p=i.totais.aplicaveis?i.totais.conformes/i.totais.aplicaveis*100:null;return `<li><button type="button" class="ex-it" data-xdet="${E(i.id)}"><span class="ex-it-t">${E(i.tipoNome||"Inspeção")}</span><span class="ex-it-s">${E([i.area,i.setor].filter(Boolean).join(" · "))}</span><span class="ex-it-m">${dt(i.data)}${i.inspetor?" · "+E(i.inspetor):""}</span>${p!=null?`<span class="chip ${p>=90?"Concluída":p>=80?"Aberta":"venc"}">${pct(p)}</span>`:""}</button></li>`}).join("");
  const ncL=lastNC.map(x=>`<li><button type="button" class="ex-it" ${x.a?`data-xac="${E(x.a._id)}"`:`data-xdet="${E(x.i.id)}"`}><span class="ex-it-t">${E(curto(x.n.descricao||x.n.pergunta||"Não conformidade",70))}</span><span class="ex-it-s">${E([x.i.area,x.n.risco].filter(Boolean).join(" · "))}</span><span class="ex-it-m">${dt(x.i.data)}</span><span class="chip ${x.st==="Concluídas"?"Concluída":x.st==="Atrasadas"?"venc":x.st==="Sem ação"?"Aberta":"Em"}">${x.st==="Sem ação"?"Sem ação":ST_ROT[x.st]}</span></button></li>`).join("");
  const acL=lastAc.map(a=>{const h=(a.historico||[]).slice(-1)[0]||{};const st=stAcao(a);return `<li><button type="button" class="ex-it" data-xac="${E(a._id)}"><span class="ex-it-t">${E(curto(a.acao||a.descricao||"Ação",70))}</span><span class="ex-it-s">${E(h.evento||"Atualizada")} · ${E(a.responsavel||"sem responsável")}</span><span class="ex-it-m">${dh(a.atualizadoEm)}</span><span class="chip ${st==="Concluídas"?"Concluída":st==="Atrasadas"?"venc":"Em"}">${ST_ROT[st]}</span></button></li>`}).join("");
  let rascL="";
  if(rasc&&rasc.tipo&&CL[rasc.tipo]){const tot=itens(rasc.tipo).length,fe=(rasc.respostas||[]).filter(Boolean).length;
    rascL=`<li><button type="button" class="ex-it" data-xretomar><span class="ex-it-t">${E(CL[rasc.tipo].nome)} em andamento</span><span class="ex-it-s">${fe} de ${tot} itens respondidos</span><span class="ex-it-m">Rascunho neste aparelho</span><span class="chip Em">Continuar</span></button></li>`}
  return `<div class="ex-rec">
   ${card("Últimas inspeções","As 5 mais recentes",insL?`<ul class="ex-ul">${insL}</ul>`:vazio("Nenhuma inspeção no período."),"","")}
   ${card("Últimas irregularidades","Não conformidades mais recentes",ncL?`<ul class="ex-ul">${ncL}</ul>`:vazio("Nenhuma não conformidade no período."),"","")}
   ${card("Ações atualizadas","Movimentações mais recentes",acL?`<ul class="ex-ul">${acL}</ul>`:vazio("Nenhuma ação movimentada no período."),"","")}
   ${card("Aguardando conclusão","Inspeção iniciada e ainda não concluída",rascL?`<ul class="ex-ul">${rascL}</ul>`:vazio("Você não tem inspeção em andamento neste aparelho. O app só salva a inspeção quando ela é concluída."),"","")}
  </div>`;
}
function filtros(F){
  const nomes=new Set();INSP.filter(inspVisivel).forEach(i=>{if(i.inspetor)nomes.add(i.inspetor);if(i.responsavel_area)nomes.add(i.responsavel_area)});ACOES.filter(acaoVisivel).forEach(a=>{if(a.responsavel)nomes.add(a.responsavel)});
  const sel=(id,k,rot,ops,ph)=>`<div class="fl"><label for="${id}"><span>${rot}</span></label><select class="t" id="${id}" data-xk="${k}"><option value="">${ph}</option>${ops.map(([v,l])=>`<option value="${E(v)}" ${F[k]===v?"selected":""}>${E(l)}</option>`).join("")}</select></div>`;
  const ativos=[["tipo",F.tipo&&CL[F.tipo]?CL[F.tipo].nome:""],["area",F.area],["resp",F.resp?"Responsável: "+F.resp:""],["status",F.status?"Status: "+ST_ROT[F.status]:""],["grupo",F.grupo!=="Todos"?F.grupo:""],["setor",F.setor],["maq",F.maq==="SIM"?"Máquinas do SIM":F.maq==="FORA"?"Fora do SIM":F.maq],["turno",F.turno],["gerente",F.gerente?"Gerente: "+F.gerente:""],["coord",F.coord?"Coord.: "+F.coord:""]].filter(x=>x[1]);
  const per=[["semana","Semana"],["mes","Mês atual"],["ano","Ano"],["tudo","Tudo"],["data","Escolher datas"]];
  return `<div class="fbox ex-f" id="xf" role="group" aria-label="Filtros do painel">
   <div class="seg" data-xper>${per.map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${F.per===v}">${l}</button>`).join("")}</div>
   ${F.per==="data"?`<div class="drange"><div class="fl"><label for="xf-de"><span>De</span></label><input class="t" type="date" id="xf-de" data-xdt="de" value="${E(F.de)}" ${F.ate?`max="${F.ate}"`:""}></div><div class="fl"><label for="xf-ate"><span>Até</span></label><input class="t" type="date" id="xf-ate" data-xdt="ate" value="${E(F.ate)}" ${F.de?`min="${F.de}"`:""}></div></div>`:""}
   <div class="ex-fsel">${sel("xf-tipo","tipo","Categoria",ORDEM.filter(t=>CL[t]).map(t=>[t,CL[t].nome]),"Todas")}
    ${sel("xf-area","area","Área",LISTAS.areas.map(a=>[a.nome,a.nome]),"Todas as áreas")}
    ${sel("xf-resp","resp","Responsável",[...nomes].sort(pt).map(n=>[n,n]),nomes.size?"Todos":"Sem responsáveis ainda")}
    ${sel("xf-status","status","Status das ações",[["Concluídas","Concluída"],["Em andamento","Em andamento"],["Atrasadas","Vencida"]],"Todos")}</div>
   ${ativos.length?`<div class="ex-fa"><div class="fchips">${ativos.map(([k,v])=>`<button type="button" class="fchip" data-xrm="${k}" aria-label="Remover filtro ${E(v)}">${E(v)} ✕</button>`).join("")}</div><button type="button" class="lnk2" data-xlimpa>Limpar tudo</button></div>`:""}
  </div>`;
}
function avisoFiltro(F){return (F.status||F.resp)?`<p class="ex-aviso">${F.status?"O status filtra as ações e as não conformidades. ":""}${F.resp?"O responsável filtra as ações e as inspeções em que ele atua. ":""}Inspeções e conformidade seguem o período, a categoria e a área.</p>`:""}
function ligaFiltros2(F){
  const box=document.getElementById("xf");if(!box)return;
  box.querySelectorAll("[data-xper] button").forEach(b=>b.onclick=()=>{F.per=b.dataset.v;if(F.per==="data"&&!F.de){const h=hoje();F.de=h.slice(0,8)+"01";F.ate=h}render()});
  box.querySelectorAll("[data-xdt]").forEach(i=>i.onchange=()=>{F[i.dataset.xdt]=i.value;render()});
  box.querySelectorAll("[data-xk]").forEach(s=>s.onchange=()=>{const k=s.dataset.xk;F[k]=s.value;if(k==="area"){F.setor="";if(F.maq&&F.maq!=="SIM"&&F.maq!=="FORA")F.maq=""}render()});
  box.querySelectorAll("[data-xrm]").forEach(b=>b.onclick=()=>{const k=b.dataset.xrm;F[k]=k==="grupo"?"Todos":"";if(k==="area"){F.setor="";F.maq=""}render()});
  const l=box.querySelector("[data-xlimpa]");if(l)l.onclick=()=>{const p=F.per;Object.assign(F,F0(p),{tipo:"",resp:"",status:""});render()};
}

/* ---------- tela ---------- */
function corpoExec(F){
  const m=indicadores(F),pm=porMesX(F),W2=gwh;
  let h=semaforo(m,F)+kpis(m);
  /* evolução */
  GCLICK.xAcMes=i=>{const k=pm[i].k,[y,mm]=k.split("-");F.per="data";F.de=k+"-01";F.ate=`${k}-${String(new Date(+y,+mm,0).getDate()).padStart(2,"0")}`;render();toast("Filtrado: "+pm[i].rot)};
  h+=`<div class="ex-grid">`;
  h+=card("Evolução das inspeções","Inspeções concluídas por mês",gColunas("xInsMes",{w:W2(),labels:pm.map(x=>x.rot),series:[{nome:"Inspeções",cor:COR.verde,vals:pm.map(x=>x.ins)}]}),"","span-6");
  h+=card("Índice de conformidade","Itens conformes ÷ itens aplicáveis",`<div class="ex-conf">${gauge(m.conf)}<div class="ex-conf-l"><div class="ex-leg col"><span><i class="o"></i>Meta ≥ 90%</span><span><i class="w"></i>Atenção 80–89,9%</span><span><i class="b"></i>Crítico &lt; 80%</span></div></div></div>`+gLinhas("xConf",{w:W2(),h:200,labels:pm.map(x=>x.rot),suf:"%",min:0,max:100,series:[{nome:"Conformidade",cor:COR.graf,vals:pm.map(x=>x.conf)}]}),"","span-6");
  /* categoria */
  const tip=ORDEM.filter(t=>CL[t]).map((t,i)=>[CL[t].nome.replace("Inspeção de ",""),m.ins.filter(x=>x.tipo===t).length,PALETA[i%PALETA.length]]).filter(x=>x[1]);
  const ncCat={};m.ncs.forEach(x=>{const k=semNum(x.n.cat)||"Sem categoria";ncCat[k]=(ncCat[k]||0)+1});
  const catL=Object.entries(ncCat).sort((a,c)=>c[1]-a[1]);
  h+=card("Distribuição por categoria",catVis==="tipo"?"Inspeções por ferramenta":"Não conformidades por categoria do roteiro",
    catVis==="tipo"?gRosca("xCatT",{itens:tip,sub:"inspeções"}):gBarrasH("xCatN",{w:W2(),itens:catL,cor:COR.verm}),seg("xCatSeg",[["tipo","Inspeções"],["nc","Não conformidades"]],catVis),"span-6");
  /* área */
  const ia={};m.ins.forEach(i=>{const k=i.area||"Sem área";ia[k]=ia[k]||{n:0,c:0,a:0,nc:0};ia[k].n++;ia[k].c+=i.totais.conformes;ia[k].a+=i.totais.aplicaveis});
  m.ncs.forEach(x=>{const k=x.i.area||"Sem área";ia[k]=ia[k]||{n:0,c:0,a:0,nc:0};ia[k].nc++});
  const aItens=areaVis==="insp"?Object.entries(ia).map(([k,v])=>[k,v.n]).sort((a,c)=>c[1]-a[1]):areaVis==="nc"?Object.entries(ia).map(([k,v])=>[k,v.nc]).filter(x=>x[1]).sort((a,c)=>c[1]-a[1]):Object.entries(ia).filter(([,v])=>v.a).map(([k,v])=>{const p=Math.round(v.c/v.a*1000)/10;return [k,p,p>=90?COR.verde:p>=80?COR.ambar:COR.verm]}).sort((a,c)=>a[1]-c[1]);
  GCLICK.xArea=i=>{if(aItens[i]){F.area=aItens[i][0];F.setor="";render()}};
  h+=card("Distribuição por área",areaVis==="insp"?"Inspeções por área · toque para filtrar":areaVis==="nc"?"Não conformidades por área · toque para filtrar":"Menor conformidade no topo · toque para filtrar",
    gBarrasH("xArea",{w:W2(),itens:aItens,clique:1,cor:areaVis==="nc"?COR.verm:COR.graf,suf:areaVis==="conf"?"%":undefined,max:10}),seg("xAreaSeg",[["insp","Inspeções"],["nc","NC"],["conf","Conformidade"]],areaVis),"span-6");
  /* NC por classificação + tratamento */
  const rk={};m.ncs.forEach(x=>{const k=x.n.risco||"Não determinado";rk[k]=(rk[k]||0)+1});
  const rkL=Object.entries(rk).sort((a,c)=>c[1]-a[1]).map(([k,v],i)=>[k,v,PALETA[i%PALETA.length]]);
  h+=card("Não conformidades por classificação","Tipo de risco informado em cada NC",gRosca("xRisco",{itens:rkL,sub:"NC"}),"","span-4");
  h+=card("Pendências por responsável","Ações abertas · toque para filtrar",pendencias(m),"","span-4");
  const st=["Concluídas","Em andamento","Atrasadas"].map(s=>[s==="Atrasadas"?"Vencidas":s,m.ac.filter(a=>stAcao(a)===s).length,COR_ST[s]]);
  h+=card("Situação dos planos de ação","Ações do período filtrado",gRosca("xSt",{itens:st,sub:"ações"}),"","span-4");
  h+=card("Evolução dos planos de ação","Ações criadas por mês, por situação atual · toque em um mês para filtrar",gColunas("xAcMes",{w:gwf(),h:gwf()>900?280:undefined,labels:pm.map(x=>x.rot),empilhado:true,clique:1,series:[{nome:"Concluídas",cor:COR_ST["Concluídas"],vals:pm.map(x=>x.conc)},{nome:"Em andamento",cor:COR_ST["Em andamento"],vals:pm.map(x=>x.and)},{nome:"Vencidas",cor:COR_ST["Atrasadas"],vals:pm.map(x=>x.atr)}]}),"","span-12");
  h+=`</div><h3 class="ex-h3">Atividade recente</h3>`+recentes(m);
  return h;
}
function ultimoRegistro(){
  const ds=[...INSP.filter(inspVisivel).map(i=>i.criadoEm),...ACOES.filter(acaoVisivel).map(a=>a.atualizadoEm||a.criadoEm)].filter(Boolean).sort();
  if(!ds.length)return "";const d=new Date(ds[ds.length-1]);return isNaN(d)?"":`Último registro em ${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}`;
}
window.vInicio=function(){
  if(!filtroD)filtroD=F0("ano");const F=filtroD;
  if(F.tipo===undefined){F.tipo="";F.resp="";F.status=""}
  let h=`<div class="dhead"><div><span class="m">Olá${ME.name?", "+E(ME.name.split(" ")[0]):""} · ${new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</span><h2>Painel de Segurança</h2>${aba==="exec"?`<span class="m">${ultimoRegistro()}</span>`:""}</div>
   <div class="dbtns">${ORDEM.some(podeTipo)?`<button class="btn ok sm" data-go="nova">+ Inspeção</button>`:""}<button class="btn ok sm" data-go="ocs">+ OCS</button>${pode("radar")?`<button class="btn sm" data-go="relatorio">📄 Emitir relatório</button>`:""}</div></div>
   <div class="ex-tabs" role="group" aria-label="Tipo de painel"><button type="button" data-xaba="exec" aria-pressed="${aba==="exec"}">Executivo</button><button type="button" data-xaba="det" aria-pressed="${aba==="det"}">Detalhado <small>acidentes · OCS · DDS</small></button></div>`;
  if(aba==="exec")return h+filtros(F)+avisoFiltro(F)+corpoExec(F);
  /* aba detalhada: painel original, sem o cabeçalho duplicado */
  const t=document.createElement("div");t.innerHTML=_vInicio();const dh=t.querySelector(".dhead");if(dh)dh.remove();
  return h+t.innerHTML;
};
bind.inicio=()=>{
  document.querySelectorAll("[data-xaba]").forEach(b=>b.onclick=()=>{aba=b.dataset.xaba;render()});
  ligaGo();
  if(aba==="det"){_bindInicio();return}
  const F=filtroD;ligaFiltros2(F);
  const sg=(id,fn)=>document.querySelectorAll("#"+id+" button").forEach(b=>b.onclick=()=>{fn(b.dataset.v);render()});
  sg("xCatSeg",v=>catVis=v);sg("xAreaSeg",v=>areaVis=v);
  document.querySelectorAll("[data-xresp]").forEach(b=>b.onclick=()=>{F.resp=b.dataset.xresp;render()});
  document.querySelectorAll("[data-xdet]").forEach(b=>b.onclick=()=>go("detalhe",{sel:b.dataset.xdet}));
  document.querySelectorAll("[data-xac]").forEach(b=>b.onclick=()=>{acForm=null;go("acao",{sel:b.dataset.xac})});
  const rt=document.querySelector("[data-xretomar]");if(rt)rt.onclick=()=>{draft=loadDraft();go("quest")};
};
})();
