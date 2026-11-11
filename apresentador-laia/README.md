# Apresentador virtual SIM · LAIA

Experiência em HTML, CSS e JavaScript puros (sem build, sem dependências) com o astronauta apresentador
explicando o **LAIA – Levantamento de Aspectos e Impactos Ambientais**.

## Como abrir

```bash
cd apresentador-laia
python3 -m http.server 8000     # depois abra http://localhost:8000
```

Também funciona publicado no GitHub Pages ou abrindo `index.html` direto (neste caso o movimento do
astronauta com a voz usa um ritmo simulado em vez de medir o áudio).

## O que a experiência faz

- **Astronauta à esquerda, apresentação à direita**, em desktop, tablet e celular (em pé e deitado).
- **16 cenas** com painéis holográficos que mudam conforme a narração; os itens aparecem no ritmo da fala.
- **Cenários dinâmicos:** central de comando, fábrica, sala de treinamento, galáxia e painel de indicadores.
- **Gestos do astronauta:** troca entre poses (boas-vindas, apontar, explicar, alerta, conquista, continência),
  respiração contínua e "fala" sincronizada ao volume do áudio (ou às palavras, quando usa a voz do navegador).
- **Transições cinematográficas** (cortinas, varredura de luz, desfoque) e foguete que decola na abertura e no fim.
- **Controles:** play/pausa, anterior/próxima, trilha de cenas clicável, legendas, som, tela cheia.
  Atalhos: `Espaço`, `←`, `→`, `C` (legendas), `M` (som), `F` (tela cheia).

## Narração

1. Se existir `audio/bloco_XX.mp3`, ele é usado (veja `audio/LEIA-ME.md`).
2. Senão, usa a voz do navegador em português do Brasil.
3. Sem som: o texto corre nas legendas.

## Estrutura

```
index.html            página e camadas do cenário
css/style.css         visual, cenários, responsivo
js/scenes.js          poses, falas e conteúdo de cada painel (edite aqui)
js/app.js             motor: narração, poses, transições, controles
assets/astronauta/    poses recortadas (WebP com transparência)
assets/foguete.webp   foguete da cena de abertura/encerramento
assets/logo-sim-meio-ambiente.jpg
```

## Testes rápidos (parâmetros na URL)

`index.html?cena=7&mudo=1&pausa=1&prog=1` abre direto na cena 7, sem som, pausada e já com o painel completo.

## Limitações conhecidas

- O astronauta é feito de **imagens estáticas recortadas** das referências: ele troca de pose e se mexe como
  um todo, mas **não tem sincronia labial real** nem animação de braços quadro a quadro.
  Para isso seria preciso gerar vídeo/animação (por exemplo, lipsync por IA) ou um modelo 3D rigado.
- As poses vêm de imagens de baixa resolução (~400 px); em telas grandes ficam levemente suaves.
  Para melhorar, substitua os arquivos em `assets/astronauta/` por versões em alta resolução (mesmo nome)
  e ajuste `hr`/`cx` em `js/scenes.js`.
- Recortes automáticos têm pequenas imperfeições nas bordas.
