# Handoff — Check.AI (para uma nova sessão/agente)

> Documento de entrada. Leia este arquivo primeiro. Ele te dá o contexto, o estado
> atual e a **ordem das tarefas**. Os planos detalhados estão em `docs/`.

## O que é o Check.AI
Plataforma SaaS **multi-tenant** de gestão para redes de supermercado (checklists
operacionais). Dois produtos:
- **Painel web (Next.js 16 + Turbopack)** em `src/app/(dashboard)` — admin/super admin.
  Em produção no Vercel. **Funciona, não quebrar.**
- **App do operador** — versão **PWA** (`src/app/(app)`, web, pronta e bonita) e a
  versão **nativa** (`native-poc/`, Capacitor, em construção).
- Identidade visual normativa: **`DESIGN.md`** (raiz). Toda mudança de UI segue ele.

Stack: Next.js 16, Tailwind v4, Supabase (Postgres + Auth + RLS + Storage), Groq (IA
+ Whisper). Deploy do painel = push na `main` → Vercel.

## Estado atual
| Item | Status |
|---|---|
| Painel web | ✅ produção |
| PWA do operador | ✅ pronto e com visual bom (referência de UI) |
| App nativo `native-poc` (Capacitor) | ⏳ Fases 0–3 feitas (SPA + auth Supabase + SQLite/fila + shell android/ios). Abre e loga. |
| APK de teste | ✅ build automático via GitHub Actions (debug). Tela branca já corrigida. |
| Estética do nativo | ❌ diverge do PWA → **TAREFA 1** |

## ORDEM DAS TAREFAS
### TAREFA 1 (agora): re-skin estético do nativo → `docs/PLANO-ESTETICA-NATIVO.md`
Deixar o `native-poc` **visualmente idêntico ao PWA**, reusando o design system e o
markup das telas que já existem no web. **Só visual; não mexer na lógica de dados.**
Comece pela **Fase A** (Tailwind + tokens + Geist) — sem ela o resto não "pega".

### TAREFA 2 (depois): continuar a construção do app → `docs/PLANO-APP-NATIVO.md`
Plano geral em fases (já documentado). Resumo do que falta:
- **Fase 4 — Nativo:** **ícone + splash com a logo Check.AI verde** (decidida: check
  geométrico + brilho ✦, cor `#15803d`; gerar `logo.svg` + ícone 512 + favicon),
  **push** (FCM/APNs), biometria, deep links (deep link `checkai://` já existe).
- **Fase 5 — OTA (Capgo):** atualizar a camada web **sem reinstalar** (o usuário pediu
  muito isso). Hoje qualquer mudança exige novo APK.
- **Fase 6 — Lojas:** conta Apple Developer (US$ 99/ano) + Google Play (US$ 25),
  **chave de release** (keystore), políticas de privacidade, listagem. iOS só via
  TestFlight/App Store (não tem APK).
- **Paridade & glue:** garantir que revisão final, segmentação de formulários e fila
  offline do nativo batem com o PWA.

## Como testar o APK
1. GitHub → **Actions** → workflow **"Build APK Android (POC)"** → **Run workflow**.
2. Baixe o release: `https://github.com/Amazondevco/Barateiro/releases/download/apk-latest/app-debug.apk`
   (ou o artefato `check-ai-apk` da run). Reinstale no Android (fontes desconhecidas).
3. Secrets **já configurados** no repo: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   (a CI injeta no build — sem eles o app dá tela branca).

## Regras críticas (não repetir erros já cometidos)
1. **`npm run build` ANTES de todo push** — tanto no raiz (`/`) quanto em `native-poc`.
   O deploy do painel já quebrou 2× por erro de import não testado.
2. **`native-poc` está no `exclude` do `tsconfig.json` raiz** (é projeto Vite à parte).
   Não re-incluir.
3. **Trabalho em paralelo:** não editar o mesmo arquivo que outra sessão. Raias:
   - Painel/web = `src/app/**`, `src/components/**`.
   - App nativo = `native-poc/**` + `.github/workflows/android-apk.yml` +
     `src/app/(dashboard)/configuracoes/apk-installer-card.tsx`.
4. **Seguir `DESIGN.md`** em qualquer UI. Cores só por token; nunca hex de marca fixo.
5. Migrations aplicadas via conexão direta Postgres (não há MCP do Supabase para este
   projeto). Não commitar segredos.

## Fatos técnicos úteis
- Supabase ref: `vwmtimbztdvwwbtihhoa`. Capacitor `appId: ai.check.poc`.
- RLS: migration **0035** dá leitura de rede/unidades/depto/cargo para membros do app
  (o nativo lê direto via RLS, sem service role).
- `enviar_resposta(p_formulario uuid, p_itens jsonb, p_assinatura text, p_data date
  default current_date)` — `p_data` preserva a data de preenchimento offline (mig 0036).
- Relatórios/painel por formulário: tabela `relatorios` (mig 0037) + `src/lib/relatorios.ts`.
- Camada de dados do nativo: `native-poc/src/lib/operator-api.ts` (Supabase),
  `queue-store.ts` (SQLite outbox), `sync.ts` (upload foto + `enviar_resposta`),
  `storage.ts` (Preferences), `auth.ts` (Supabase PKCE). **Manter.**

## Segurança (pendências)
- APK atual é **debug-signed** (chave de teste) → aviso "desenvolvedor desconhecido" é
  normal em sideload. Para produção: gerar **keystore de release** (guardar fora do
  git) e publicar pela loja.
- A **senha do banco** do Supabase foi exposta em texto numa sessão anterior →
  **rotacionar** no painel do Supabase.
