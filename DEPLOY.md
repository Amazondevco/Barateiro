# Deploy na Vercel — checklist

Objetivo: subir o app em HTTPS para o Barateiro testar. O banco (Supabase) já é
o mesmo de hoje — as migrações 0001–0028 já estão aplicadas no projeto remoto,
então **não precisa migrar nada de novo**.

## 1. Código no GitHub
- [ ] Criar repositório (privado) e dar push da branch `main`.
- [ ] Garantir que `.env.local` está no `.gitignore` (segredos NÃO vão pro git).

## 2. Importar na Vercel
- [ ] Vercel → New Project → importar o repositório.
- [ ] Framework: Next.js (detecta sozinho). Build: `next build` (padrão).

## 3. Variáveis de ambiente (Vercel → Settings → Environment Variables)
Copiar de `.env.local`:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`  (server-only)
- [ ] `GROQ_API_KEY`  (server-only — IA dos formulários)

## 4. Supabase Auth (Dashboard → Authentication → URL Configuration)
- [ ] **Site URL**: trocar `http://localhost:3000` pela URL de produção da Vercel.
- [ ] **Redirect URLs**: adicionar `https://SEU-DOMINIO.vercel.app/**`
      (o `emailRedirectTo` usa `location.origin`, então pega o domínio sozinho).

## 5. E-mail de confirmação
- [ ] O e-mail nativo do Supabase tem limite baixo (~3–4/h) — ok para teste.
- [ ] Para produção de verdade: configurar **SMTP próprio** (Auth → SMTP Settings)
      ou usar Resend/SendGrid, senão cadastros em massa não recebem o e-mail.

## 6. PWA (instalar na tela inicial)
- [ ] HTTPS da Vercel já habilita instalação.
- [ ] O service worker está **desligado** hoje (era de teste e dava cache velho).
      Reativar um SW de produção depois, de forma controlada (fase offline).
- [ ] `manifest.webmanifest` já funciona (instalável no Android/Chrome).

## 7. Pós-deploy — fumaça
- [ ] Abrir a URL → login do dashboard funciona.
- [ ] Cadastro no app (`/cadastro`) → recebe e-mail → confirma → cai em `/app`.
- [ ] Admin: Configurações → Equipe do app → importa CPF.
- [ ] Pessoa entra na rede → assina → preenche e envia um formulário.

## Notas
- Mesmo projeto Supabase para dev e prod (por enquanto). Se quiser separar
  ambientes depois, criar um projeto Supabase de produção e repetir migrações.
- Tokens (`ghp_…`, `sbp_…`) usados no desenvolvimento devem ser **rotacionados**
  depois — foram colados em chat.
