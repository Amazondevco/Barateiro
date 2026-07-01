-- Convite/definição de senha SEM expiração por tempo.
-- Antes o link dependia do token OTP do Supabase (expira em ~1h). Agora usamos
-- um token próprio, guardado no profile, que só deixa de valer quando:
--   (a) o usuário conclui o cadastro  → convite_usado_em preenchido; ou
--   (b) o admin gera outro link       → convite_token é sobrescrito.
alter table profiles add column if not exists convite_token text;
alter table profiles add column if not exists convite_usado_em timestamptz;

-- Busca rápida por token (e garante unicidade dos tokens ativos).
create unique index if not exists profiles_convite_token_key
  on profiles (convite_token)
  where convite_token is not null;
