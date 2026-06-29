-- Painel de relatórios por formulário. Cada relatório é um "tipo" (kind) com
-- parâmetros (spec jsonb) que o app calcula a partir das respostas reais.
create table if not exists relatorios (
  id           uuid primary key default gen_random_uuid(),
  formulario_id uuid not null references formularios(id) on delete cascade,
  rede_id      uuid not null references redes(id) on delete cascade,
  titulo       text not null,
  kind         text not null,           -- conformidade | nao_por_pergunta | evolucao | por_unidade | volume
  spec         jsonb not null default '{}'::jsonb,
  ordem        int not null default 0,
  origem       text not null default 'ia',  -- ia | manual
  created_at   timestamptz not null default now()
);

create index if not exists relatorios_form_idx on relatorios(formulario_id, ordem);

alter table relatorios enable row level security;

-- Mesmo escopo dos formulários: super vê tudo; admin vê a própria rede.
drop policy if exists relatorios_super on relatorios;
create policy relatorios_super on relatorios for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists relatorios_admin on relatorios;
create policy relatorios_admin on relatorios for all
  using (is_admin() and rede_id = auth_rede_id())
  with check (is_admin() and rede_id = auth_rede_id());
