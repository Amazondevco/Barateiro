# Design System — Super Barateiro

> **Status:** Levantamento (nada implementado ainda).
> O sistema do Super Barateiro segue um design system próprio (base "LDR Hub", v1.0.0).
> Projeto de design a importar: `claude.ai/design/p/7d472b3d-29e0-43cb-85b1-910fd41b7335`.

---

## 1. Posicionamento de marca (importante)

- **Plataforma** = marca-mãe (a empresa que constrói e vende os sistemas).
- **Super Barateiro** = cliente/tenant dentro da plataforma.
- O print já mostra o padrão **multi-tenant**: avatar de conta "Sala Comercial" + botão **"Trocar de conta"**. Ou seja, o design system **já nasceu multi-cliente** — exatamente o que planejamos para revender.
- **Aplicação no Barateiro:** mantém o shell/design base; a identidade do cliente (logo Super Barateiro, azul) entra como **marca do tenant** (branding por conta).
- **White-label self-service:** **cada cliente (rede) faz o upload da própria logo** dentro do ambiente dele, em Configurações. A logo aparece automaticamente no app (sidebar/login), nos relatórios e em exportações daquele tenant. Cada rede só enxerga e altera a sua — nunca a de outra.

---

## 2. Estrutura de tela (app shell)

```
┌────────────┬──────────────────────────────────────────────┐
│  SIDEBAR   │  TOPBAR: breadcrumb + título | idioma · tema  │
│  (escura)  │          · conta · trocar de conta            │
│            ├──────────────────────────────────────────────┤
│  logo      │  CONTEÚDO (fundo claro)                       │
│  nav itens │   • linha de cards KPI                        │
│  ...       │   • seções com cards/listas                   │
│  rodapé    │                                  [FABs] ●●    │
└────────────┴──────────────────────────────────────────────┘
```

### Sidebar (escura)
- Topo: wordmark da **plataforma** + selo "LDR HUB" + tagline pequena.
- Itens de navegação com ícone + label. Item ativo = **pílula índigo preenchida**.
- Suporte a **badge** num item (ex.: "Sugestões de Melhoria 3").
- Rodapé: link "Suporte" + versão ("v1.0.0 · © 2026").
- Botão de **recolher** a sidebar (ícone no topo do conteúdo).

### Topbar
- **Breadcrumb** ("Console / Dashboard") + **título grande** da página.
- Direita: seletor de **idioma** (Português BR), **toggle de tema** (claro/escuro), **chip de conta** (avatar com iniciais + nome + e-mail), **"Trocar de conta"**.

### Conteúdo
- **Cards de KPI** no topo: número grande (colorido) + label + sublabel.
- Seções com título (ex.: "Metas por LDR") e **cards** contendo **barras de progresso**, contadores "x / y (z%)" e legenda.
- **FABs** (botões flutuantes) no canto inferior direito, círculos índigo.

---

## 3. Linguagem visual

| Elemento | Padrão observado |
|---|---|
| Cor de destaque (plataforma) | Índigo/violeta (~`#5B5BF5` / `#6366F1`) |
| Sidebar | Azul-marinho bem escuro (quase preto azulado) |
| Fundo do conteúdo | Cinza muito claro (~`#F5F6FA`) |
| Cards | Branco, cantos arredondados (~12–16px), borda sutil, sombra leve |
| Cores semânticas nos KPIs | Índigo / escuro / laranja (atenção) / verde (sucesso) |
| Tipografia | Sans serif tipo Inter; títulos em peso forte |
| Tema | Claro e **escuro** (toggle) |
| Idioma | i18n (PT-BR no print) — preparado para multi-idioma |

---

## 4. Como o Barateiro reaproveita isso

- **Mesmo shell e componentes** (sidebar, topbar, cards, progress, FABs, badges).
- **Branding por tenant:** logo Super Barateiro + paleta azul aplicada como tema do cliente, sobre a base do design system.
- **Navegação adaptada ao produto Checklist**, por exemplo:
  - Visão geral (dashboard) · Checklists · Lojas · Usuários · Relatórios · Configurações.
- KPIs do dashboard do Barateiro (ex.): % de conformidade hoje, checklists pendentes, itens "Não" na semana, lojas em dia com a frequência 4x.

---

## 5. Próximos passos para o design (quando for a hora — NÃO agora)

1. **Conectar o conector de design** (`claude_design` MCP). Se pedir autorização, rodar **`/design-login`** (adiciona escopos `user:design:read/write`).
2. **Importar o projeto** `7d472b3d-29e0-43cb-85b1-910fd41b7335` para ler os componentes reais (tokens, cores, espaçamentos, componentes).
3. **Mapear** os componentes base que o Checklist do Barateiro vai usar.
4. Só então **implementar** as telas reaproveitando o design system.

> ⏸️ Por ora: apenas levantado. Nada conectado, importado ou implementado.
