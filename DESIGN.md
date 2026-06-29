# Identidade Visual — Check.AI

> **Documento normativo.** Qualquer alteração de UI/UX (cores, componentes, telas,
> espaçamento, tipografia, ícones, tom de voz) **deve seguir este documento**.
> Se algo aqui conflitar com um pedido, aponte o conflito antes de fugir do padrão.
> Ao criar um padrão novo, **atualize este arquivo** na mesma mudança.

---

## 1. Conceito

**Check.AI** é uma plataforma SaaS multi-tenant de gestão para redes de
supermercados. Dois produtos, uma identidade:

- **Painel (dashboard)** — web, desktop-first. Usado por super admin (Check.AI) e
  admin da rede. Sidebar escura + topbar.
- **App (PWA)** — mobile-first. Usado pela equipe da rede (operadores/gestores).
  Sem topo, banner com a marca da rede + barra de navegação inferior.

Princípios: **limpo, com respiro, sem ruído**. Cartões claros sobre fundo cinza
suave, cantos arredondados, contraste suave porém perceptível, foco no conteúdo.
Cada rede personaliza **logo + cor**; o resto da linguagem é constante.

---

## 2. Multi-tenant / theming dinâmico

A marca é **por rede**, aplicada em runtime — nunca hardcode cor de cliente.

- **Painel:** `DashboardShell` injeta `--primary`, `--ring`, `--sidebar-*` a partir
  de `redes.cor_primaria` / `redes.cor_sidebar`.
- **App:** `(app)/app/layout.tsx` injeta `--primary` (e hover) a partir de
  `redes.app_cor || redes.cor_primaria`. Essa cor vale para **fundo da Início,
  barra inferior e botões**.
- A marca da rede para o app é lida em `src/lib/rede-branding.ts` (service role,
  escopada à rede do membro — membros do app não têm `profiles`).

Regra de ouro: **cores vêm de tokens CSS** (`bg-primary`, `text-muted-foreground`,
`border-border`…). Nunca escreva hex de cor de marca no JSX; use a variável.

---

## 3. Tokens de cor

Definidos em `src/app/globals.css` (`:root` light, `.dark` dark) e expostos como
utilitários Tailwind via `@theme inline` (`bg-card`, `text-foreground`, etc.).

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--background` | `#f6f7f9` | `#0b1120` | Fundo da página |
| `--foreground` | `#0f172a` | `#e2e8f0` | Texto principal |
| `--card` | `#ffffff` | `#111827` | Cartões, inputs |
| `--muted` | `#f1f5f9` | `#1e293b` | Hover/superfície fraca |
| `--muted-foreground` | `#64748b` | `#94a3b8` | Texto secundário |
| `--border` / `--input` | `#e2e8f0` | `#1e293b` | Bordas (no app: `#cbd5e1`/`#334155`) |
| `--primary` | `#2563eb` (default) | `#3b82f6` | **Sobrescrito pela rede** |
| `--primary-foreground` | `#ffffff` | `#ffffff` | Texto sobre primária |
| `--accent` | `#ec4899` | `#f472b6` | Acento (rosa) |
| `--sidebar*` | escuro | escuro | Sidebar do painel (sempre escura) |
| `--success` / `--success-bg` | `#16a34a`/`#dcfce7` | — | Conforme/OK |
| `--warning` / `--warning-bg` | `#d97706`/`#fef3c7` | — | Atenção/pendente |
| `--danger` / `--danger-bg` | `#dc2626`/`#fee2e2` | — | Não-conformidade/erro |

Texto sobre cor de marca: calcule a luminância e use texto escuro em cor clara
(`isLightHex`, já usado no banner do app e na sidebar).

---

## 4. Tipografia

- Fonte: **Geist Sans** (`--font-sans`), mono = Geist Mono.
- Títulos de página: `text-lg`/`text-xl font-semibold`.
- Corpo: `text-sm` (padrão), `text-xs` para secundário.
- Rótulos de seção: `text-xs font-medium uppercase tracking-wide text-muted-foreground`.
- Peso: `font-medium` para ênfase, `font-semibold`/`font-bold` para títulos.

---

## 5. Forma, espaçamento, elevação

- **Raio:** `--radius: 0.75rem`. Use `rounded-lg` (cartões/inputs), `rounded-xl`
  (cartões maiores), `rounded-2xl` (logo/ícones), `rounded-full` (pílulas/avatares).
- **Espaçamento:** múltiplos de 4 (`gap-2`, `p-3`, `p-4`, `space-y-3/5`).
  Conteúdo do app em `p-4`/`p-5`; painel em `p-4 lg:p-6`.
- **Elevação:** sutil — `shadow-sm` (cartões/botões primários), `shadow-md`
  (banner/logo, popovers). Evite sombras pesadas.
- **Bordas:** sempre `border-border`. No app as bordas são levemente mais fortes
  (classe `.app-shell`) para separar blocos sem pesar.

---

## 6. Componentes-base

### Botão — `src/components/ui/button.tsx`
Variantes: `primary` (padrão, `bg-primary`), `secondary` (`bg-muted`), `outline`
(`border bg-card`), `ghost`, `danger`. Tamanhos: `sm h-8`, `md h-10`, `lg h-11`,
`icon h-10 w-10`. Sempre com `gap-2` e ícone lucide opcional à esquerda. Foco:
`ring-2 ring-ring`.

### Cartão
`rounded-xl border border-border bg-card p-3/p-4`. Listas: `divide-y divide-border`
dentro de um cartão com `overflow-hidden`.

### Input
`h-9`/`h-10 rounded-lg border border-input bg-card px-3 text-sm` +
`focus-visible:ring-2 focus-visible:ring-ring`. Busca: lupa lucide à esquerda
(`pl-9`).

### Ícones
**lucide-react**, tamanho `h-4 w-4` (inline) ou `h-5 w-5` (ações). Nunca emoji em
UI de produto.

### FABs
Flutuantes, cor primária, `rounded-full shadow-lg`. Sugestão (lâmpada) e
Assistente IA (sparkle). Empilham no canto inferior direito.

---

## 7. Padrões do Painel

- Sidebar **escura** (tokens `--sidebar-*`) recolhível; topbar herda a cor da sidebar.
- Título da página via `page-title` (derivado da rota).
- Busca global (`TopbarSearch`) → dropdown por seções → `/busca` (ver `src/lib/search.ts`).
- Tabelas/listas com linhas clicáveis levam ao detalhe; painel lateral para detalhe
  de resposta (`resposta-panel`).

---

## 8. Padrões do App (PWA)

- **Sem barra superior e sem hambúrguer.** Cada tela tem seu próprio título.
- **Início:** banner com **cor sólida da rede** + logo (cartão branco) + nome
  centralizados; abaixo, busca + **Filtros** + **Ordenar por** (inclui "Minha
  ordem" com arrastar). Banner compacto.
- **Barra inferior:** só ícones, indicador deslizante (pílula `bg-primary`,
  `rounded-[15px]`) centralizado; 5 abas (Início, Avisos, Formulários, Perfil,
  Config). Sem texto.
- **Formulários:** etapas por **quebra de página** (igual à prévia do builder),
  barra de progresso, **revisão final** antes de confirmar o envio (assinatura +
  botão fixo "Confirmar e enviar").
- **Offline:** envio entra em fila (IndexedDB) e sincroniza sozinho; tarja no topo
  indica offline/pendências (`OfflineSyncProvider`).

### Ícone/Splash do PWA
Gerado por rede em `/api/app-icon?rede=<id>`: **fundo na cor da marca + logo num
cartão branco** central (512×512). `manifest` e `apple-touch` apontam para ele;
`background_color` do manifest = cor da marca (splash uniforme). Não peça ícone
com fundo chapado ao admin — logo + cor já resolvem.

---

## 9. Status do checklist

- **OK / conforme:** `text-success`, fundo `success-bg`.
- **Pendente / atenção / prazo:** `text-warning`, `warning-bg`.
- **Não / ruptura / erro:** `text-danger`, `danger-bg`.
Botões de resposta selecionados: `border-primary bg-primary/10 text-primary`.

---

## 10. Tom de voz

- Português do Brasil, **direto e curto**. Frases de ajuda em uma linha.
- Rótulos no imperativo/claros ("Enviar", "Revisar e enviar", "Adicionar à tela
  inicial"). Sem jargão técnico para o usuário do app.
- Mensagens vazias acolhedoras ("Quando o gestor liberar checklists, eles aparecem
  aqui.").

---

## 11. Regras para qualquer mudança (checklist)

1. Use **tokens**, nunca hex de marca no código.
2. Respeite **light e dark** (teste os dois).
3. App é **mobile-first**; painel é **desktop-first** mas responsivo.
4. Reuse `Button`, cartões, inputs e padrões acima antes de criar novo.
5. Cor da rede só via `--primary`/`app_cor` (runtime), nunca fixa.
6. Ícones **lucide**; sem emoji em UI.
7. Mexeu em padrão visual? **Atualize este `DESIGN.md`.**
