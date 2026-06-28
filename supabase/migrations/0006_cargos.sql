-- ============================================================
-- Cargos e permissões por rede
-- 3 cargos de sistema (Admin, Gerente, Colaborador) — imutáveis.
-- Admin pode criar cargos personalizados.
-- ============================================================
create table if not exists cargos (
  id          uuid primary key default gen_random_uuid(),
  rede_id     uuid not null references redes(id) on delete cascade,
  nome        text not null,
  slug        text not null,
  descricao   text,
  sistema     boolean not null default false,
  permissoes  text[] not null default '{}',
  created_at  timestamptz not null default now(),
  unique (rede_id, slug)
);
create index if not exists cargos_rede_idx on cargos(rede_id);

alter table cargos enable row level security;

drop policy if exists cargos_super on cargos;
create policy cargos_super on cargos for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists cargos_admin on cargos;
create policy cargos_admin on cargos for all
  using (is_admin() and rede_id = auth_rede_id())
  with check (is_admin() and rede_id = auth_rede_id());

drop policy if exists cargos_read on cargos;
create policy cargos_read on cargos for select
  using (rede_id = auth_rede_id());

-- Permissões padrão dos cargos de sistema
create or replace function seed_cargos(p_rede uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into cargos (rede_id, nome, slug, descricao, sistema, permissoes) values
    (p_rede, 'Admin', 'admin', 'Acesso total à rede', true, array[
      'dashboard.ver','unidades.gerenciar','departamentos.gerenciar','usuarios.gerenciar',
      'formularios.gerenciar','formularios.respostas.ver','relatorios.ver','auditoria.ver',
      'configuracoes.gerenciar','aparencia.gerenciar','checklist.preencher']),
    (p_rede, 'Gerente', 'gerente', 'Gerencia a operação da loja', true, array[
      'dashboard.ver','checklist.preencher','formularios.respostas.ver','relatorios.ver']),
    (p_rede, 'Colaborador', 'colaborador', 'Preenche checklists', true, array[
      'checklist.preencher'])
  on conflict (rede_id, slug) do nothing;
end $$;

-- Trigger: ao criar rede, semeia os cargos fixos
create or replace function on_rede_seed_cargos()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform seed_cargos(new.id);
  return new;
end $$;

drop trigger if exists trg_rede_seed_cargos on redes;
create trigger trg_rede_seed_cargos after insert on redes
  for each row execute function on_rede_seed_cargos();

-- Semeia redes já existentes
do $$
declare r record;
begin
  for r in select id from redes loop
    perform seed_cargos(r.id);
  end loop;
end $$;
