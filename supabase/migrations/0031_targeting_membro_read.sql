-- Membro ativo lê o targeting (unidades/departamentos) dos formulários da sua
-- rede, para o app segmentar quais formulários mostrar.
drop policy if exists funi_membro_read on formulario_unidades;
create policy funi_membro_read on formulario_unidades for select using (
  exists (
    select 1 from formularios f
    join rede_membros m on m.rede_id = f.rede_id
    where f.id = formulario_unidades.formulario_id
      and m.identidade_id = auth.uid() and m.status = 'ativo'
  )
);

drop policy if exists fd_membro_read on formulario_departamentos;
create policy fd_membro_read on formulario_departamentos for select using (
  exists (
    select 1 from formularios f
    join rede_membros m on m.rede_id = f.rede_id
    where f.id = formulario_departamentos.formulario_id
      and m.identidade_id = auth.uid() and m.status = 'ativo'
  )
);
