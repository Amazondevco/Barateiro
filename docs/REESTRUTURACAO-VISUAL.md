# Reestruturação visual — Check.AI

Plano por fases para alinhar o sistema à identidade visual do mockup de
referência (set/2026). O **laranja** do mockup é placeholder — o destaque é
sempre a **cor da rede** (`--primary`).

## Identidade-alvo (do mockup)
- **Rail (sidebar recolhida):** só ícones, item ativo com realce arredondado,
  **grupos recolhíveis**, usuário como **avatar circular** no rodapé.
- **Topbar clara:** menu + breadcrumb + título; ações só em ícone (busca, sino, tema).
- **Tabs = controle segmentado** em cartão branco; aba ativa = pílula escura.
- **Tabela em cartão:** chip de ícone colorido por linha, célula de 2 linhas
  (título + meta), headers uppercase, badge pill, coluna de ações, mais respiro.
- **Header de página** grande (título + subtítulo) + botão "Novo X" arredondado.
- **Tipografia:** fonte do sistema (San Francisco na Apple) e escala mais arejada.

## Fases

- [x] **Fase 0 — Tipografia & fundação.** Trocar `--font-sans` para a stack do
  sistema (SF na Apple); helper de "icon chip" (cor derivada do nome). Ajuste de
  escala tipográfica acontece dentro de cada fase de componente.
- [x] **Fase 1 — Sidebar.** Grupos **recolhíveis** (estado salvo); rail polida
  (ícones centralizados, ativo realçado); caixa do usuário com avatar circular
  (foto se houver; recolhida = só o avatar).
- [x] **Fase 2 — Tabs (segmented pill).** Componente reutilizável (cartão branco +
  pílula ativa). Aplicar no detalhe do checklist e em Configurações.
- [x] **Fase 3 — Tabelas/listas.** Evoluir `Table` (chip de ícone, célula de 2
  linhas, headers uppercase, badge pill, ações, respiro, sombra). Aplicar em
  Unidades, Departamentos, Usuários, Equipe, lista de Checklists.
- [x] **Fase 4 — Header de página + botões.** `PageHeader` maior; botão "Novo X"
  padronizado (arredondado, ícone +, cor da rede).
- [ ] **Fase 5 — App: checklist fora do horário.** No PWA e no nativo, checklist
  fora do dia/horário aparece **cinza/inativo com ícone de relógio**, mas ainda
  **preenchível** (aviso "fora do horário"). Hoje ele é escondido.
- [ ] **Fase 6 — Polimento.** Dark mode, responsividade e `DESIGN.md`.

> Ordem sugerida: 0 → 1 → 2 → 3 → 4 → 5 → 6 (5 pode ser priorizada se o app urgir).
