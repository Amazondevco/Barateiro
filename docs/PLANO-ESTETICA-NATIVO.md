# Plano — Re-skin estético do app nativo (igual ao PWA)

> **Objetivo:** o app nativo (`native-poc/`) está funcional, mas com um visual
> próprio (CSS manual) que **diverge do PWA**. Esta tarefa é **só re-skin**:
> deixar o nativo **visualmente idêntico ao PWA**, reusando o design system e o
> markup das telas que JÁ existem no app web. **Não criar telas novas. Não mexer
> na lógica de dados** (`operator-api`, `queue-store`/SQLite, `auth`, `sync`).
> **Seguir `DESIGN.md`.**

## Causa raiz (o que está feio)
`native-poc/src/styles.css` reimplementou a UI fora do design system:
- Fonte **Inter** (alvo: **Geist**)
- **Gradientes** (fundo + banner) — DESIGN.md proíbe gradiente
- **Sombras pesadas + `backdrop-filter: blur` "glass"** (alvo: `shadow-sm`)
- **Cantos 24–28px e pílulas 999px** (alvo: `rounded-xl` 12px / `rounded-lg`)
- **`font-weight: 700`** em tudo (alvo: só 400/500)
- **Sem dark mode** (PWA tem)
- Banner = cartão flutuante com gradiente; nav = pílula flutuante **com textos**

## Referências do PWA (copiar markup/classes destes arquivos)
| Tela nativa | Arquivo PWA de referência |
|---|---|
| `pages/login-page.tsx` | `src/app/login/login-form.tsx` |
| `pages/memberships-page.tsx` | lista de cartões `rounded-xl` (padrão geral) |
| `pages/network-home-page.tsx` | `src/app/(app)/app/rede/[id]/page.tsx` (banner) + `forms-board.tsx` |
| `pages/fill-form-page.tsx` | `src/app/(app)/app/rede/[id]/form/[formId]/fill-form.tsx` |
| `pages/forms-page.tsx` (enviados/fila) | `src/app/(app)/app/formularios/page.tsx` + `pending-enviados.tsx` |
| `pages/notices-page.tsx` | `src/app/(app)/app/avisos/page.tsx` |
| `pages/profile-page.tsx` | `src/app/(app)/app/perfil/page.tsx` |
| `pages/config-page.tsx` | `src/app/(app)/app/config/page.tsx` |
| `ui/bottom-nav.tsx` | `src/components/app-bottom-nav.tsx` |
| tarja offline (`native-status-banner`) | `src/components/offline-sync-provider.tsx` |
| tokens/estilo global | `src/app/globals.css` + `DESIGN.md` |

---

## Fase A — Fundação (faz o visual "pegar"; começar por aqui)
1. **Tailwind v4 no native-poc:**
   ```bash
   cd native-poc
   npm i tailwindcss @tailwindcss/vite
   ```
   - `vite.config.ts`: adicionar o plugin `tailwindcss()` (manter o `base: "./"` e o
     `strip-crossorigin` já existentes).
   - `src/styles.css`: começar com `@import "tailwindcss";`.
2. **Portar tokens do PWA:** copiar de `src/app/globals.css` para o `styles.css` do
   native-poc os blocos `:root` (light), `.dark`, o `@theme inline` e as regras
   `* { border-color: var(--border) }`, `.app-shell { ... }` (bordas mais fortes).
   Remover o CSS custom antigo (`.card`, `.hero`, `.bottom-nav`, gradientes…).
3. **Fonte Geist:**
   ```bash
   npm i @fontsource-variable/geist
   ```
   - importar em `src/main.tsx` e mapear `--font-sans` para Geist (igual ao PWA).
4. **Componente Button:** portar `src/components/ui/button.tsx` para
   `native-poc/src/ui/button.tsx` (mesmas variantes/tamanhos).
5. Dark mode: aplicar `.dark` na raiz conforme preferência (pode espelhar o
   `ThemeToggle` do PWA na config).

## Fase B — Shell & navegação
6. **Bottom nav** = só ícones + indicador deslizante: portar
   `src/components/app-bottom-nav.tsx`, trocando `Link`/`usePathname` por `NavLink`/
   `useLocation` do react-router. Manter as 5 abas (Início, Avisos, Enviados,
   Perfil, Config). **Sem textos, sem pílula flutuante** — barra edge-to-edge
   `sticky bottom-0 border-t bg-card`, pílula `bg-primary rounded-[15px]`.
7. **Shell** (`ui/app-shell.tsx`): remover fundo glass/gradiente; `app-shell` +
   `<main>` simples; tarja offline discreta (espelhar `offline-sync-provider`).

## Fase C — Telas (1:1 com o PWA)
Para cada `pages/*`, **trocar as classes CSS custom pelas classes Tailwind do
arquivo PWA de referência** (tabela acima). Pontos-chave:
- **Início (`network-home-page`):** banner **full-bleed cor sólida** (não gradiente)
  + logo em cartão branco `h-14` + nome `text-xl`; abaixo, **forms-board** (busca +
  Filtros + Ordenar + cards com ícone `rounded-xl`). Remover o eyebrow "MINHA REDE".
- **Preencher (`fill-form-page`):** etapas por quebra de página + barra de progresso
  + **revisão final** + assinatura + **botão fixo "Confirmar e enviar"** (idêntico ao
  PWA). Botões de resposta = `border-primary bg-primary/10 text-primary` (não pílula).
- **Enviados (`forms-page`):** cartões `rounded-xl` + selo "Aguardando envio/Enviado".
- **Perfil:** avatar + dados + **Vínculo** (unidade/cargo/departamento).
- **Config:** seções (Aparência/Conta/Sobre).

## Fase D — Branding dinâmico
8. `app_cor` da rede → `--primary` (já existe `applyPrimaryColor` em
   `operator-api.ts`). Banner sólido nessa cor com **texto claro/escuro automático**
   (`isLightHex`, como no PWA).

## Regras
- **Rodar `cd native-poc && npm run build` ANTES de cada commit** (já quebrou o deploy
  por erro de import — sempre validar).
- **Não** re-incluir `native-poc` no tsconfig do Next (está em `exclude`).
- **Não** tocar nos arquivos do app web (`src/app/**`) ao re-skinar o nativo — evita
  colisão com quem cuida do painel.
- Testar o APK pela Action **Build APK Android (POC)** (ver `HANDOFF-NOVA-CONTA.md`).

## Resultado esperado
App nativo **visualmente idêntico ao PWA** (Geist, flat, `shadow-sm`, `rounded-xl`,
dark mode, banner sólido na cor da rede, bottom nav com indicador deslizante),
**sem telas novas** e **sem mexer na lógica offline/dados**.
