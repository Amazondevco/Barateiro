-- Membros do app (identidades+rede_membros, sem `profiles`) precisam ler a
-- marca/identidade da própria rede e seu vínculo. auth_rede_id() sai de
-- profiles, então estas tabelas ficavam invisíveis para eles.
-- (O app já funciona via service role; estas policies deixam o modelo correto.)

-- REDES: membro ativo lê a própria rede
drop policy if exists redes_membro_read on redes;
create policy redes_membro_read on redes for select using (
  exists (
    select 1 from rede_membros m
    where m.rede_id = redes.id
      and m.identidade_id = auth.uid()
      and m.status = 'ativo'
  )
);

-- UNIDADES: membro ativo lê unidades da própria rede
drop policy if exists unidades_membro_read on unidades;
create policy unidades_membro_read on unidades for select using (
  exists (
    select 1 from rede_membros m
    where m.rede_id = unidades.rede_id
      and m.identidade_id = auth.uid()
      and m.status = 'ativo'
  )
);

-- DEPARTAMENTOS: idem
drop policy if exists deptos_membro_read on departamentos;
create policy deptos_membro_read on departamentos for select using (
  exists (
    select 1 from rede_membros m
    where m.rede_id = departamentos.rede_id
      and m.identidade_id = auth.uid()
      and m.status = 'ativo'
  )
);

-- CARGOS: idem
drop policy if exists cargos_membro_read on cargos;
create policy cargos_membro_read on cargos for select using (
  exists (
    select 1 from rede_membros m
    where m.rede_id = cargos.rede_id
      and m.identidade_id = auth.uid()
      and m.status = 'ativo'
  )
);
