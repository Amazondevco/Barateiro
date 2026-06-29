-- ============================================================
-- Identidade multi-tenant do APP (usuário final / PWA)
-- Modelo de dois níveis:
--   identidades  = conta global ("Amazon Dev"), 1 por pessoa (CPF)
--   rede_membros = vínculo N:N (pessoa ↔ rede), com cargo/unidade/depto
--   convites     = link do ícone para auto-join numa rede
-- Aditivo: NÃO altera profiles nem as RLS do dashboard.
-- Super admin é MURADO de rede_membros/convites (não referenciado nas policies).
-- ============================================================

-- ---------- Enums ----------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'membro_status') then
    create type membro_status as enum ('pendente','ativo','inativo','recusado');
  end if;
  if not exists (select 1 from pg_type where typname = 'membro_origem') then
    create type membro_origem as enum ('link_icone','aprovacao','pre_cadastro','super');
  end if;
end $$;

-- ---------- Helper: admin de uma rede específica ----------
create or replace function is_admin_da_rede(p_rede uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and papel = 'admin_supermercado' and rede_id = p_rede
  )
$$;

-- ============================================================
-- TABELAS
-- ============================================================

-- IDENTIDADES (conta global — dono: plataforma/Amazon Dev)
create table if not exists identidades (
  id                 uuid primary key references auth.users(id) on delete cascade,
  nome               text not null,
  cpf                text unique,            -- validado/obrigatório na aplicação
  email              text unique not null,
  celular            text,
  foto_url           text,                   -- obrigatória na aplicação (antes de ativar)
  cep                text,
  uf                 text,
  cidade             text,
  bairro             text,
  logradouro         text,
  numero             text,
  complemento        text,
  termo_aceite_em    timestamptz,
  termo_versao       text,
  email_confirmado_em timestamptz,
  status             entidade_status not null default 'ativo',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- REDE_MEMBROS (vínculo N:N — dono: rede; super_admin MURADO)
create table if not exists rede_membros (
  id              uuid primary key default gen_random_uuid(),
  identidade_id   uuid not null references identidades(id) on delete cascade,
  rede_id         uuid not null references redes(id) on delete cascade,
  papel           papel not null default 'gerente',
  unidade_id      uuid references unidades(id) on delete set null,
  departamento_id uuid references departamentos(id) on delete set null,
  matricula       text,
  icone_id        uuid,                       -- FK futura quando app_icones existir
  origem          membro_origem not null default 'aprovacao',
  status          membro_status not null default 'pendente',
  aprovado_por    uuid references auth.users(id) on delete set null,
  aprovado_em     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (identidade_id, rede_id)
);

create index if not exists idx_rede_membros_rede on rede_membros(rede_id);
create index if not exists idx_rede_membros_identidade on rede_membros(identidade_id);

-- CONVITES (link do ícone p/ entrar numa rede — dono: rede)
create table if not exists convites (
  id              uuid primary key default gen_random_uuid(),
  rede_id         uuid not null references redes(id) on delete cascade,
  icone_id        uuid,
  token           text unique not null,
  papel_default   papel not null default 'gerente',
  unidade_default uuid references unidades(id) on delete set null,
  exige_aprovacao boolean not null default false,
  validade        timestamptz,
  criado_por      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_convites_rede on convites(rede_id);

-- ---------- Triggers updated_at ----------
drop trigger if exists trg_identidades_updated on identidades;
create trigger trg_identidades_updated before update on identidades
  for each row execute function set_updated_at();

drop trigger if exists trg_rede_membros_updated on rede_membros;
create trigger trg_rede_membros_updated before update on rede_membros
  for each row execute function set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table identidades enable row level security;
alter table rede_membros enable row level security;
alter table convites enable row level security;

-- IDENTIDADES: self vê/edita; super_admin (Amazon Dev) vê;
-- admin da rede vê identidade de quem é membro da sua rede.
drop policy if exists identidades_select on identidades;
create policy identidades_select on identidades for select using (
  id = auth.uid()
  or is_super_admin()
  or exists (
    select 1 from rede_membros m
    where m.identidade_id = identidades.id and is_admin_da_rede(m.rede_id)
  )
);
drop policy if exists identidades_insert on identidades;
create policy identidades_insert on identidades for insert with check (id = auth.uid());
drop policy if exists identidades_update on identidades;
create policy identidades_update on identidades for update using (id = auth.uid());

-- REDE_MEMBROS: a pessoa vê seus vínculos; admin da rede gerencia os da rede.
-- super_admin NÃO é referenciado → murado.
drop policy if exists rede_membros_select on rede_membros;
create policy rede_membros_select on rede_membros for select using (
  identidade_id = auth.uid() or is_admin_da_rede(rede_id)
);
drop policy if exists rede_membros_insert on rede_membros;
create policy rede_membros_insert on rede_membros for insert with check (
  is_admin_da_rede(rede_id)   -- self-join entra por função SECURITY DEFINER (fase 3)
);
drop policy if exists rede_membros_update on rede_membros;
create policy rede_membros_update on rede_membros for update using (
  is_admin_da_rede(rede_id)
);
drop policy if exists rede_membros_delete on rede_membros;
create policy rede_membros_delete on rede_membros for delete using (
  is_admin_da_rede(rede_id)
);

-- CONVITES: só o admin da rede gerencia (leitura por token p/ join vai por função na fase 3).
drop policy if exists convites_all on convites;
create policy convites_all on convites for all using (
  is_admin_da_rede(rede_id)
) with check (
  is_admin_da_rede(rede_id)
);
