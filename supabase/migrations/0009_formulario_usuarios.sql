-- Atribuição de formulários a usuários específicos (vazio = todos do departamento)
create table if not exists formulario_usuarios (
  formulario_id uuid not null references formularios(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  primary key (formulario_id, user_id)
);
alter table formulario_usuarios enable row level security;

drop policy if exists fu_super on formulario_usuarios;
create policy fu_super on formulario_usuarios for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists fu_admin on formulario_usuarios;
create policy fu_admin on formulario_usuarios for all
  using (is_admin() and exists (select 1 from formularios f where f.id = formulario_id and f.rede_id = auth_rede_id()))
  with check (is_admin() and exists (select 1 from formularios f where f.id = formulario_id and f.rede_id = auth_rede_id()));

drop policy if exists fu_read on formulario_usuarios;
create policy fu_read on formulario_usuarios for select
  using (exists (select 1 from formularios f where f.id = formulario_id and (f.rede_id = auth_rede_id() or f.rede_id is null)));
