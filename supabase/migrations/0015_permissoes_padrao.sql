-- ============================================================
-- Permissões padrão dos cargos de sistema (editável pelo Super Admin)
-- Toda rede nova nasce com estes conjuntos. Redes existentes não mudam.
-- ============================================================
alter table plataforma
  add column if not exists default_perms_admin text[] not null default array[
    'dashboard.ver','unidades.gerenciar','departamentos.gerenciar','usuarios.gerenciar',
    'formularios.gerenciar','formularios.respostas.ver','relatorios.ver','auditoria.ver',
    'configuracoes.gerenciar','aparencia.gerenciar','checklist.preencher'],
  add column if not exists default_perms_gerente text[] not null default array[
    'dashboard.ver','checklist.preencher','formularios.respostas.ver','relatorios.ver'],
  add column if not exists default_perms_colaborador text[] not null default array[
    'checklist.preencher'];

-- seed_cargos passa a ler os padrões da plataforma (com fallback)
create or replace function seed_cargos(p_rede uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  pa text[];
  pg text[];
  pc text[];
begin
  select default_perms_admin, default_perms_gerente, default_perms_colaborador
    into pa, pg, pc from plataforma where id = true;

  insert into cargos (rede_id, nome, slug, descricao, sistema, permissoes) values
    (p_rede, 'Admin', 'admin', 'Acesso total à rede', true,
      coalesce(pa, array[
        'dashboard.ver','unidades.gerenciar','departamentos.gerenciar','usuarios.gerenciar',
        'formularios.gerenciar','formularios.respostas.ver','relatorios.ver','auditoria.ver',
        'configuracoes.gerenciar','aparencia.gerenciar','checklist.preencher'])),
    (p_rede, 'Gerente', 'gerente', 'Gerencia a operação da loja', true,
      coalesce(pg, array[
        'dashboard.ver','checklist.preencher','formularios.respostas.ver','relatorios.ver'])),
    (p_rede, 'Colaborador', 'colaborador', 'Preenche checklists', true,
      coalesce(pc, array['checklist.preencher']))
  on conflict (rede_id, slug) do nothing;
end $$;
