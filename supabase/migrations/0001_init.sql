-- ============================================================
-- Super Barateiro — Schema inicial (multi-tenant + RLS)
-- Módulo Operacional (V1). Fundação compartilhada para módulos futuros.
-- ============================================================

-- ---------- Enums ----------
create type papel as enum ('super_admin', 'admin_supermercado', 'gerente');
create type unidade_tipo as enum ('loja', 'cd', 'escritorio', 'outro');
create type depto_escopo as enum ('rede', 'unidade');
create type entidade_status as enum ('ativo', 'inativo');
create type item_tipo as enum ('ok_nao', 'sim_nao', 'abastecido_ruptura');
create type resposta_status as enum ('no_prazo', 'fora_prazo');

-- ============================================================
-- REDE (tenant / cliente)
-- ============================================================
create table redes (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  cnpj          text,
  logo_url      text,
  cor_primaria  text default '#2563eb',
  plano         text default 'free',
  modulos       text[] not null default array['operacional'],
  status        entidade_status not null default 'ativo',
  contato_nome  text,
  contato_email text,
  contato_fone  text,
  -- regras operacionais (configuráveis por rede)
  horario_limite      time not null default '10:00',
  dias_frequencia     int[] not null default array[1,3,5,6], -- ISO: 1=Seg ... 7=Dom
  janela_edicao_min   int not null default 30,
  retencao_fotos_dias int not null default 60,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- UNIDADE (loja / CD / escritório)
-- ============================================================
create table unidades (
  id          uuid primary key default gen_random_uuid(),
  rede_id     uuid not null references redes(id) on delete cascade,
  nome        text not null,
  codigo      text,
  tipo        unidade_tipo not null default 'loja',
  endereco    text,
  cidade      text,
  uf          char(2),
  geo_lat     double precision,
  geo_lng     double precision,
  geo_raio_m  int default 200, -- raio de tolerância p/ checagem de presença
  status      entidade_status not null default 'ativo',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on unidades (rede_id);

-- ============================================================
-- DEPARTAMENTO (escopo rede ou unidade)
-- ============================================================
create table departamentos (
  id          uuid primary key default gen_random_uuid(),
  rede_id     uuid not null references redes(id) on delete cascade,
  nome        text not null,
  escopo      depto_escopo not null default 'unidade',
  unidade_id  uuid references unidades(id) on delete cascade,
  status      entidade_status not null default 'ativo',
  created_at  timestamptz not null default now(),
  -- escopo unidade exige unidade_id; escopo rede exige unidade_id nulo
  constraint depto_escopo_chk check (
    (escopo = 'unidade' and unidade_id is not null) or
    (escopo = 'rede' and unidade_id is null)
  )
);
create index on departamentos (rede_id);

-- ============================================================
-- PROFILES (usuários — espelha auth.users)
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  rede_id     uuid references redes(id) on delete cascade, -- null = super_admin
  nome        text not null default '',
  email       text not null,
  papel       papel not null default 'gerente',
  avatar_url  text,
  status      entidade_status not null default 'ativo',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on profiles (rede_id);

-- Vínculo N:N usuário ↔ unidades (gerente pode cuidar de várias)
create table usuario_unidades (
  user_id    uuid not null references profiles(id) on delete cascade,
  unidade_id uuid not null references unidades(id) on delete cascade,
  primary key (user_id, unidade_id)
);

-- ============================================================
-- FORMULÁRIOS (modelos de checklist)
-- ============================================================
create table formularios (
  id          uuid primary key default gen_random_uuid(),
  rede_id     uuid references redes(id) on delete cascade, -- null = template global
  nome        text not null,
  descricao   text,
  tipo_unidade unidade_tipo not null default 'loja',
  versao      int not null default 1,
  status      entidade_status not null default 'ativo',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on formularios (rede_id);

create table formulario_secoes (
  id            uuid primary key default gen_random_uuid(),
  formulario_id uuid not null references formularios(id) on delete cascade,
  titulo        text not null,
  ordem         int not null default 0,
  permite_na    boolean not null default true -- "N/A" para seção inaplicável
);
create index on formulario_secoes (formulario_id);

create table formulario_itens (
  id          uuid primary key default gen_random_uuid(),
  secao_id    uuid not null references formulario_secoes(id) on delete cascade,
  texto       text not null,
  ordem       int not null default 0,
  tipo        item_tipo not null default 'ok_nao',
  obriga_obs_quando_nao  boolean not null default true,
  obriga_foto_quando_nao boolean not null default true
);
create index on formulario_itens (secao_id);

-- ============================================================
-- RESPOSTAS (submissões do checklist)
-- ============================================================
create table respostas (
  id             uuid primary key default gen_random_uuid(),
  formulario_id  uuid not null references formularios(id),
  unidade_id     uuid not null references unidades(id) on delete cascade,
  usuario_id     uuid not null references profiles(id),
  rede_id        uuid not null references redes(id) on delete cascade,
  data_referencia date not null,
  status         resposta_status not null default 'no_prazo',
  geo_lat        double precision,
  geo_lng        double precision,
  presenca_ok    boolean,
  enviado_em     timestamptz not null default now(),
  editavel_ate   timestamptz,
  total_itens    int default 0,
  total_nao      int default 0,
  created_at     timestamptz not null default now()
);
create index on respostas (rede_id, unidade_id, data_referencia);

create table resposta_itens (
  id          uuid primary key default gen_random_uuid(),
  resposta_id uuid not null references respostas(id) on delete cascade,
  item_id     uuid not null references formulario_itens(id),
  valor       text not null, -- ok | nao | na | sim | abastecido | ruptura
  observacao  text,
  foto_url    text,
  foto_expira_em date,
  created_at  timestamptz not null default now()
);
create index on resposta_itens (resposta_id);

-- ============================================================
-- AUDITORIA (logs)
-- ============================================================
create table audit_logs (
  id         bigint generated always as identity primary key,
  rede_id    uuid references redes(id) on delete set null,
  usuario_id uuid references profiles(id) on delete set null,
  acao       text not null,          -- create | update | delete | login | ...
  entidade   text not null,          -- redes | unidades | ...
  entidade_id text,
  detalhe    jsonb,
  created_at timestamptz not null default now()
);
create index on audit_logs (rede_id, created_at);

-- ============================================================
-- updated_at automático
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_redes_updated      before update on redes      for each row execute function set_updated_at();
create trigger trg_unidades_updated   before update on unidades   for each row execute function set_updated_at();
create trigger trg_profiles_updated   before update on profiles   for each row execute function set_updated_at();
create trigger trg_formularios_updated before update on formularios for each row execute function set_updated_at();

-- ============================================================
-- Provisionamento de profile no signup (metadata → profiles)
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nome, papel, rede_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce((new.raw_user_meta_data->>'papel')::papel, 'gerente'),
    (new.raw_user_meta_data->>'rede_id')::uuid
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
