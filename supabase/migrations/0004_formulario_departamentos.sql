-- ============================================================
-- Atribuição de formulários a departamentos (N:N)
-- ============================================================
create table if not exists formulario_departamentos (
  formulario_id   uuid not null references formularios(id) on delete cascade,
  departamento_id uuid not null references departamentos(id) on delete cascade,
  primary key (formulario_id, departamento_id)
);

alter table formulario_departamentos enable row level security;

drop policy if exists fd_super on formulario_departamentos;
create policy fd_super on formulario_departamentos for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists fd_admin on formulario_departamentos;
create policy fd_admin on formulario_departamentos for all
  using (is_admin() and exists (
    select 1 from formularios f
    where f.id = formulario_id and f.rede_id = auth_rede_id()))
  with check (is_admin() and exists (
    select 1 from formularios f
    where f.id = formulario_id and f.rede_id = auth_rede_id()));

drop policy if exists fd_read on formulario_departamentos;
create policy fd_read on formulario_departamentos for select
  using (exists (
    select 1 from formularios f
    where f.id = formulario_id
      and (f.rede_id = auth_rede_id() or f.rede_id is null)));
