-- ============================================================
-- device_tokens — tokens FCM/APNs por aparelho, para push.
-- O app registra o token do usuário logado; o painel resolve os
-- tokens do alvo de um comunicado e dispara via FCM HTTP v1.
-- ============================================================

create table if not exists device_tokens (
  token         text primary key,
  identidade_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  platform      text not null default 'android' check (platform in ('android','ios','web')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists device_tokens_identidade_idx
  on device_tokens (identidade_id);

alter table device_tokens enable row level security;

-- O dono gerencia os próprios tokens (insert/select/update/delete).
drop policy if exists device_tokens_owner on device_tokens;
create policy device_tokens_owner on device_tokens for all
  using (identidade_id = auth.uid())
  with check (identidade_id = auth.uid());

-- Mantém updated_at no upsert (o app faz upsert on conflict (token)).
create or replace function device_tokens_touch() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists device_tokens_touch_trg on device_tokens;
create trigger device_tokens_touch_trg before update on device_tokens
  for each row execute function device_tokens_touch();
