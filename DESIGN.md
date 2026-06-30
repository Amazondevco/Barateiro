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
| `--ia` / `--ia-strong` | `#7c3aed`/`#6d28d9` | `#8b5cf6`/`#7c3aed` | **Acento de IA** (violeta) — só em IA |

> **Acento de IA (violeta).** Constante do **produto** (como o verde `#15803d` da
> logo), **não** é cor de rede. Use `bg-ia`/`text-ia`/`from-ia to-ia-strong` e o
> par `Sparkles` só em superfícies de IA (botão "Resumir com IA", bloco de resumo).
> Nunca para ações comuns — essas seguem `--primary` (cor da rede).

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

### Toast — `src/components/toast.tsx`
**Feedback de AÇÃO do usuário** (salvar/editar/excluir/carregar) — não confundir
com o sino (`NotificationBell`), que é evento do sistema. Balão no **topo-direito**
(`rounded-2xl border shadow-md`, ícone em círculo + texto + X no canto superior
esquerdo), entra com `.toast-in`. Variantes por tom: **success** (`success-bg` +
`CheckCircle2`), **error** (`danger-bg` + `AlertCircle`, usado em exclusões/falhas),
**info** (`primary/10`), **loading** (spinner, fica até `update`/`dismiss`).
- API: `const t = useToast()` → `t.success/error/info(msg)`, `t.loading(msg)` →
  id, `t.update(id, {type,message})`, `t.dismiss(id)`. Auto-some (success 3,5s /
  error 5,5s / loading nunca).
- Forms com Server Action: `useActionToast(state, { success: "…" })` dispara o
  toast a partir de `state.ok`/`state.error` (useActionState).
- Carregamento → resultado: `const id = t.loading("Salvando…"); …; t.update(id,
  {type:"success", message:"Salvo."})`.
- **Regra:** toda ação de CRUD deve emitir toast. Provider fica no `DashboardShell`.

### FABs
Flutuantes, cor primária, `rounded-full shadow-lg`. Sugestão (lâmpada) e
Assistente IA (sparkle). Empilham no canto inferior direito.

---

## 7. Padrões do Painel

- Sidebar **escura** (tokens `--sidebar-*`) recolhível; **rodapé** com "Suporte
  Check.AI" (`LifeBuoy` → `/suporte`) + versão e "© 2026 Check.AI" em
  `text-sidebar-muted` (recolhe junto com a barra). Topbar herda a cor da sidebar.
- **Topbar (à direita):** busca + **sino de notificações** + tema + usuário. A
  **busca** fica recolhida só como **lupa** (botão `h-9 w-9`); passar o mouse ou
  clicar expande a barra (`TopbarSearch`), recolhendo ao sair se vazia. O **sino**
  (`NotificationBell`) tem badge `bg-danger` com a contagem e abre um **balão pra
  baixo** (portal ancorado, `rounded-xl bg-card shadow-xl`) com a lista; v1 lista
  **respostas não lidas** da rede (`getNotificacoes`), abrir leva ao formulário.
- Título da página via `page-title` (derivado da rota).
- Busca global (`TopbarSearch`) → dropdown por seções → `/busca` (ver `src/lib/search.ts`).
- Tabelas/listas com linhas clicáveis levam ao detalhe; painel lateral para detalhe
  de resposta (`resposta-panel`).

### 7.1 Painel de detalhe da resposta (`resposta-panel`)
Painel flutuante à direita: `bg-card`, `sm:m-3 sm:rounded-3xl shadow-2xl`,
`max-w-3xl` (tela cheia no mobile), backdrop `bg-black/40`. Estrutura:
- **Cabeçalho:** título `text-xl/2xl font-bold`; subtítulo com `Calendar` + data •
  `Store` + unidade (`text-muted-foreground`); badge **"Lido pelo admin"** (`Eye`,
  pílula `bg-muted`) quando lida; fechar = `X` em botão circular.
- **Cartão de resumo** (`rounded-2xl border bg-muted/30 p-5`): pílulas de status em
  **cartão branco com borda** (`rounded-full border bg-card`, ícone lucide +
  `text-success/-warning/-danger`): não-conformidades (`CircleAlert`), prazo
  (`Clock`), presença (`MapPin`: "No local"/"Fora do local"), autor (avatar de
  iniciais + nome). Botão **"Resumir com IA"** no acento violeta
  (`bg-gradient-to-r from-ia to-ia-strong text-ia-foreground`, `Sparkles`); o
  resumo aparece num bloco `border-ia/30 bg-ia/5`.
- **Seções:** cabeçalho com ícone em caixa `rounded-lg bg-primary/10 text-primary`
  + título uppercase. O ícone é inferido do título (`secaoIcon`: mercearia, frios,
  hortifruti…); sem match → `Package`.
- **Itens:** cartão `rounded-2xl border divide-y`; cada linha pergunta + **badge**
  de resposta (`rounded-lg px-3 py-1 font-semibold`, Sim=`success-bg`, Não=`danger-bg`,
  neutro=`muted`). Anexo (foto/observação) num **cartão tracejado** (`border-dashed
  bg-muted/40`) com miniatura clicável (lightbox) + nome do arquivo + observação.

### 7.2 Leitura de respostas (lida / não lida)
A resposta registra `lida_em`/`lida_por` (migration 0045, RPC
`marcar_resposta_lida`, SECURITY DEFINER — só `profiles`/painel marcam). Abrir o
painel = marcar como lida (idempotente, mantém o 1º leitor). Na **listagem**, a
não-lida tem **ponto `bg-primary`** antes da data/unidade + leve realce
(`bg-primary/[0.03]` na tabela, borda `border-primary/40` no cartão) e texto em
`font-semibold`. Feedback é otimista (set local) + `router.refresh()` ao fechar.
- **Painel de relatórios** (aba "Painel" do formulário): cartões `rounded-xl border
  bg-card` com gráficos **leves em SVG/CSS** (donut, barras, linha, KPI) na cor
  `--primary`/`stroke-primary`/`fill-primary` — **sem libs de chart**. A IA (Groq)
  propõe os relatórios de um **catálogo fixo de tipos** (`src/lib/relatorios.ts`);
  o app calcula com as respostas reais. Novo relatório por **texto ou áudio**
  (Whisper). Mantenha esse estilo de gráfico minimalista.

---

## 8. Padrões do App (PWA)

- **Sem barra superior e sem hambúrguer.** Cada tela tem seu próprio título.
- **Início:** banner com **cor sólida da rede** + logo (cartão branco) + nome
  centralizados; abaixo, busca + **Filtros** + **Ordenar por** (inclui "Minha
  ordem" com arrastar). Banner compacto.
- **Barra inferior (flutuante):** pílula branca (`bg-card`, `rounded-[32px]`,
  sombra) que **não encosta nas bordas** (`fixed inset-x-0 bottom-6 px-5`,
  `max-w-md` centralizado). Só ícones, 5 abas (Início, Avisos, Formulários,
  Perfil, Config). O item **ativo sobressai** (`-translate-y-[22px]`) dentro de
  um **círculo na cor da rede** (`bg-primary`) com anel `border-background` que
  "recorta" a barra; ícone ativo em `text-primary-foreground`. O conteúdo das
  telas reserva `pb-[110px]` para não ficar atrás da barra.
- **Formulários:** etapas por **quebra de página** (igual à prévia do builder),
  barra de progresso, **revisão final** antes de confirmar o envio (assinatura +
  botão fixo "Confirmar e enviar").
- **Offline:** envio entra em fila (IndexedDB) e sincroniza sozinho; tarja no topo
  indica offline/pendências (`OfflineSyncProvider`).

### 8.1 Vocabulário visual (reskin)
A cor de destaque é **sempre a cor da rede** (`--primary`/`bg-primary`); o laranja
dos mockups é só placeholder. Fonte permanece **Geist**.
- **Banner do Início:** gradiente da cor da rede (`bg-gradient-to-br from-primary to-[mais escuro]`),
  cantos inferiores `rounded-b-3xl`, logo em cartão branco (`rounded-2xl`), nome +
  subtítulo (unidade • cargo) centralizados em `text-primary-foreground`.
- **Busca + filtros:** input de busca (sobrepondo o banner, `-mt-5`) + pills de
  filtro/ordenação (`rounded-full border border-border bg-card`).
- **Cartão de formulário:** `rounded-2xl border border-border bg-card`, ícone em
  caixa `rounded-xl bg-primary/10 text-primary`, título + subtítulo truncados,
  **badge de status** + chevron à direita.
- **Badges de status:** `rounded-full px-2 py-0.5 text-xs font-semibold` —
  Hoje/Enviado = `bg-success-bg text-success`; Pendente = `bg-warning-bg text-warning`;
  Erro = `bg-danger-bg text-danger`.
- **Respostas segmentadas (Sim/Não/N/A):** botões `flex-1 h-11 rounded-xl border`;
  selecionado Sim = `border-success bg-success-bg text-success`, Não =
  `border-danger bg-danger-bg text-danger`, N/A = `border-primary bg-primary/10 text-primary`.
  Quando "Não", abre bloco contextual (`bg-danger-bg/40`) com botão de **foto** +
  campo de **observação**.
- **Progresso (preencher):** segmentos `h-1 flex-1 rounded-full`; concluído =
  `bg-primary/50`, atual = `bg-primary`, futuro = `bg-border`. Header com voltar +
  "Etapa X de N". Rodapé fixo com botão primário ("Próxima"/"Revisar").
- **Revisão:** resumo agrupado por seção (cabeçalho com **ícone** inferido do
  título via `secaoIcon` + cartão com linhas pergunta → badge), indicador de anexo.
  **A partir da assinatura tudo fica FIXO na base:** bloco recolhível "Anexar
  minha assinatura" (quadrado vira ✓ ao assinar + chevron) seguido do rodapé
  Editar/Confirmar. **Confirmar só habilita após assinar.** Vale para PWA
  (`fill-form.tsx`) e nativo (`fill-form-page.tsx`) — mantê-los idênticos.
- **Listagem (Formulários):** controle segmentado Enviados/Pendentes
  (`bg-muted rounded-xl p-1`, ativo `bg-card text-primary shadow-sm` + contador).
- **Perfil:** avatar circular grande, cartões agrupados (Dados Pessoais / Vínculo)
  com linhas ícone + rótulo + valor; "Sair" em vermelho (`text-danger`).
- **Config:** tema em grade de 3 (`border-primary bg-primary/10` ativo);
  **Diagnóstico Operacional só-leitura** (status conexão, pendentes, última sync —
  sem botão de sincronizar manual); "Sair da conta".

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
## App nativo - status offline/sync

- O app operador deve mostrar um banner compacto apenas quando houver algo acionavel: aparelho offline, envios pendentes ou erros de sincronizacao.
- O banner usa `position: sticky`, formato pill, fundo branco translúcido, `--border`, sombra suave e icones lucide pequenos.
- Estados de erro usam `--danger`; contadores e cartoes de fila usam `--muted`, `--foreground` e `--muted-foreground`.
- A tela de Configuracoes e o lugar canonico para diagnostico operacional: conexao atual, contagem de pendentes/sincronizados/erros e botao "Sincronizar agora".

## App nativo - deep links

- Deep links usam o scheme `checkai://` enquanto o app estiver em POC/debug.
- Links devem abrir rotas internas sem criar tela intermediaria; se nao houver sessao, o fluxo normal de login assume.
- Rotas documentadas ficam em `docs/TESTE-DEEP-LINK-NATIVO.md` para testes com ADB/Xcode.

## App nativo - paridade visual com o PWA

- O `native-poc/` usa o **mesmo design system** do PWA: Tailwind v4, os tokens de
  `:root`/`.dark` portados de `globals.css`, fonte **Geist** e os componentes
  `Button`/`Input` espelhados (`native-poc/src/ui/`). Nada de CSS custom fora dos tokens.
- Telas reusam o markup/classes das telas web equivalentes (Início = banner sólido +
  `forms-board`; barra inferior só com ícones + indicador deslizante; fila offline em
  pílula sticky). Ao mexer numa tela do PWA, reflita no nativo (e vice-versa).
- Cor da rede: `applyPrimaryColor` injeta `--primary` e `--primary-hover`
  (`color-mix … 85%, black`), igual ao `(app)/app/layout.tsx`. Texto do banner adapta
  via `isLightHex` (`native-poc/src/lib/utils.ts`).
- Tema (claro/escuro/sistema) fica em `localStorage["checkai-theme"]`, aplicado no boot
  (`main.tsx`) e alternável na tela de Config.

## Marca Check.AI (logo do produto)

- A **marca do produto** Check.AI é **verde `#15803d`** — um **check geométrico**
  branco + um **brilho ✦** (acento de IA) sobre badge verde de cantos arredondados.
  Não confundir com a **cor da rede** (`--primary`, runtime): a logo do produto é fixa.
- Fonte única em `native-poc/src/assets/checkai-logo.svg` (badge 1024). Reusada no
  **login** (lockup `Check.AI` com `.AI` em verde), no **favicon**
  (`native-poc/public/favicon.svg`) e como base do **ícone do launcher + splash**.
- Ícone/splash nativos gerados por `@capacitor/assets` a partir de `native-poc/assets/`
  (`icon-only`, `icon-foreground`/`icon-background` adaptativo, `splash`/`splash-dark`).
  Splash = fundo verde uniforme + check branco centralizado. Para regenerar:
  `npx capacitor-assets generate --android` (fontes em `native-poc/assets/`).
