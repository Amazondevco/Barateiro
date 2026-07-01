-- ============================================================
-- Pastas PESSOAIS de checklists (por usuário do app). Cada operador organiza
-- a própria visão: cria pastas (nome livre) e coloca checklists dentro.
-- Um checklist fica em no máximo UMA pasta por usuário. Escopo por rede.
-- ============================================================

create table if not exists pastas (
  id            uuid primary key default gen_random_uuid(),
  rede_id       uuid not null references redes(id) on delete cascade,
  identidade_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome          text not null,
  ordem         int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists pastas_dono_idx on pastas (identidade_id, rede_id);

create table if not exists pasta_formularios (
  pasta_id      uuid not null references pastas(id) on delete cascade,
  formulario_id uuid not null references formularios(id) on delete cascade,
  identidade_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (pasta_id, formulario_id)
);
-- Um checklist em no máximo uma pasta por usuário.
create unique index if not exists pasta_form_um_por_user
  on pasta_formularios (identidade_id, formulario_id);
create index if not exists pasta_form_pasta_idx on pasta_formularios (pasta_id);

alter table pastas enable row level security;
alter table pasta_formularios enable row level security;

-- Cada um gerencia só as próprias pastas e vínculos.
drop policy if exists pastas_dono on pastas;
create policy pastas_dono on pastas for all
  using (identidade_id = auth.uid())
  with check (identidade_id = auth.uid());

drop policy if exists pasta_form_dono on pasta_formularios;
create policy pasta_form_dono on pasta_formularios for all
  using (identidade_id = auth.uid())
  with check (identidade_id = auth.uid());
