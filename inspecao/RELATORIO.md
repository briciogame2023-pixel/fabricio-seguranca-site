# Relatório — transformação visual do Inspeções SSMA

Estado: **implementado e testado localmente; NÃO publicado** (ver "Pendências").

## 1. Páginas reformuladas
As 57 telas do app herdam a nova identidade (tokens + componentes + shell). 54 renderizam sem erro; as 3 restantes
(`ident`, `quest`, `resumo`) só abrem com uma inspeção em andamento — o mesmo comportamento do original.
Reestruturação **por tela** (reorganizar blocos de cada uma das ~57 telas) ainda **não** foi feita: a mudança é de linguagem
visual, hierarquia e componentes, não de layout individual.

## 2. Componentes criados ou atualizados
- Design System "Sentinela": paleta verde-floresta + lima, estados (ok/alerta/erro/info), tipografia (Bricolage Grotesque + Public Sans), escala de espaços, raios, sombras, movimento; tema claro e escuro.
- Sidebar corporativa: grupos recolhíveis, item ativo, recolher para ícones com tooltips, perfil e Sair no rodapé.
- Cabeçalho: busca de telas (Ctrl+K, respeita permissões), notificações com contador, configurações (tema, tamanho do texto, perfil, sair), perfil.
- Trilha de página com breadcrumb e título; botão Voltar.
- Botões (primário, secundário, perigo, pequeno, carregando), seletores/abas, filtros, KPIs com barra de estado, cards de gráfico, listagens, chips/badges, formulários com foco e erro, tabelas, modais, toasts, esqueleto de carregamento, navegação inferior móvel.
- Ícones: emoji do app trocados por Lucide (mesmo traço); gráficos com paleta alinhada.

## 3. Melhorias de UX/UI
Menu persistente no desktop (antes: gaveta), busca rápida, breadcrumbs, agrupamento colapsável, entrada discreta das páginas, esqueleto no carregamento,
foco/Esc/Tab preso em modais, skip-link "Ir para o conteúdo".

## 4. Responsividade
Desktop ≥1000px: sidebar fixa. Tablet/celular: gaveta + barra inferior, busca oculta. **Sem rolagem horizontal em 390, 820, 1024 e 1440 px em 50 telas.**

## 5. Testes executados (ambiente local com banco simulado)
| Teste | Resultado |
|---|---|
| Percurso das 57 telas | 54 OK; 3 dependem de estado (igual ao original); 0 erros novos |
| 25 checagens de interação (sidebar, tooltip, Ctrl+K, tema, persistência, menu móvel, Esc, teclado) | 25/25 (1 oscilação de tempo em 1 de 5 rodadas, não reproduzida) |
| axe-core WCAG 2.x A/AA, 25 telas × claro/escuro | 1 achado restante (abaixo) |
| Estouro horizontal, 4 larguras × 50 telas | 0 |

## 6. Problemas encontrados e pendências
Bugs do **original** corrigidos: ícones 24×24 sem tamanho que quebravam a Ergonomia 360° (SVG preto gigante); aba "undefined AET"; gráficos, selects e abas sem nome acessível.
Pendências / limites honestos:
- **Não publicado.** Publicar sobre o artefato existente substitui o app em uso; precisa da sua autorização.
- Autenticação, permissões, regras de negócio e banco **não foram alterados**. Mas o teste usou banco **simulado e vazio**: login real, dados reais, formulários completos com dados e fluxos de ponta a ponta **não foram testados**.
- Fontes (Google Fonts) não carregaram no ambiente de teste (sem rede); a renderização com as fontes finais não foi vista.
- 1 contraste insuficiente: rótulo colorido de categoria nas Etiquetas SIM (cor vem dos dados).
- Tabelas com busca/ordenação/paginação e formulários em etapas **não** foram reconstruídos; ganharam só o novo visual.
- Dashboard: nova linguagem visual, mas sem indicadores novos (sem inventar dados).
- Conformidade WCAG 2.2 AA: verificação automática apenas; falta revisão manual com leitor de tela.


---

# Dashboard executivo (Painel geral > aba "Executivo")

Implementado em `design/dashboard.js` + `design/dashboard.css`. Usa apenas dados reais já carregados (inspeções e ações) e as mesmas
funções de filtro do painel original. O painel anterior (acidentes, OCS, DDS, ranking) continua inteiro na aba **Detalhado**.

## O que existe no banco e o que não existe
| Pedido | Situação |
|---|---|
| Total / realizadas / concluídas | **Inspeções realizadas**: o app só grava a inspeção ao concluir, então total = realizadas = concluídas (um indicador só) |
| Pendentes / em andamento | **Não exibidos**: não existem no banco. O rascunho fica só no aparelho de quem iniciou; aparece em "Aguardando conclusão" |
| NC identificadas / tratadas | Exibidos. NC tratada = NC cuja ação vinculada (`acaoId`) foi concluída. NC com ação excluída não entra |
| Ações vencidas, taxa de conformidade | Exibidos (mesmas regras do app: prazo vencido e não concluída; conformes ÷ aplicáveis) |
| Extras compatíveis | Ações em andamento e ações concluídas (com % no prazo) |

## Blocos
Situação geral (semáforo com regra explícita) → 7 indicadores → evolução das inspeções, índice de conformidade (anel + tendência), distribuição por categoria e por área (alternáveis), NC por classificação (tipo de risco), pendências por responsável, situação e evolução dos planos de ação → atividade recente (últimas inspeções, últimas irregularidades, ações atualizadas, aguardando conclusão).
Filtros: período, categoria (ferramenta), área, responsável, status das ações; chips removíveis e "Limpar tudo". Clicar em um responsável, área ou mês filtra o painel.
Regra do semáforo: crítica se conformidade < 80% ou > 20% das ações abertas vencidas; atenção se conformidade < 90% ou qualquer ação vencida; senão sob controle.

## Testes (dados sintéticos, só no ambiente de teste — `tools/make-seed.py`; nada disso vai para o app)
- 40 verificações automáticas em `tools/run-dashboard.js`, incluindo recálculo independente dos 7 indicadores direto dos dados brutos (todos iguais) e dos resultados de cada filtro.
- Estado vazio sem dados: mostra "Sem dados no período", zeros e "—"; nenhum número inventado.
- axe-core (WCAG 2.x A/AA): 0 violações no painel Executivo e na aba Detalhado, claro/escuro, 1440 e 390 px.
- Sem rolagem horizontal no celular. Sem erros de console.

## Limites
- Validado com dados sintéticos; **não** foi visto com os seus dados reais.
- O filtro de status vale para ações e NC; inspeções e conformidade seguem período, categoria e área (aviso na tela quando o filtro está ativo).
- "Responsável" cobre ações (responsável da ação) e inspeções (inspetor, responsável pela área ou responsável de uma NC).
- Dois indicadores pedidos (pendentes e em andamento) dependem de uma mudança no app (gravar a inspeção ao iniciar). Não fiz: altera regra de negócio e banco.
