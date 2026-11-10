/* ==========================================================================
   INSPEÇÕES SSMA — Camada de interface (shell, sidebar, busca, ícones).
   Roda DEPOIS do app original. Não altera dados, permissões nem regras:
   apenas envolve render()/montaMenu() para decorar a interface.
   ========================================================================== */
(()=>{
"use strict";
const LUC=window.__LUC||{};
const L=(n,cls)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${cls?` class="${cls}"`:""}>${LUC[n]||""}</svg>`;
/* paleta dos gráficos alinhada ao Design System (as cores vêm do JS original) */
if(typeof COR!=="undefined")Object.assign(COR,{verde:"#23895A",verdeE:"#164529",graf:"#34453B",verm:"#D9483B",ambar:"#E3A21A",azul:"#3B6FE0",cinza:"#9AA6A0",roxo:"#7C5CE0",agua:"#1FA6A0",rosa:"#D9468B",marrom:"#A16207"});
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const desk=()=>window.innerWidth>=1000;

/* ---------- 1. Ícones: emoji -> Lucide (mesma família, traço único) ---------- */
const EMO={"🔒":"lock","✔":"check","✅":"circle-check","✓":"check","✕":"x","✖":"x","⚠":"triangle-alert","⚠️":"triangle-alert","📄":"file-text","📎":"paperclip","🎓":"graduation-cap","📅":"calendar","📣":"megaphone","⏰":"alarm-clock","👤":"user","⛔":"ban","📝":"file-pen","⏳":"hourglass","🦺":"hard-hat","📌":"pin","📊":"chart-column","💬":"message-square","📷":"camera","✎":"pencil","✏️":"pencil","🗑":"trash-2","⚙":"settings","💾":"save","🔗":"link","📍":"map-pin","⏱":"timer","🪪":"id-card","📖":"book-open","🧮":"calculator","📐":"ruler","🗣":"message-circle","🏷️":"tag","↩":"undo-2","↩️":"undo-2","📉":"trending-down","🖼":"image","🗂️":"folder","★":"star","⚡":"zap","☑️":"square-check","🟢":"@ok","🔴":"@danger","🟡":"@warn"};
const EMORE=new RegExp(Object.keys(EMO).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"),"g");
function trocaEmoji(raiz){
  const w=document.createTreeWalker(raiz,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION|TITLE)$/.test(p.tagName)||p.closest(".ico,[contenteditable]"))return NodeFilter.FILTER_REJECT;EMORE.lastIndex=0;return EMORE.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});
  const ns=[];while(w.nextNode())ns.push(w.currentNode);
  ns.forEach(n=>{
    const t=n.nodeValue,f=document.createDocumentFragment();let i=0,m;EMORE.lastIndex=0;
    while((m=EMORE.exec(t))){
      if(m.index>i)f.append(t.slice(i,m.index));
      const nm=EMO[m[0]],s=document.createElement("span");s.className="ico";s.setAttribute("aria-hidden","true");
      if(nm[0]==="@"){s.classList.add("dot");s.style.color=`var(--${nm.slice(1)})`;s.innerHTML=L("circle")}else s.innerHTML=L(nm);
      f.append(s);i=m.index+m[0].length}
    if(i<t.length)f.append(t.slice(i));n.replaceWith(f)});
}
/* ---------- 1b. Acessibilidade: nomes, descrições e papéis ausentes no HTML gerado pelo app ---------- */
function nomeCampo(el){
  const alvo=el.closest(".fx,.fl,.rlin")||el.parentElement;
  let t=alvo&&$("span,.rl",alvo);t=t&&t!==el&&!t.contains(el)?t.textContent.trim():"";
  if(!t&&el.previousElementSibling&&/^(LABEL|SPAN|B|P)$/.test(el.previousElementSibling.tagName))t=el.previousElementSibling.textContent.trim();
  if(!t&&el.placeholder)t=el.placeholder;
  if(!t&&el.tagName==="SELECT"&&el.options[0])t=el.options[0].textContent.trim();
  if(!t&&el.type==="date")t="Data";
  if(!t&&el.type==="file")t="Anexar arquivo";
  if(!t&&el.type==="search")t="Buscar";
  return t.replace(/\s+/g," ").slice(0,80);
}
function a11yPass(raiz){
  $$("input:not([type=hidden]):not([aria-label]):not([aria-labelledby]),select:not([aria-label]):not([aria-labelledby]),textarea:not([aria-label]):not([aria-labelledby])",raiz).forEach(el=>{
    if(el.id&&document.querySelector('label[for="'+el.id+'"]'))return;
    if(el.closest("label")||el.title)return;
    const n=nomeCampo(el);if(n)el.setAttribute("aria-label",n)});
  $$("svg[role=img]",raiz).forEach(sv=>{
    if((sv.getAttribute("aria-label")||"").trim()||sv.getAttribute("aria-labelledby"))return;
    const h=sv.closest(".gcard,.bcard,section"),t=h&&$("h4,h3,.bbar",h);
    sv.setAttribute("aria-label",(t?t.textContent.trim():"")||"Gráfico")});
  $$("[role=tablist]",raiz).forEach(tl=>{if(!$("[role=tab]",tl)){tl.setAttribute("role","group");if(!tl.getAttribute("aria-label"))tl.setAttribute("aria-label","Seções")}});
}
let emoTimer=0;
function agendaEmoji(){if(emoTimer)return;emoTimer=requestAnimationFrame(()=>{emoTimer=0;try{trocaEmoji($("#app"));trocaEmoji($("#drawer"));a11yPass($("#app"))}catch(e){}})}
new MutationObserver(agendaEmoji).observe($("#app"),{childList:true,subtree:true,characterData:true});

/* ---------- 2. Sidebar ---------- */
const MINI=()=>lsGet("sbmin","0")==="1";
const gAbertos=()=>{try{return JSON.parse(lsGet("sbgrp","{}"))}catch(e){return{}}};
function aplicaMini(){document.body.classList.toggle("sb-min",desk()&&MINI());document.body.classList.add("sb-pref")}
function decoraSidebar(){
  const d=$("#drawer");if(!d||$(".sb-scroll",d)&&false)return;
  const dh=$(".dh",d),dfim=$(".dfim",d),kids=[...d.children].filter(x=>x!==dh&&x!==dfim);
  const scroll=document.createElement("div");scroll.className="sb-scroll";
  const foot=document.createElement("div");foot.className="sb-foot";
  const brand=document.createElement("div");brand.className="sb-brand";
  brand.innerHTML=`<span class="sb-logo">${L("shield-check")}</span><span class="sb-name"><b>Inspeções SSMA</b><small>Gestão de segurança</small></span><button class="sb-col" type="button" aria-label="${MINI()?"Expandir":"Recolher"} menu lateral" aria-expanded="${!MINI()}">${L("panel-left-close")}</button>`;
  /* agrupa por seção (.ds = título do grupo) */
  const grp=gAbertos();let cur=null,g=null;
  kids.forEach(k=>{
    if(k.classList.contains("ds")){
      const nome=k.textContent.trim(),aberto=grp[nome]!==false;
      const b=document.createElement("button");b.type="button";b.className="ds";b.setAttribute("aria-expanded",aberto);b.dataset.g=nome;b.innerHTML=`<span>${nome}</span>${L("chevron-down")}`;
      g=document.createElement("div");g.className="sb-grp";g.hidden=!aberto;g.id="sbg-"+nome.replace(/\W+/g,"");b.setAttribute("aria-controls",g.id);
      scroll.append(b,g);cur=b;k.remove()}
    else{(g||scroll).append(k)}});
  /* grupo com item ativo nunca fica recolhido */
  $$(".sb-grp",scroll).forEach(gr=>{if($(".di.on",gr)){gr.hidden=false;const b=gr.previousElementSibling;if(b)b.setAttribute("aria-expanded","true")}});
  if(dh)foot.append(dh);if(dfim)foot.append(dfim);
  d.replaceChildren(brand,scroll,foot);
  /* rótulos e tooltips (modo recolhido) */
  $$(".di",d).forEach(b=>{const dic=$(".dic",b);const txt=b.textContent.trim();if(dic){const t=[...b.childNodes].filter(n=>n!==dic);const sp=document.createElement("span");sp.className="dl";sp.style.flex="1";sp.style.minWidth="0";t.forEach(n=>sp.append(n));b.append(sp)}b.dataset.tip=txt;if(!b.getAttribute("aria-label"))b.setAttribute("aria-label",txt)});
  const dhEl=$(".dh",d);if(dhEl)dhEl.dataset.tip=($(".dh b",d)||{}).textContent||"";
  /* eventos */
  $(".sb-col",d).onclick=()=>{lsSet("sbmin",MINI()?"0":"1");aplicaMini();montaMenu()};
  $$(".ds",d).forEach(b=>b.onclick=()=>{const gr=b.nextElementSibling,ab=gr.hidden;gr.hidden=!ab;b.setAttribute("aria-expanded",ab);const o=gAbertos();o[b.dataset.g]=ab;lsSet("sbgrp",JSON.stringify(o))});
  $$(".dic",d).forEach(x=>{if(!x.querySelector("svg")&&x.textContent.trim()==="🦴")x.innerHTML=L("bone")});
}
/* tooltip único da sidebar recolhida */
const tip=document.createElement("div");tip.className="sb-tip";tip.setAttribute("aria-hidden","true");document.body.append(tip);
function mostraTip(el){if(!document.body.classList.contains("sb-min")||!el.dataset.tip){tip.classList.remove("on");return}const r=el.getBoundingClientRect(),z=parseFloat(document.documentElement.style.zoom)||1;tip.textContent=el.dataset.tip;tip.style.left=(r.right/1)+10+"px";tip.style.top=(r.top+r.height/2)+"px";tip.style.transform="translateY(-50%)";tip.style.left=(r.right+10)+"px";tip.classList.add("on")}
document.addEventListener("mouseover",e=>{const t=e.target.closest&&e.target.closest("#drawer [data-tip]");t?mostraTip(t):tip.classList.remove("on")});
document.addEventListener("focusin",e=>{const t=e.target.closest&&e.target.closest("#drawer [data-tip]");t?mostraTip(t):tip.classList.remove("on")});
document.addEventListener("focusout",()=>tip.classList.remove("on"));
$("#drawer").addEventListener("mouseleave",()=>tip.classList.remove("on"));

const _montaMenu=window.montaMenu;
window.montaMenu=function(){_montaMenu.apply(this,arguments);decoraSidebar();agendaEmoji()};

/* menu móvel: Esc fecha */
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#drawer.open")&&!desk())window.fecharMenu()});

/* ---------- 3. Cabeçalho: tema, breadcrumbs, página ---------- */
const TI={auto:"monitor",light:"sun",dark:"moon"};
const _aplicaTema=window.aplicaTema;
window.aplicaTema=function(t){_aplicaTema.apply(this,arguments);const ic=$("#tema-ic");if(ic){ic.innerHTML=L(TI[t]||"monitor");ic.style.fontSize="0"}};
window.aplicaTema(window.temaAtual?window.temaAtual():"auto");

const _render=window.render;
let ultimaView=null;
window.render=function(){
  _render.apply(this,arguments);
  const app=$("#app"),mudou=ultimaView!==view;ultimaView=view;
  /* breadcrumbs: Início › Grupo */
  const cr=$("#crumb"),grupo=cr?cr.textContent.trim():"";
  if(cr){cr.innerHTML=`<i>Início</i>${grupo&&grupo!=="Dia a dia"&&grupo!=="Visão geral"?`${L("chevron-right")}${grupo}`:""}`;}
  /* sidebar sempre atualizada no desktop; no celular só ao abrir */
  if(desk()&&window.logado&&window.logado()&&!document.body.classList.contains("semnav"))window.montaMenu();
  else if(desk()){const d=$("#drawer");if(d)d.replaceChildren()}
  /* entrada discreta + foco acessível ao trocar de tela */
  if(mudou){app.classList.remove("pg-in");void app.offsetWidth;app.classList.add("pg-in")}
  agendaEmoji();
};
/* telas sem navegação (login) escondem a sidebar */
const css=document.createElement("style");css.textContent="body.semnav #drawer{display:none!important}body.semnav .top,body.semnav .trilha,body.semnav main{margin-left:0!important}body.semnav .top{display:none}body.semnav .trilha{display:none}";document.head.append(css);

/* ---------- 4. Configurações (popover) ---------- */
let pop=null;
function fechaPop(){if(pop){pop.remove();pop=null;$("#cfg").setAttribute("aria-expanded","false")}}
function abrePop(){
  if(pop){fechaPop();return}
  const t=window.temaAtual(),esc=window.escalaPref();
  const opt=(v,ic,l,on,attr)=>`<button type="button" role="menuitemradio" aria-checked="${on}" ${attr}="${v}">${L(ic)}${l}</button>`;
  pop=document.createElement("div");pop.className="pop";pop.setAttribute("role","menu");pop.setAttribute("aria-label","Configurações");
  pop.innerHTML=`<h5>Tema</h5>${opt("auto","monitor","Automático",t==="auto","data-t")}${opt("light","sun","Claro",t==="light","data-t")}${opt("dark","moon","Escuro",t==="dark","data-t")}
   <hr><h5>Tamanho do texto</h5>${(typeof ESCALAS!=="undefined"?ESCALAS:[]).map(([v,l])=>opt(v,"type",({p:"Menor",m:"Padrão",g:"Maior"})[v]||l,esc===v,"data-e")).join("")}
   <hr><button type="button" role="menuitem" data-meu>${L("circle-user-round")}Meu perfil</button><button type="button" role="menuitem" data-sair class="bad">${L("log-out")}Sair</button>`;
  document.body.append(pop);
  const r=$("#cfg").getBoundingClientRect();pop.style.top=r.bottom+8+"px";pop.style.right=Math.max(8,innerWidth-r.right)+"px";
  $("#cfg").setAttribute("aria-expanded","true");
  $$("[data-t]",pop).forEach(b=>b.onclick=()=>{window.trocaTema(b.dataset.t);fechaPop()});
  $$("[data-e]",pop).forEach(b=>b.onclick=()=>{lsSet("escala",b.dataset.e);window.aplicaEscala();fechaPop();window.render()});
  $("[data-meu]",pop).onclick=()=>{fechaPop();mtNP=null;window.go("minhas")};
  $("[data-sair]",pop).onclick=()=>{fechaPop();window.sair()};
  const first=$("button",pop);first&&first.focus();
}
$("#cfg").onclick=e=>{e.stopPropagation();abrePop()};
document.addEventListener("click",e=>{if(pop&&!pop.contains(e.target)&&!e.target.closest("#cfg"))fechaPop()});
document.addEventListener("keydown",e=>{if(pop){if(e.key==="Escape"){fechaPop();$("#cfg").focus()}
  else if(e.key==="ArrowDown"||e.key==="ArrowUp"){const bs=$$("button",pop),i=bs.indexOf(document.activeElement);bs[(i+(e.key==="ArrowDown"?1:-1)+bs.length)%bs.length].focus();e.preventDefault()}}});

/* ---------- 5. Busca de telas (Ctrl+K) — navega pelos destinos reais do menu ---------- */
let pal=null;
function destinos(){
  const tmp=document.createElement("div");
  /* usa a árvore do próprio menu (respeita permissões); se a sidebar não existe, gera uma vez */
  const d=$("#drawer");if(!$(".di",d))window.montaMenu();
  const out=[];$$("#drawer .di[data-go],#drawer .di[data-ergsec]").forEach(b=>{
    const g=(b.closest(".sb-grp")?.previousElementSibling?.dataset.g)||"";const ic=$(".dic",b);
    out.push({nome:b.dataset.tip||b.textContent.trim(),grupo:g,ic:ic?ic.innerHTML:"",go:b.dataset.go,erg:b.dataset.ergsec})});
  return out;
}
const norm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
function abrePal(){
  if(pal||!(window.logado&&window.logado()))return;
  const todos=destinos();let sel=0,lista=todos;
  pal=document.createElement("div");pal.className="pal";
  pal.innerHTML=`<div class="pal-box" role="dialog" aria-modal="true" aria-label="Buscar telas e módulos"><div class="pal-in">${L("search")}<input type="text" placeholder="Para onde você quer ir?" aria-label="Buscar" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="pal-l"></div><div class="pal-l" id="pal-l" role="listbox"></div><div class="pal-f"><span><kbd>↑</kbd> <kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span></div></div>`;
  document.body.append(pal);const inp=$("input",pal),ul=$(".pal-l",pal);inp.focus();
  const pinta=()=>{ul.innerHTML=lista.length?lista.map((x,i)=>`<button type="button" role="option" id="po${i}" aria-selected="${i===sel}" data-i="${i}"><span class="pi">${x.ic}</span><span><b>${x.nome}</b><small>${x.grupo}</small></span></button>`).join(""):`<div class="pal-v">Nenhuma tela encontrada.</div>`;
    inp.setAttribute("aria-activedescendant",lista.length?"po"+sel:"");const a=$("[aria-selected=true]",ul);a&&a.scrollIntoView({block:"nearest"});
    $$("button",ul).forEach(b=>{b.onclick=()=>vai(lista[+b.dataset.i]);b.onmousemove=()=>{if(sel!==+b.dataset.i){sel=+b.dataset.i;$$("button",ul).forEach(c=>c.setAttribute("aria-selected",c===b))}}})};
  const vai=x=>{fechaPal();if(x.erg)window.go("erg",{sel:x.erg});else{if(x.go==="minhas")mtNP=null;window.go(x.go)}};
  inp.oninput=()=>{const q=norm(inp.value).trim();lista=q?todos.filter(x=>norm(x.nome+" "+x.grupo).includes(q)):todos;sel=0;pinta()};
  pal.onkeydown=e=>{if(e.key==="Escape"){fechaPal()}else if(e.key==="ArrowDown"){sel=Math.min(sel+1,lista.length-1);pinta();e.preventDefault()}else if(e.key==="ArrowUp"){sel=Math.max(sel-1,0);pinta();e.preventDefault()}else if(e.key==="Enter"&&lista[sel]){vai(lista[sel]);e.preventDefault()}else if(e.key==="Tab"){e.preventDefault()}};
  pal.onclick=e=>{if(e.target===pal)fechaPal()};pinta();
}
function fechaPal(){if(pal){pal.remove();pal=null;const b=$("#busca");b&&desk()&&b.focus()}}
$("#busca").onclick=abrePal;
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();pal?fechaPal():abrePal()}});

/* ---------- 6. Modais: foco e Esc ---------- */
new MutationObserver(ms=>{ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1&&n.matches&&n.matches(".modal,.zoom")){n.dataset.prev=document.activeElement&&document.activeElement.id||"";const f=n.querySelector("[data-ok],button,input,textarea,select");f&&setTimeout(()=>f.focus(),30)}}))}).observe(document.body,{childList:true});
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;const m=[...document.querySelectorAll(".modal,.zoom")].pop();if(!m)return;const no=m.querySelector("[data-no]")||m.querySelector("button.alt")||m.querySelector("button");if(no){no.click();e.stopPropagation()}},true);
/* dentro do modal, Tab não escapa */
document.addEventListener("keydown",e=>{if(e.key!=="Tab")return;const m=[...document.querySelectorAll(".modal,.zoom")].pop();if(!m)return;const fs=[...m.querySelectorAll("button,input,textarea,select,a[href]")].filter(x=>!x.disabled&&x.offsetParent!==null);if(!fs.length)return;const a=document.activeElement,i=fs.indexOf(a);if(e.shiftKey&&(i<=0)){fs[fs.length-1].focus();e.preventDefault()}else if(!e.shiftKey&&(i===fs.length-1||i<0)){fs[0].focus();e.preventDefault()}});

/* ---------- 7. Ajustes finais ---------- */
aplicaMini();addEventListener("resize",()=>{aplicaMini();if(!desk())fechaPop()});
const eu=$("#eu");if(eu)eu.setAttribute("title","Meu perfil");
/* logos de ícone da navegação móvel e do topo já vêm no markup */
window.__SENTINELA=true;
})();
