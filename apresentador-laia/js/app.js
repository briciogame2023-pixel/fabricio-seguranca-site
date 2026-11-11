/* ==========================================================================
   Apresentador virtual SIM · LAIA — motor da apresentação
   - Narração: audio/bloco_XX.mp3 (se existir) → voz do navegador (pt-BR) → só legendas
   - Astronauta: troca de poses + respiração + "fala" sincronizada à voz
   - Painel holográfico e cenário mudam conforme o conteúdo da fala
   ========================================================================== */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad = n => String(n).padStart(2, '0');

  const app = $('#app'), astro = $('#astro'), astroFala = $('#astroFala'),
        painelC = $('#painelConteudo'), legenda = $('#legenda'), foguete = $('#foguete'),
        trilha = $('#trilha'), bPlay = $('#bPlay');
  const params = new URLSearchParams(location.search);

  const st = {
    i: -1, playing: false, started: false, sound: params.get('mudo') !== '1', caps: true,
    progress: 0, token: 0, revealed: 0, poseAtual: null, rate: 1, items: []
  };

  /* ------------------------------------------------------------ Poses do astronauta */
  const poseEls = {};
  Object.entries(POSES).forEach(([k, p]) => {
    const img = new Image();
    img.className = 'pose'; img.alt = ''; img.decoding = 'async'; img.draggable = false;
    img.src = `assets/astronauta/pose-${pad(k)}.webp`;
    img.style.setProperty('--hr', p.hr); img.style.setProperty('--cx', p.cx); if (p.fade) img.style.setProperty('--fade', p.fade);
    astroFala.appendChild(img); poseEls[k] = img;
  });
  function showPose(k) {
    if (st.poseAtual === k) return;
    const antiga = poseEls[st.poseAtual];
    if (antiga) { antiga.classList.remove('on'); antiga.classList.add('saindo'); setTimeout(() => antiga.classList.remove('saindo'), 600); }
    const nova = poseEls[k]; if (nova) { nova.classList.remove('saindo'); void nova.offsetWidth; nova.classList.add('on'); }
    st.poseAtual = k;
  }

  /* ------------------------------------------- "Fala": movimento do astronauta com a voz */
  let mouth = 0, mouthAlvo = 0;
  function pulso(v = 1) { mouthAlvo = Math.max(mouthAlvo, v); }
  (function loopBoca() {
    mouthAlvo *= 0.84; mouth += (mouthAlvo - mouth) * 0.45;
    astro.style.setProperty('--mouth', mouth.toFixed(3));
    requestAnimationFrame(loopBoca);
  })();

  /* -------------------------------------------------------------- Pano de fundo */
  (function poeira() {
    const box = $('#poeira');
    for (let i = 0; i < 28; i++) {
      const e = document.createElement('i'), s = 2 + Math.random() * 3;
      e.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${9 + Math.random() * 14}s;animation-delay:${-Math.random() * 20}s;opacity:.0`;
      box.appendChild(e);
    }
  })();
  (function estrelas() {
    const c = $('#estrelas'), ctx = c.getContext('2d'); let pts = [];
    function ajusta() {
      c.width = innerWidth; c.height = innerHeight;
      pts = Array.from({ length: Math.round(innerWidth * innerHeight / 5200) }, () => ({ x: Math.random() * c.width, y: Math.random() * c.height, r: Math.random() * 1.5 + .3, f: Math.random() * 6.28, v: Math.random() * .03 + .01 }));
    }
    function desenha() {
      if (app.dataset.tema === 'galaxia') {
        ctx.clearRect(0, 0, c.width, c.height);
        for (const p of pts) { p.f += p.v; ctx.globalAlpha = .35 + .65 * Math.abs(Math.sin(p.f)); ctx.fillStyle = '#cfe9ff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); }
      }
      setTimeout(() => requestAnimationFrame(desenha), 60);
    }
    addEventListener('resize', ajusta); ajusta(); desenha();
  })();

  /* ------------------------------------------------------------------ Trilha de cenas */
  SCENES.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.title = `${pad(i + 1)} · ${s.titulo}`; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', `Cena ${i + 1}: ${s.titulo}`);
    b.addEventListener('click', () => { if (!st.started) return; goTo(i, { play: true }); });
    trilha.appendChild(b);
  });
  const segs = [...trilha.children];
  function marcaTrilha(p) {
    segs.forEach((b, i) => { b.classList.toggle('feita', i < st.i); b.style.setProperty('--p', i === st.i ? p : (i < st.i ? 1 : 0)); b.setAttribute('aria-selected', i === st.i); });
  }

  /* ---------------------------------------------------------------- Progresso da cena */
  function frases(texto) { return texto.split(/(?<=[.!?:;])\s+/).map(s => s.trim()).filter(Boolean); }
  function atualizaLegenda(p) {
    const f = st.frases; if (!f) return;
    const alvo = p * st.fala.length; let acc = 0;
    for (const s of f) { acc += s.length + 1; if (alvo < acc) { if (legenda.textContent !== s) legenda.textContent = s; return; } }
    legenda.textContent = f[f.length - 1];
  }
  function setProgress(p) {
    p = clamp(p, 0, 1); st.progress = p;
    const cena = SCENES[st.i]; if (!cena) return;
    st.items.forEach(it => { if (!it.on && p >= it.at) { it.on = true; it.el.classList.add('on'); } });
    if (cena.poses[1] != null && p >= 0.48) showPose(cena.poses[1]);
    if (cena.decola && p >= 0.86 && !foguete.classList.contains('voa')) foguete.classList.add('voa');
    atualizaLegenda(p); marcaTrilha(p);
  }

  /* --------------------------------------------------------------------- Narração */
  const N = { modo: null, audio: null, ctx: null, raf: 0, t0: 0, dur: 0, pausadoEm: 0, ativo: false, token: 0, fim: null };
  function pararNarracao() {
    N.token++; N.ativo = false; cancelAnimationFrame(N.raf);
    if (N.audio) { N.audio.pause(); N.audio.src = ''; N.audio = null; }
    try { speechSynthesis.cancel(); } catch (e) { /* sem voz */ }
    app.dataset.falando = '0';
  }
  function tentaAudio(cena) {
    return new Promise(res => {
      const a = new Audio(); a.preload = 'auto'; let ok = false;
      const falha = () => { if (!ok) { ok = true; res(null); } };
      a.addEventListener('error', falha, { once: true });
      a.addEventListener('canplay', () => { if (!ok) { ok = true; res(a); } }, { once: true });
      setTimeout(falha, 3500);
      a.src = `audio/bloco_${pad(cena.id)}.mp3`;
    });
  }
  function ligaAnalisador(a) {
    if (!/^https?:$/.test(location.protocol)) return false;     // em file:// o analisador silenciaria o áudio
    try {
      N.ctx = N.ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (N.ctx.state === 'suspended') N.ctx.resume();
      const src = N.ctx.createMediaElementSource(a), an = N.ctx.createAnalyser(); an.fftSize = 512;
      src.connect(an); an.connect(N.ctx.destination);
      const d = new Uint8Array(an.fftSize);
      (function ler() {
        if (N.audio !== a) return;
        an.getByteTimeDomainData(d); let s = 0; for (const v of d) { const x = (v - 128) / 128; s += x * x; }
        pulso(clamp(Math.sqrt(s / d.length) * 5.5, 0, 1)); requestAnimationFrame(ler);
      })();
      return true;
    } catch (e) { return false; }
  }
  function escolheVoz() {
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const pt = vs.filter(v => /^pt([-_]BR)?/i.test(v.lang));
    return pt.find(v => /(felipe|daniel|antonio|ricardo|google português)/i.test(v.name) && /BR/i.test(v.lang)) || pt.find(v => /BR/i.test(v.lang)) || pt[0] || null;
  }
  function timer(cena, token) {
    const palavras = cena.fala.split(/\s+/).length;
    N.modo = 'timer'; N.dur = Math.max(5, palavras / 2.35) * 1000 / st.rate; N.t0 = performance.now(); N.pausadoEm = 0;
    const ritmo = setInterval(() => { if (N.token !== token) clearInterval(ritmo); else if (st.playing && st.sound) pulso(.55 + Math.random() * .4); }, 210);
    (function passo(t) {
      if (N.token !== token) return;
      if (st.playing) { const p = (t - N.t0) / N.dur; setProgress(p); if (p >= 1) { clearInterval(ritmo); N.fim(); return; } }
      else N.t0 += 16.7;                                                     // congela durante a pausa
      N.raf = requestAnimationFrame(passo);
    })(performance.now());
  }
  function tts(cena, token) {
    const sy = window.speechSynthesis; if (!sy) return timer(cena, token);
    sy.cancel(); N.modo = 'tts';
    const fr = st.frases, total = st.fala.length; let idx = 0, off = 0, comecou = false;
    const voz = escolheVoz();
    const falaProxima = () => {
      if (N.token !== token) return;
      if (idx >= fr.length) { N.fim(); return; }
      const s = fr[idx], u = new SpeechSynthesisUtterance(s);
      u.lang = 'pt-BR'; u.rate = st.rate; u.pitch = 1; if (voz) u.voice = voz;
      u.onstart = () => { comecou = true; };
      u.onboundary = e => { pulso(.9); setProgress((off + (e.charIndex || 0)) / total); };
      u.onend = () => { if (N.token !== token) return; off += s.length + 1; idx++; setProgress(Math.min(.995, off / total)); falaProxima(); };
      u.onerror = e => { if (N.token === token && e.error !== 'interrupted' && e.error !== 'canceled') { timer(cena, token); } };
      sy.speak(u);
    };
    falaProxima();
    setTimeout(() => { if (N.token === token && !comecou && N.modo === 'tts') { sy.cancel(); timer(cena, token); } }, 3000);
  }
  async function narrar(cena, fim) {
    pararNarracao(); const token = ++N.token; N.fim = () => { if (N.token === token) { N.ativo = false; app.dataset.falando = '0'; fim(); } };
    N.ativo = true; app.dataset.falando = '1';
    if (!st.sound) return timer(cena, token);
    const a = await tentaAudio(cena); if (N.token !== token) return;
    if (a) {
      N.audio = a; N.modo = 'audio'; a.playbackRate = st.rate;
      const temAnalise = ligaAnalisador(a);
      a.addEventListener('timeupdate', () => { if (a.duration) setProgress(a.currentTime / a.duration); });
      if (!temAnalise) { const r = setInterval(() => { if (N.token !== token) clearInterval(r); else if (!a.paused) pulso(.5 + Math.random() * .5); }, 200); }
      a.addEventListener('ended', () => N.fim(), { once: true });
      a.play().catch(() => tts(cena, token));
    } else tts(cena, token);
  }
  function pausaNarracao() {
    if (N.audio) N.audio.pause();
    try { if (N.modo === 'tts') speechSynthesis.pause(); } catch (e) { /* ok */ }
    app.dataset.falando = '0';
  }
  function retomaNarracao() {
    if (N.audio) N.audio.play();
    try { if (N.modo === 'tts') speechSynthesis.resume(); } catch (e) { /* ok */ }
    app.dataset.falando = '1';
  }

  /* ------------------------------------------------------------------ Troca de cena */
  async function goTo(i, { play, instant } = {}) {
    if (i < 0 || i >= SCENES.length) return;
    const my = ++st.token;
    if (play != null) setPlaying(play, true);
    pararNarracao();
    $('#fim').hidden = true;
    const cena = SCENES[i];
    if (!instant) { app.classList.add('trans'); painelC.classList.add('saindo'); await wait(470); if (my !== st.token) return; }
    st.i = i; st.fala = cena.fala; st.frases = frases(cena.fala); st.progress = 0;
    app.dataset.tema = cena.tema;
    $('#hudN').textContent = `${pad(i + 1)} / ${pad(SCENES.length)}`; $('#hudT').textContent = cena.titulo;
    legenda.textContent = st.frases[0];
    foguete.classList.remove('voa'); void foguete.offsetWidth;
    painelC.classList.remove('saindo'); painelC.classList.add('entrando');
    painelC.innerHTML = cena.painel(); void painelC.offsetWidth; painelC.classList.remove('entrando');
    // monta o roteiro de aparição: título logo; o resto distribuído ao longo da fala
    const els = [...painelC.querySelectorAll('.rv')], cab = els.filter(e => e.matches('.ttl,.sub,.linha')), corpo = els.filter(e => !e.matches('.ttl,.sub,.linha'));
    st.items = [...cab.map((el, k) => ({ el, at: 0, on: false, delay: k * 110 })), ...corpo.map((el, k) => ({ el, at: 0.05 + k * (0.78 / Math.max(1, corpo.length)), on: false }))];
    cab.forEach((el, k) => setTimeout(() => { if (my === st.token) { el.classList.add('on'); st.items[k].on = true; } }, 200 + k * 130));
    showPose(cena.poses[0]);
    marcaTrilha(0);
    setTimeout(() => app.classList.remove('trans'), 560);
    if (params.get('prog')) { setProgress(parseFloat(params.get('prog'))); return; }
    if (st.playing) narrar(cena, () => setTimeout(() => { if (my === st.token) proxima(); }, 900));
  }
  function proxima() {
    if (st.i < SCENES.length - 1) goTo(st.i + 1);
    else { st.playing = false; syncPlay(); marcaTrilha(1); segs.forEach(b => b.classList.add('feita')); $('#fim').hidden = false; }
  }

  /* ---------------------------------------------------------------------- Controles */
  function syncPlay() { bPlay.textContent = st.playing ? '⏸' : '▶'; bPlay.setAttribute('aria-label', st.playing ? 'Pausar' : 'Continuar'); }
  function setPlaying(v, silent) { st.playing = v; syncPlay(); if (!silent) { if (!N.ativo && v && st.i >= 0) { goTo(st.i, { instant: true }); } else if (v) retomaNarracao(); else pausaNarracao(); } }
  bPlay.addEventListener('click', () => { if (st.started) setPlaying(!st.playing); });
  $('#bAnt').addEventListener('click', () => st.started && goTo(Math.max(0, st.i - (st.progress > .15 ? 0 : 1)), { play: true }));
  $('#bProx').addEventListener('click', () => st.started && (st.i < SCENES.length - 1 ? goTo(st.i + 1, { play: true }) : proxima()));
  const bLeg = $('#bLeg'), bSom = $('#bSom');
  function setLeg(v) { st.caps = v; app.dataset.leg = v ? '1' : '0'; bLeg.setAttribute('aria-pressed', v); }
  function setSom(v) { st.sound = v; bSom.setAttribute('aria-pressed', v); bSom.textContent = v ? '🔊' : '🔇'; if (st.started && st.i >= 0) goTo(st.i, { instant: true, play: st.playing }); }
  bLeg.addEventListener('click', () => setLeg(!st.caps));
  bSom.addEventListener('click', () => setSom(!st.sound));
  $('#bTela').addEventListener('click', () => { document.fullscreenElement ? document.exitFullscreen() : (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen || (() => { })).call(document.documentElement); });
  addEventListener('keydown', e => {
    if (!st.started) return;
    if (e.code === 'Space') { e.preventDefault(); setPlaying(!st.playing); }
    else if (e.key === 'ArrowRight') $('#bProx').click();
    else if (e.key === 'ArrowLeft') $('#bAnt').click();
    else if (e.key.toLowerCase() === 'c') setLeg(!st.caps);
    else if (e.key.toLowerCase() === 'm') setSom(!st.sound);
    else if (e.key.toLowerCase() === 'f') $('#bTela').click();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && st.playing) setPlaying(false); });

  function iniciar(cena = 0) {
    st.started = true; app.dataset.estado = 'play';
    try { N.ctx = N.ctx || new (window.AudioContext || window.webkitAudioContext)(); N.ctx.resume(); } catch (e) { /* ok */ }
    if (window.speechSynthesis) { speechSynthesis.getVoices(); }
    st.playing = params.get('pausa') !== '1'; syncPlay(); setLeg(true); bSom.textContent = st.sound ? '🔊' : '🔇'; bSom.setAttribute('aria-pressed', st.sound);
    goTo(cena, { instant: params.has('cena') });
  }
  $('#bIniciar').addEventListener('click', () => iniciar(0));
  $('#bRepetir').addEventListener('click', () => { st.playing = true; syncPlay(); goTo(0); });
  if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => { };
  setLeg(true); syncPlay();

  // atalho de teste/demonstração: ?cena=7&mudo=1&pausa=1&prog=1
  if (params.has('cena')) { $('#intro').style.transition = 'none'; iniciar(clamp(parseInt(params.get('cena'), 10) - 1, 0, SCENES.length - 1)); }
})();
