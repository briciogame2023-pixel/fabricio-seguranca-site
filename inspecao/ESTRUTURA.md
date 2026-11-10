# Inspeções SSMA — mapa da estrutura

Origem: artefato "Inspeções SSMA" (claude.ai/artifact/MSb9z9kSCdQ48N8tCKPwVs).
Hoje é **1 arquivo HTML de ~1,8 MB** (~7.800 linhas, ~650 funções, ~550 KB de imagens em base64).
Esta pasta é o esqueleto para separá-lo em arquivos organizados.

## Camadas do app original
1. **HTML + CSS** (~90 KB de estilo): tema claro/escuro, menu lateral, barra inferior, cartões.
2. **JavaScript** (~1,7 MB): telas `vXxx()`, funções auxiliares e navegação via `go('tela')`.
3. **Banco de dados do artefato** (`db`): ~45 coleções, regras de leitura/escrita por perfil.
4. **Biblioteca externa**: jsPDF 4.2.1 (gera PDFs).

## Módulos (menu do app → arquivo em `js/modulos/`)
| Menu | Telas (`go`) | Arquivo |
|---|---|---|
| Painel geral | inicio | `painel.js` |
| Acompanhamento de ações | acomp, acoes, acao | `acoes.js` |
| Acidentologia | acidentologia | `acidentologia.js` |
| Comunicados de acidente | comunic, comunicdet | `comunicados.js` |
| Pesquisa psicossocial / Ergonomia 360° | erg | `ergonomia.js` |
| DDS, Ranking, Mural | dds, ranking, feed | `comunidade.js` |
| Inspeções de segurança (o núcleo) | nova, ident, quest, resumo, done, hist, detalhe | `inspecoes.js` |
| Investigação de acidentes | acid, acidnovo, acidform | `acidentes.js` |
| Pertinência | pert | `pertinencia.js` |
| Treinamentos | trein, treinadd, treinpes, turma, trcad, trrest, trcursof, trturmaf, carteira | `treinamentos.js` |
| OCS | ocs, ocsnova, ocsresumo, ocsok, ocsver | `ocs.js` |
| RSP (revisão de projetos) | rsp, rspnova, rspver | `rsp.js` |
| IPAR | ipar, iparver | `ipar.js` |
| Pirâmide Máquinas SIM / Etiquetas SIM | sim, etq, etqver | `sim.js` |
| Meu perfil, Equipe, Mão de obra, Base RH | minhas, tarefa, cadastro, meu, maoobra | `pessoas.js` |

## Núcleo (`js/core/`)
- `navegacao.js` — `go`, `voltar`, `render`, menu lateral, tema.
- `acesso.js` — login, perfis, hierarquia, vínculo conta→NP, `pode()`.
- `dados.js` — acesso ao banco (`db`), rascunhos locais, cofre.
- `graficos.js` — gráficos SVG sem dependências (colunas, barras, rosca).
- `pdf.js` — PDFs (ocorrência, carteira, certificado, turma, RSP, relatório).
- `notificacoes.js` — sino e avisos por módulo.

## Banco de dados (coleções principais)
pessoas, perfis, vinculos, usuarios, acessos, base_rh, inspecoes, acoes, ocorrencias (+_med, _ind), ocs, rsp, ipar (+_lin, _rev), etiquetas, treinos, turmas, cursos, trein_sol/audit/docs, restricoes, dds, posts, reacoes, comentarios, tarefas, fotos, fotos_restr, entrevistas, erg_* (13 coleções), config.
Sensíveis (só admin lê): ocorrencias_med, fotos_restr, entrevistas, solicitacoes.

## ⚠️ Limite importante
O app usa o **banco e o login do ambiente de artefatos do Claude**. Fora de lá (neste site no GitHub Pages) ele não tem banco nem usuários.
Para rodar aqui será preciso trocar a camada `core/dados.js` + `core/acesso.js` por um back-end real (ex.: Supabase, como no projeto Missão SIM).

## Próximos passos
1. Separar CSS e JS do HTML original nestes arquivos.
2. Trocar a camada de dados por um back-end real.
3. Publicar em `/inspecao/` e testar.
