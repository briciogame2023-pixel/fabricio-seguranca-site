/* ==========================================================================
   Conteúdo da apresentação: poses do astronauta, cenários, falas e painéis.
   Para trocar uma narração, basta colocar audio/bloco_XX.mp3 (XX = 01..16).
   ========================================================================== */

/* Poses recortadas das imagens de referência.
   hr = altura/larguraDaCabeça, cx = centro da cabeça (em larguras de cabeça, a partir da esquerda).
   Assim todas as poses ficam com a cabeça do mesmo tamanho e no mesmo lugar. */
const POSES = {
  0: { nome: 'apresentando',  hr: 2.144, cx: 0.55, fade: '9%' },
  1: { nome: 'boas-vindas',   hr: 1.106, cx: 1.058 },
  2: { nome: 'apresenta-tema',hr: 1.553, cx: 0.784 },
  3: { nome: 'reflexao',      hr: 1.388, cx: 0.588 },
  4: { nome: 'aponta-publico',hr: 1.238, cx: 0.786 },
  5: { nome: 'aponta-painel', hr: 1.566, cx: 0.754 },
  6: { nome: 'conquista',     hr: 1.480, cx: 0.826 },
  7: { nome: 'alerta',        hr: 1.263, cx: 0.885 },
  8: { nome: 'demonstracao',  hr: 1.558, cx: 0.950 },
  10:{ nome: 'visao-negocio', hr: 1.711, cx: 1.156 },
  11:{ nome: 'encerramento',  hr: 1.240, cx: 1.010, fade: '6%' }
};

/* Helpers de montagem dos painéis (HTML). Cada .rv aparece em sequência, no ritmo da fala. */
const H = {
  ttl:  (t, s) => `<h2 class="ttl rv">${t}</h2>${s ? `<p class="sub rv">${s}</p>` : ''}<div class="linha rv"></div>`,
  card: (h, p, cls = '', ic = '') => `<div class="card rv ${cls}">${ic ? `<span class="ic">${ic}</span>` : ''}<h4>${h}</h4>${p ? `<p>${p}</p>` : ''}</div>`,
  item: (n, t, cor = 'var(--lime)', sm = '') => `<div class="item rv" style="--bc:${cor}"><b class="n">${n}</b><div>${t}${sm ? `<small>${sm}</small>` : ''}</div></div>`,
  th:   t => `<div class="th rv">${t}</div>`,
  td:   (t, c = 'c') => `<div class="td ${c} rv">${t}</div>`
};

/* tema: central de comando | fabrica | treinamento | galaxia | indicadores */
const SCENES = [
  { id: 1, titulo: 'Abertura', tema: 'galaxia', poses: [1, 2], decola: true,
    fala: 'Olá! Eu sou o astronauta do SIM, e a nossa missão de hoje é aprender o LAIA: o Levantamento de Aspectos e Impactos Ambientais. No fim deste vídeo, você vai saber enxergar a pegada de cada atividade e preencher a planilha, passo a passo. Preparado? Então, vamos decolar!',
    painel: () => `
      ${H.ttl('LAIA')}
      <div class="corpo">
        <div class="logo-card rv"><img src="assets/logo-sim-meio-ambiente.jpg" alt="SIM Meio Ambiente"></div>
        <p class="destaque rv">Levantamento de Aspectos<br>e Impactos Ambientais</p>
        <p class="leve rv">Treinamento · Pilar Meio Ambiente</p>
      </div>` },

  { id: 2, titulo: 'O que é o LAIA?', tema: 'comando', poses: [2, 0],
    fala: 'O LAIA é uma ferramenta essencial da gestão ambiental. Ele identifica, avalia e prioriza o que as nossas atividades causam ao meio ambiente. Ele existe para controlar e reduzir danos, porque a gente não consegue cuidar do que não enxerga.',
    painel: () => `
      ${H.ttl('O que é o LAIA?', 'Ferramenta essencial da gestão ambiental')}
      <div class="corpo">
        <div class="fluxo">
          ${H.card('IDENTIFICA', 'as atividades e seus aspectos', 'cy', '🔎')}<span class="seta rv">➜</span>
          ${H.card('AVALIA', 'os impactos ambientais', 'cy', '⚖️')}<span class="seta rv">➜</span>
          ${H.card('PRIORIZA', 'o que precisa de ação primeiro', 'cy', '📈')}
        </div>
        ${H.card('Para quê?', 'Controlar e reduzir danos ao meio ambiente', 'ok')}
      </div>` },

  { id: 3, titulo: 'Quando, quem e como', tema: 'treinamento', poses: [4, 0],
    fala: 'Quando aplicar? Sempre que houver alguma alteração de processo. Quem conduz? A equipe de meio ambiente. E como? Preenchendo a planilha LAIA, seguindo o tutorial feito para isso. Daqui a pouco, a gente abre essa planilha juntos.',
    painel: () => `
      ${H.ttl('Quando · Quem · Como')}
      <div class="corpo"><div class="cards" style="--cols:3">
        ${H.card('QUANDO?', 'Sempre que houver alteração de processo', 'or', '⚙️')}
        ${H.card('QUEM?', 'Equipe de meio ambiente', 'cy', '👥')}
        ${H.card('COMO?', 'Planilha LAIA, seguindo o tutorial', 'ok', '📋')}
      </div></div>` },

  { id: 4, titulo: 'Aspecto = causa', tema: 'comando', poses: [5],
    fala: 'Agora, a parte mais importante da missão: aspecto e impacto. Guarde assim: aspecto é a causa. É aquilo que a nossa atividade faz e que pode interagir com o meio ambiente. Por exemplo: gerar resíduos, consumir água ou emitir gases.',
    painel: () => `
      ${H.ttl('Aspecto = Causa', 'O que a atividade FAZ e pode interagir com o meio ambiente')}
      <div class="corpo">
        ${H.item('🗑️', 'Geração de resíduos', 'transparent')}
        ${H.item('💧', 'Consumo de água', 'transparent')}
        ${H.item('🏭', 'Emissão de gases', 'transparent')}
        <p class="dica rv">Pergunta-chave: <b>“O que eu faço?”</b></p>
      </div>` },

  { id: 5, titulo: 'Impacto = efeito', tema: 'galaxia', poses: [8, 5],
    fala: "Já o impacto é o efeito: a mudança que isso provoca na natureza. Consumir água é a causa; a escassez de água é o efeito. Vazar óleo é a causa; a contaminação da água é o efeito. Uma dica: se a pergunta é 'o que eu faço?', é aspecto. Se é 'o que isso provoca?', é impacto.",
    painel: () => `
      ${H.ttl('Impacto = Efeito', 'A mudança que isso provoca na natureza')}
      <div class="corpo">
        <div class="duplo rv"><div><span class="rotulo" style="--c:var(--lime)">CAUSA</span><div class="caixa">Consumo de água</div></div><span class="seta">➜</span><div><span class="rotulo" style="--c:var(--orange)">EFEITO</span><div class="caixa ef">Escassez de água</div></div></div>
        <div class="duplo rv"><div><span class="rotulo" style="--c:var(--lime)">CAUSA</span><div class="caixa">Vazamento de óleo</div></div><span class="seta">➜</span><div><span class="rotulo" style="--c:var(--orange)">EFEITO</span><div class="caixa ef">Contaminação da água</div></div></div>
        <p class="dica rv">“O que isso provoca?” = <b>impacto</b></p>
      </div>` },

  { id: 6, titulo: 'Da atividade ao impacto', tema: 'fabrica', poses: [5, 0],
    fala: 'Vamos ver isso numa fábrica. A atividade é o corte da borracha. O aspecto é a geração de resíduos de borracha. O impacto é a contaminação do solo. Outra atividade: o consumo de produtos químicos. O aspecto é o vazamento de substâncias perigosas, e o impacto é a poluição da água e do solo.',
    painel: () => `
      ${H.ttl('Da atividade ao impacto')}
      <div class="corpo">
        <div class="fluxo">
          ${H.card('Corte da borracha', '', 'cy').replace('<h4>', '<span class="tag">Atividade</span><h4>')}<span class="seta rv">➜</span>
          ${H.card('Resíduos de borracha', '', 'ok').replace('<h4>', '<span class="tag">Aspecto</span><h4>')}<span class="seta rv">➜</span>
          ${H.card('Contaminação do solo', '', 'or').replace('<h4>', '<span class="tag">Impacto</span><h4>')}
        </div>
        <div class="fluxo">
          ${H.card('Produtos químicos', '', 'cy').replace('<h4>', '<span class="tag">Atividade</span><h4>')}<span class="seta rv">➜</span>
          ${H.card('Vazamento perigoso', '', 'ok').replace('<h4>', '<span class="tag">Aspecto</span><h4>')}<span class="seta rv">➜</span>
          ${H.card('Poluição da água e do solo', '', 'or').replace('<h4>', '<span class="tag">Impacto</span><h4>')}
        </div>
      </div>` },

  { id: 7, titulo: 'Controle operacional', tema: 'treinamento', poses: [10, 4],
    fala: 'Identificou o impacto? Agora vem a pergunta: o que fazer? O controle operacional previne. Se o aspecto é a geração de resíduos, implantamos a coleta seletiva e reduzimos o desperdício na linha de produção. Se é o uso de recursos, treinamos as equipes para reduzir o consumo de água e energia.',
    painel: () => `
      ${H.ttl('Controle operacional', 'PREVENIR: ações do dia a dia')}
      <div class="corpo lista" style="--c:var(--cyan)">
        ${H.item(1, 'Implantar coleta seletiva', 'var(--cyan)')}
        ${H.item(2, 'Reduzir desperdícios na linha de produção', 'var(--cyan)')}
        ${H.item(3, 'Treinar equipes para economizar água e energia', 'var(--cyan)')}
      </div>` },

  { id: 8, titulo: 'Controle emergencial', tema: 'fabrica', poses: [7, 3],
    fala: 'O controle emergencial corrige. Ele é o plano para quando algo inesperado acontece, para minimizar os danos ao meio ambiente e à saúde. Derramou óleo? Usamos barreiras de contenção e acionamos equipes especializadas. Incêndio? Brigada treinada e o Plano de Emergência Ambiental. Pense assim: o operacional é o cinto de segurança, e o emergencial é o airbag.',
    painel: () => `
      ${H.ttl('Controle emergencial', 'CORRIGIR: quando algo inesperado acontece')}
      <div class="corpo">
        ${H.card('Derramamento de óleo', 'Barreiras de contenção · equipes especializadas', 'rd', '🛢️')}
        ${H.card('Incêndio em área industrial', 'Brigada treinada · Plano de Emergência Ambiental', 'rd', '🔥')}
        <p class="dica rv">Operacional = <b>cinto de segurança</b> · Emergencial = <b>airbag</b></p>
      </div>` },

  { id: 9, titulo: 'Os 5 passos do LAIA', tema: 'comando', poses: [2, 5],
    fala: 'O LAIA segue cinco passos. Um: identificar as atividades e processos. Dois: levantar os aspectos ambientais. Três: avaliar os impactos. Quatro: determinar a significância, usando severidade, abrangência e probabilidade. E cinco: criar os planos de ação e os controles. Hora de abrir a planilha!',
    painel: () => `
      ${H.ttl('Os 5 passos do LAIA')}
      <div class="corpo lista" style="--c:var(--cyan)">
        ${H.item(1, 'Identificar atividades e processos', 'var(--lime)')}
        ${H.item(2, 'Levantar os aspectos ambientais', 'var(--lime)')}
        ${H.item(3, 'Avaliar os impactos ambientais', 'var(--lime)')}
        ${H.item(4, 'Determinar a significância', 'var(--orange)')}
        ${H.item(5, 'Criar planos de ação e controles', 'var(--lime)')}
      </div>` },

  { id: 10, titulo: 'Matriz LAIA · passos 1 a 3', tema: 'indicadores', poses: [5, 0],
    fala: 'Na Matriz LAIA, começamos por onde estamos. Passo um: defina a área a ser analisada. Passo dois: defina o processo dessa área. Passo três: defina a atividade desse processo. No exemplo da planilha: a área de acabamento e estampas, o processo de acabamento e atividades como corte de manta e embalagem.',
    painel: () => `
      ${H.ttl('Matriz LAIA · passos 1 a 3', 'Onde estamos?')}
      <div class="corpo">
        <div class="planilha" style="--cols:3">
          ${H.th('1 · ÁREA')}${H.th('2 · PROCESSO')}${H.th('3 · ATIVIDADE')}
          ${H.td('UGB1 · Acabamento e Estampas')}${H.td('Acabamento')}${H.td('Corte da manta')}
        </div>
        <p class="dica rv">Defina a <b>área</b>, depois o <b>processo</b>, depois a <b>atividade</b> desse processo.</p>
      </div>` },

  { id: 11, titulo: 'Matriz LAIA · passos 4 e 5', tema: 'indicadores', poses: [8, 5],
    fala: 'Passo quatro: com a atividade definida, pergunte o que ela pode ocasionar. Esse é o aspecto ambiental, como o consumo de água potável. Passo cinco: identifique o impacto desse aspecto específico. No exemplo, o consumo de água potável leva à redução de recursos naturais.',
    painel: () => `
      ${H.ttl('Matriz LAIA · passos 4 e 5', 'Causa e efeito')}
      <div class="corpo">
        <div class="planilha" style="--cols:2">
          ${H.th('4 · ASPECTO AMBIENTAL')}${H.th('5 · IMPACTO AMBIENTAL')}
          ${H.td('Consumo de água potável')}${H.td('Redução de recursos naturais (água)')}
        </div>
        <p class="dica rv">O que a atividade pode ocasionar? E qual o efeito disso no ambiente?</p>
      </div>` },

  { id: 12, titulo: 'Passo 6 · significância', tema: 'comando', poses: [3, 5],
    fala: 'Passo seis: classificar a significância do impacto. Usamos três critérios. Severidade: o potencial de dano. Abrangência: até onde o impacto chega, local, regional ou global. E probabilidade: a chance de ele acontecer. Cada critério recebe uma nota de um a quatro, e a planilha faz a conta.',
    painel: () => `
      ${H.ttl('Passo 6 · Significância', 'Três critérios, notas de 1 a 4')}
      <div class="corpo">
        ${H.card('SEVERIDADE', 'Potencial de dano do impacto', 'rd')}
        ${H.card('ABRANGÊNCIA', 'Até onde chega: local, regional ou global', 'or')}
        ${H.card('PROBABILIDADE', 'Chance de acontecer', 'yl')}
      </div>` },

  { id: 13, titulo: 'O cálculo da significância', tema: 'indicadores', poses: [5, 6],
    fala: 'A fórmula é: abrangência mais probabilidade, multiplicado pela severidade, com o seu peso. Veja o exemplo da planilha: probabilidade dois, abrangência três, severidade dois. Três mais dois dá cinco. Cinco vezes dois dá dez. E dez cai na faixa baixa, classificada como não significativo.',
    painel: () => `
      ${H.ttl('O cálculo da significância')}
      <div class="corpo">
        <div class="formula rv">(A + P) × (S × peso)</div>
        <p class="dica rv">A = abrangência · P = probabilidade · S = severidade</p>
        <p class="dica rv">Exemplo da planilha: <b>P = 2 · A = 3 · S = 2</b></p>
        <p class="conta rv">(3 + 2) × (2 × 1) = 10</p>
        <div class="resultado rv">BAIXO · NÃO SIGNIFICATIVO</div>
      </div>` },

  { id: 14, titulo: 'Faixas de significância', tema: 'galaxia', poses: [7, 10],
    fala: 'Para se orientar: de dois a três é desprezível; de seis a dez, baixo; de doze a trinta, médio; e de trinta e dois a cento e vinte e oito, alto. Quanto maior a nota, mais obrigatória e mais forte precisa ser a resposta, até chegar às ações adicionais de controle.',
    painel: () => `
      ${H.ttl('Faixas de significância', 'Quanto maior a nota, mais forte a resposta')}
      <div class="corpo semaforo">
        <div class="faixa-s fs-1 rv"><span>DESPREZÍVEL</span><span>2 a 3</span></div>
        <div class="faixa-s fs-2 rv"><span>BAIXO</span><span>6 a 10</span></div>
        <div class="faixa-s fs-3 rv"><span>MÉDIO</span><span>12 a 30</span></div>
        <div class="faixa-s fs-4 rv"><span>ALTO</span><span>32 a 128</span></div>
      </div>` },

  { id: 15, titulo: 'Matriz LAIA · passos 7 e 8', tema: 'treinamento', poses: [0, 4],
    fala: "Passo sete: identifique os controles operacionais necessários. No resíduo de borracha: evitar gerar resíduo, reaproveitar as rebarbas quando possível e fazer a coleta seletiva, separando os recicláveis dos não recicláveis. Passo oito: se for necessário, defina o controle emergencial. Quando não há cenário de emergência, a planilha registra 'não aplicável'.",
    painel: () => `
      ${H.ttl('Matriz LAIA · passos 7 e 8', 'Controles')}
      <div class="corpo">
        <div class="planilha" style="--cols:2">
          ${H.th('7 · CONTROLE OPERACIONAL')}${H.th('8 · CONTROLE EMERGENCIAL')}
          ${H.td('<ul><li>Evitar gerar resíduo</li><li>Reutilizar as rebarbas</li><li>Coleta seletiva (bags)</li></ul>', 'l')}${H.td('Não aplicável')}
        </div>
        <p class="dica rv">Exemplo: <b>resíduo de borracha</b></p>
      </div>` },

  { id: 16, titulo: 'Missão cumprida', tema: 'galaxia', poses: [6, 11], decola: true,
    fala: 'Missão cumprida! Três ideias para levar. Uma: aspecto é a causa, impacto é o efeito. Duas: a significância mostra o que merece atenção primeiro. Três: todo impacto precisa de controle, para prevenir e, quando necessário, corrigir. Mudou o processo? Revise o LAIA. Obrigado por assistir, e até a próxima missão!',
    painel: () => `
      ${H.ttl('Missão cumprida!')}
      <div class="corpo">
        <div class="logo-card rv" style="width:min(48%,calc(var(--u)*28))"><img src="assets/logo-sim-meio-ambiente.jpg" alt="SIM Meio Ambiente"></div>
        ${H.item(1, 'Aspecto é a causa, impacto é o efeito', 'var(--lime)')}
        ${H.item(2, 'A significância mostra o que priorizar', 'var(--lime)')}
        ${H.item(3, 'Todo impacto precisa de controle', 'var(--lime)')}
        <p class="destaque rv" style="color:var(--cyan)">OBRIGADO!</p>
      </div>` }
];
