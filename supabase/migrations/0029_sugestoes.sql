-- ============================================================
-- Sugestões com escalonamento:
--   app user → rede (destino='rede', admin da rede lê)
--   admin da rede → plataforma (destino='plataforma', super admin lê)
-- Super admin vê SÓ as escaladas (não as internas de cada rede).
-- ============================================================
create table if not exists sugestoes (
  id          uuid primary key default gen_random_uuid(),
  autor_id    uuid not null references auth.users(id) on delete cascade,
  autor_nome  text not null,
  rede_id     uuid not null references redes(id) on delete cascade,
  destino     text not null check (destino in ('rede','plataforma')),
  texto       text not null default '',
  audio_url   text,
  status      text not null default 'nova' check (status in ('nova','resolvida')),
  criado_em   timestamptz not null default now()
);

create index if not exists idx_sugestoes_rede on sugestoes(rede_id);
create index if not exists idx_sugestoes_destino on sugestoes(destino, criado_em desc);

alter table sugestoes enable row level security;

-- INSERT: app user manda pra rede onde é membro ativo; admin escala pra plataforma.
drop policy if exists sugestoes_insert on sugestoes;
create policy sugestoes_insert on sugestoes for insert with check (
  autor_id = auth.uid()
  and (
    (destino = 'rede' and exists (
      select 1 from rede_membros m
      where m.identidade_id = auth.uid() and m.rede_id = sugestoes.rede_id and m.status = 'ativo'
    ))
    or (destino = 'plataforma' and is_admin_da_rede(rede_id))
  )
);

-- SELECT: o próprio autor; admin vê as 'rede' da sua rede; super admin vê as 'plataforma'.
drop policy if exists sugestoes_select on sugestoes;
create policy sugestoes_select on sugestoes for select using (
  autor_id = auth.uid()
  or (destino = 'rede' and is_admin_da_rede(rede_id))
  or (destino = 'plataforma' and is_super_admin())
);

-- UPDATE (status): admin resolve as da sua rede; super admin resolve as escaladas.
drop policy if exists sugestoes_update on sugestoes;
create policy sugestoes_update on sugestoes for update using (
  (destino = 'rede' and is_admin_da_rede(rede_id))
  or (destino = 'plataforma' and is_super_admin())
);

-- ---------- Bucket de áudio (privado; leitura por URL assinada no servidor) ----------
insert into storage.buckets (id, name, public)
values ('sugestoes', 'sugestoes', false)
on conflict (id) do nothing;

drop policy if exists sugestoes_audio_insert on storage.objects;
create policy sugestoes_audio_insert on storage.objects
  for insert with check (bucket_id = 'sugestoes' and auth.uid() is not null);
