# Plano de execução — App nativo Check.AI (Capacitor, offline-first)

> **Status:** planejamento aprovado. Nada implementado ainda.
> Documento-contrato para as próximas etapas (e para outras IAs seguirem).
> Identidade visual: seguir sempre o `DESIGN.md`.

## Decisões travadas
| Tema | Decisão |
|---|---|
| Embalagem | **Capacitor** (iOS + Android, conteúdo embutido) |
| App do operador | **Reescrito como SPA cliente-Supabase** (offline-first) |
| Dados offline | **SQLite** (no device) |
| Atualização | **OTA** (atualizar a camada web sem reinstalar) |
| Contas das lojas | **Amazon Dev & Co.** (Apple + Google) |
| Ícone do launcher | **Check.AI genérico** (rede vive dentro do app) |
| Dashboard admin | **Continua web (Next.js no Vercel)** — não vira app |

## Princípio central
O **shell do app (telas/lógica/design) fica embutido** no APK/IPA → abre e funciona
offline desde a instalação. Os **dados do usuário** (rede, formulários) são baixados
**uma vez** no primeiro login online e ficam em **SQLite**. Depois: tudo offline;
envios entram numa **fila** que sincroniza quando há conexão.

Únicos momentos que exigem internet (uma vez, no setup):
1. **Primeiro login** (autenticar a senha). Depois o app fica logado e abre offline.
2. **Baixar os formulários** do usuário (não dá pra mostrar o que nunca foi baixado).

---

## Arquitetura alvo

```
┌─────────────────────────────┐        ┌──────────────────────────┐
│  APP DO OPERADOR (nativo)   │        │  DASHBOARD ADMIN (web)   │
│  Capacitor + SPA (Vite/React)│       │  Next.js SSR @ Vercel    │
│  - UI offline embutida       │        │  - sem mudança           │
│  - SQLite (dados + fila)     │        └─────────────┬────────────┘
│  - Câmera/Push/SecureStorage │                      │
└──────────────┬──────────────┘                      │
               │   Supabase JS (auth PKCE, RLS, RPC, Storage)
               └──────────────┬───────────────────────┘
                              ▼
                        ┌───────────┐
                        │ SUPABASE  │  (mesmo banco/RLS de hoje)
                        └───────────┘
```

- O operador deixa de usar SSR/cookies e passa a falar **direto com o Supabase**.
- A **migration 0035** (já aplicada) liberou a RLS para membros lerem
  rede/unidades/departamentos/cargos → **acesso direto do cliente já viável**.
- Reaproveita componentes React e tokens (`globals.css`/DESIGN.md) atuais.

---

## Fases

### Fase 0 — POC de risco (1 spike)
Provar o caminho num device real antes de migrar tudo:
- App Capacitor mínimo + 1 tela + **SQLite** gravando/lendo offline.
- Login Supabase (PKCE) com sessão persistida em **SecureStorage**.
- 1 formulário preenchido **offline** entra na fila e **sincroniza** ao reconectar.
- **Critério de sucesso:** abrir em modo avião, preencher, reconectar, ver no banco.

### Fase 1 — SPA do operador (maior esforço)
Migrar o app (hoje `src/app/(app)/...`) para um **SPA cliente** (Vite + React):
- **Auth:** trocar cookie/SSR por `supabase.auth.signInWithPassword` (**PKCE**),
  sessão num **storage adapter** sobre Capacitor Preferences/SecureStorage.
- **Branding:** ler `redes` (logo/cor) **direto via RLS** (sai o service-role de
  `rede-branding.ts`).
- **Telas a portar:** Login · Início (forms board + banner) · Preencher formulário
  (etapas + revisão + assinatura + fotos) · Adotar assinatura · Avisos · Enviados
  (+ pendentes) · Detalhe da resposta · Perfil · Config.
- **Roteamento:** client-side (React Router) — sem servidor em runtime.
- **Build:** estático, pronto pra embutir no Capacitor.
- **Reuso:** componentes e padrões atuais já são React → portam com ajuste de
  data-fetching (server→Supabase client).

### Fase 2 — Camada de dados offline (SQLite)
- **Plugin:** `@capacitor-community/sqlite`.
- **Schema local:** `membro`, `rede`, `unidades`, `formularios`, `secoes`, `itens`,
  `targeting`, `outbox` (envios), `fotos` (arquivos via Filesystem).
- **Seed (pull) no login online:** baixar o "pacote do app" do usuário.
  - *Otimização:* criar RPC **`meu_app_bundle()`** no Supabase devolvendo tudo numa
    chamada (membro + rede + formulários + seções/itens + targeting + assinatura).
- **Leitura offline:** telas leem do SQLite.
- **Fila (push):** porta a lógica de `offline-db.ts`/`offline-sync.ts` (já feita)
  para SQLite; envia fotos + `enviar_resposta` (com `p_data`, já no banco).

### Fase 3 — Shell Capacitor
- `npm i @capacitor/core @capacitor/cli` + `npx cap init`.
- Plugins: **Camera**, **Filesystem**, **Preferences**, **SQLite**, **Network**,
  **Splash Screen**, **Status Bar**, **App** (deep links), **Push Notifications**.
- Apontar `webDir` para o build estático da Fase 1; testar offline real (iOS+Android).

### Fase 4 — Recursos nativos / polish
- **Push:** FCM (Android) + APNs (iOS) → avisos/sugestões.
- **Biometria** (login rápido, opcional).
- **Splash + ícone** Check.AI genérico; **deep links** (`checkai://` / universal links).
- Status de rede → tarja offline/sync (já temos o componente).

### Fase 5 — OTA (atualizar sem reinstalar)
- **Capgo** (`@capgo/capacitor-updater`) — open/affordable — ou Ionic Appflow.
- Pipeline: build web → publica canal OTA → apps baixam o novo bundle.
- **Limite Apple:** OTA só atualiza a camada **web/JS**; mudança nativa = nova versão
  na loja. (90% das mudanças são OTA.)

### Fase 6 — Publicação nas lojas
- **Contas:** Apple Developer (US$ 99/ano) + Google Play (US$ 25 única) — Amazon Dev & Co.
- **Builds assinados:** keystore Android; certificados/provisioning iOS.
- **Conformidade:** política de privacidade, formulários de privacidade/Data Safety,
  prints, descrição, classificação etária, certificados de push.
- **Apple 4.2:** passa por ter offline real + câmera + push (não é "só um site").
- **Revisão:** Apple ~1–3 dias; Google ~horas–2 dias.

---

## Decisões técnicas-chave
- **Sessão offline:** guardar tokens em SecureStorage; abrir offline enquanto válido;
  refresh quando reconectar. Definir tempo até exigir novo login.
- **Estratégia de sync:** *pull* no login/abertura online (atualiza formulários);
  *push* da fila contínuo (online/reconnect). Sem edição concorrente do mesmo
  registro → conflito é mínimo (cada envio é novo).
- **Fotos:** salvar arquivo local (Filesystem) + referência na `outbox`; subir no sync;
  comprimir (já temos `comprimirFoto`).
- **RLS:** o app passa a depender 100% da RLS (sem service-role no cliente). Revisar:
  `redes`/`unidades`/`departamentos`/`cargos` (0035 ok), `formularios`/`secoes`/
  `itens`/targeting (policies de membro ok), Storage `respostas-fotos` (upload
  autenticado ok), `enviar_resposta` (grant ok, com `p_data`).

## Mudanças no Supabase (previstas)
- **Nova RPC `meu_app_bundle()`** (otimiza o seed offline) — *opcional mas recomendado*.
- Conferir **URLs de redirect/PKCE** para mobile no Auth.
- Nenhuma mudança de schema obrigatória além disso.

## O que NÃO muda
- **Dashboard admin** (web/Next/Vercel).
- **Banco/RLS** (além da RPC opcional).
- **Design system** (`DESIGN.md`) — vale para o app nativo também.
- **PWA atual** pode continuar no ar em paralelo (decisão aberta).

## Riscos e mitigações
| Risco | Mitigação |
|---|---|
| Refactor SSR→SPA é o maior item | Fase 0 (POC) de-risca; portar tela a tela |
| RLS incompleta quebra leitura offline | Auditar policies na Fase 1 |
| iOS (certificados/revisão/conta) | Começar conta Apple cedo; checklist 4.2 |
| Token expira offline por muito tempo | Definir política de validade + re-login |
| Manutenção dupla (web + app) | Compartilhar tokens/design; lógica no Supabase |

## Esforço relativo
`Fase 1 (SPA)` ≫ `Fase 2 (SQLite)` > `Fase 6 (lojas)` > `Fase 3/4/5`.
A maior parte do produto (offline, fila, assinatura, fotos, etapas, revisão) **já
existe** — o trabalho é **reempacotar** como SPA nativo.

## Próximo passo
Executar a **Fase 0 (POC)** num device real. Só inicio quando você autorizar a
execução — este documento é apenas o plano.
