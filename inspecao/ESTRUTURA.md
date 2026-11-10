# Inspeções SSMA — estrutura do projeto

Origem: artefato "Inspeções SSMA" (claude.ai/artifact/MSb9z9kSCdQ48N8tCKPwVs).
É um app de **um único arquivo HTML (~1,8 MB, ~7.800 linhas, ~650 funções)** que usa o banco e o login do ambiente de artefatos do Claude (`window.claude.use("db" | "user" | "downloads")`).

## Como esta pasta está organizada

```
inspecao/
├── original/        PONTO DE RESTAURAÇÃO — cópia intacta do app (nunca editar)
│   └── inspecoes-ssma.original.html
├── design/          Nova identidade visual (Design System "Sentinela")
│   ├── tokens.css       cores, tipografia, espaços, raios, sombras, movimento (claro + escuro)
│   ├── componentes.css  botões, cards, KPIs, filtros, formulários, tabelas, modais, shell…
│   ├── shell.html       novo cabeçalho, trilha/breadcrumb, sidebar, navegação móvel
│   ├── shell.js         sidebar recolhível, busca Ctrl+K, configurações, ícones, a11y
│   ├── dashboard.js     dashboard executivo (aba do Painel geral)
│   └── dashboard.css    estilos do dashboard
├── tools/           Build e testes
│   ├── build.py         original + design  ->  dist/inspecoes-ssma.html
│   ├── mock-claude.js   banco/usuário SIMULADOS (só teste local, nunca publicar)
│   ├── run-tour.js      percorre as 57 telas, captura e mede erros
│   ├── run-interacoes.js  25 checagens de sidebar/busca/tema/menu móvel
│   ├── run-a11y.js      axe-core (WCAG 2.x A/AA) em 25 telas × claro/escuro
│   ├── run-overflow.js  rolagem horizontal em 390/820/1024/1440 px
│   ├── run-dashboard.js 40 verificações do dashboard (filtros, abas, navegação, vazio, móvel)
│   ├── make-seed.py     dados SINTÉTICOS de teste (nunca publicar)
│   └── axe.min.js       axe-core 4.10.2 (MPL-2.0)
└── dist/
    └── inspecoes-ssma.html   resultado final, pronto para publicar como artefato
```

## Princípio: camada de design, sem tocar na lógica
O JavaScript de negócio (permissões, hierarquia, banco, regras de cada módulo) **não é alterado**.
A nova interface entra como CSS + um script que *envolve* `render()`, `montaMenu()` e `aplicaTema()`.
O build também aplica poucos remendos de bugs de interface do original, listados em `PATCHES` no `build.py`
(cada um é verificado para casar exatamente 1 vez).

## Como gerar e testar
```bash
npm pack lucide-static@0.468.0 && mkdir -p /tmp/lucide && tar xzf lucide-static-*.tgz -C /tmp/lucide   # ícones
python3 tools/build.py                                   # gera dist/inspecoes-ssma.html
cd tools && NODE_PATH=$(npm root -g) node run-interacoes.js ../dist/inspecoes-ssma.html /tmp/saida
```

## Módulos do app (menu -> telas `go('tela')`)
| Menu | Telas |
|---|---|
| Painel geral / Acompanhamento / Acidentologia / Comunicados | inicio, acomp, acoes, acao, acidentologia, comunic, comunicdet |
| DDS, Ranking, Mural | dds, ranking, feed |
| Inspeções de segurança | nova, ident, quest, resumo, done, hist, detalhe |
| Investigação de acidentes / Pertinência | acid, acidnovo, acidform, pert |
| Treinamentos | trein, treinadd, treinpes, turma, trcad, trrest, trcursof, trturmaf, carteira |
| OCS · RSP · IPAR | ocs*, rsp*, ipar, iparver |
| Ergonomia 360° | erg |
| Sistema SIM | sim, etq, etqver |
| Gestão | minhas, meu, tarefa, cadastro, maoobra, equipe, baserh, vinculos, usuarios, gestao, radar, relatorio |

## Banco de dados (≈45 coleções, regras por perfil no artefato)
pessoas, perfis, vinculos, usuarios, acessos, base_rh, inspecoes, acoes, ocorrencias(+_med,_ind), ocs, rsp, ipar(+_lin,_rev), etiquetas, treinos, turmas, cursos, trein_*, restricoes, dds, posts, reacoes, comentarios, tarefas, fotos, erg_* (13), config.
Sensíveis (somente admin): ocorrencias_med, fotos_restr, entrevistas, solicitacoes.

## Limite importante
Fora do ambiente de artefatos o app não tem banco nem login. Para rodar no site (GitHub Pages) seria preciso trocar a camada de dados/autenticação por um back-end real (ex.: Supabase).
Publicar o `dist/` **no mesmo artefato** preserva os dados e permissões; publicar como artefato novo começa com banco vazio.
