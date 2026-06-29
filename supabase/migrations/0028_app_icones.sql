-- ============================================================
-- Ícones PWA persistidos. O acesso é um FILTRO (cargos/unidades/departamentos):
-- a pessoa vê o ícone se seu cargo/unidade/depto casar (vazio = todos).
-- ============================================================
create table if not exists app_icones (
  id            uuid primary key default gen_random_uuid(),
  rede_id       uuid not null references redes(id) on delete cascade,
  nome          text not null,
  nome_curto    text not null,
  cor           text not null default '#F97316',
  cargos        uuid[] not null default '{}',
  unidades      uuid[] not null default '{}',
  departamentos uuid[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_app_icones_rede on app_icones(rede_id);

drop trigger if exists trg_app_icones_updated on app_icones;
create trigger trg_app_icones_updated before update on app_icones
  for each row execute function set_updated_at();

alter table app_icones enable row level security;

drop policy if exists icones_admin_all on app_icones;
create policy icones_admin_all on app_icones for all
  using (is_admin_da_rede(rede_id)) with check (is_admin_da_rede(rede_id));

-- membros ativos leem os ícones da sua rede (para o app saber o que mostrar)
drop policy if exists icones_membro_read on app_icones;
create policy icones_membro_read on app_icones for select using (
  exists (
    select 1 from rede_membros m
    where m.identidade_id = auth.uid() and m.rede_id = app_icones.rede_id and m.status = 'ativo'
  )
);
