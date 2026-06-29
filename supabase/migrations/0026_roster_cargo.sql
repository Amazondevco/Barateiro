-- ============================================================
-- Roster e membros passam a carregar o CARGO (permissão da rede).
-- vincular_por_cpf copia o cargo para o vínculo criado.
-- ============================================================
alter table rede_roster
  add column if not exists cargo_id uuid references cargos(id) on delete set null;
alter table rede_membros
  add column if not exists cargo_id uuid references cargos(id) on delete set null;

create or replace function vincular_por_cpf(p_cpf text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_ident uuid;
  v_cpf   text := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  r       record;
begin
  if v_cpf = '' then return; end if;

  select id into v_ident from identidades
  where regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = v_cpf
  limit 1;
  if v_ident is null then return; end if;

  for r in
    select * from rede_roster
    where regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = v_cpf
      and status = 'aguardando'
  loop
    insert into rede_membros (
      identidade_id, rede_id, papel, cargo_id, unidade_id, departamento_id,
      icone_id, matricula, origem, status, aprovado_em
    ) values (
      v_ident, r.rede_id, r.papel, r.cargo_id, r.unidade_id, r.departamento_id,
      r.icone_id, r.matricula, 'pre_cadastro', 'ativo', now()
    )
    on conflict (identidade_id, rede_id) do update set
      papel = excluded.papel,
      cargo_id = excluded.cargo_id,
      unidade_id = excluded.unidade_id,
      departamento_id = excluded.departamento_id,
      icone_id = excluded.icone_id,
      matricula = excluded.matricula,
      status = 'ativo';

    update rede_roster set status = 'vinculado' where id = r.id;
  end loop;
end $$;
