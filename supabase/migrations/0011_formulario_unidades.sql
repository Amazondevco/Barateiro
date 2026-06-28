-- Atribuição de formulários a unidades específicas (vazio = todas as unidades do tipo)
create table if not exists formulario_unidades (
  formulario_id uuid not null references formularios(id) on delete cascade,
  unidade_id    uuid not null references unidades(id) on delete cascade,
  primary key (formulario_id, unidade_id)
);
alter table formulario_unidades enable row level security;

drop policy if exists funi_super on formulario_unidades;
create policy funi_super on formulario_unidades for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists funi_admin on formulario_unidades;
create policy funi_admin on formulario_unidades for all
  using (is_admin() and exists (select 1 from formularios f where f.id = formulario_id and f.rede_id = auth_rede_id()))
  with check (is_admin() and exists (select 1 from formularios f where f.id = formulario_id and f.rede_id = auth_rede_id()));

drop policy if exists funi_read on formulario_unidades;
create policy funi_read on formulario_unidades for select
  using (exists (select 1 from formularios f where f.id = formulario_id and (f.rede_id = auth_rede_id() or f.rede_id is null)));
