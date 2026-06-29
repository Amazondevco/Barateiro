-- ============================================================
-- Fase 5: provisionamento por CPF (roster).
-- O admin sobe a lista (CPF → unidade/cargo/depto). Quando a pessoa se
-- cadastra com o mesmo CPF, vira membro ativo automaticamente. Funciona
-- nos dois sentidos (cadastro ↔ admin sobe CPF).
-- ============================================================

-- ---------- Tabela do roster ----------
create table if not exists rede_roster (
  id              uuid primary key default gen_random_uuid(),
  rede_id         uuid not null references redes(id) on delete cascade,
  icone_id        uuid,
  cpf             text not null,                  -- guardado só com dígitos
  nome            text not null,
  papel           papel not null default 'gerente',
  unidade_id      uuid references unidades(id) on delete set null,
  departamento_id uuid references departamentos(id) on delete set null,
  matricula       text,
  status          text not null default 'aguardando',  -- aguardando | vinculado
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (rede_id, cpf)
);

create index if not exists idx_rede_roster_cpf on rede_roster(cpf);

alter table rede_roster enable row level security;

-- só o admin da rede gerencia o roster (super_admin murado).
drop policy if exists roster_admin_all on rede_roster;
create policy roster_admin_all on rede_roster for all
  using (is_admin_da_rede(rede_id))
  with check (is_admin_da_rede(rede_id));

-- ---------- Matching por CPF ----------
-- Dado um CPF, acha a identidade e vincula todos os rosters 'aguardando'.
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
  if v_ident is null then return; end if;  -- ainda não se cadastrou → espera

  for r in
    select * from rede_roster
    where regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = v_cpf
      and status = 'aguardando'
  loop
    insert into rede_membros (
      identidade_id, rede_id, papel, unidade_id, departamento_id,
      icone_id, matricula, origem, status, aprovado_em
    ) values (
      v_ident, r.rede_id, r.papel, r.unidade_id, r.departamento_id,
      r.icone_id, r.matricula, 'pre_cadastro', 'ativo', now()
    )
    on conflict (identidade_id, rede_id) do update set
      papel = excluded.papel,
      unidade_id = excluded.unidade_id,
      departamento_id = excluded.departamento_id,
      icone_id = excluded.icone_id,
      matricula = excluded.matricula,
      status = 'ativo';

    update rede_roster set status = 'vinculado' where id = r.id;
  end loop;
end $$;

-- ---------- Triggers (os dois lados) ----------
create or replace function trg_identidade_vincular()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform vincular_por_cpf(new.cpf);
  return new;
end $$;

drop trigger if exists identidade_vincular on identidades;
create trigger identidade_vincular after insert on identidades
  for each row execute function trg_identidade_vincular();

create or replace function trg_roster_vincular()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform vincular_por_cpf(new.cpf);
  return new;
end $$;

drop trigger if exists roster_vincular on rede_roster;
create trigger roster_vincular after insert on rede_roster
  for each row execute function trg_roster_vincular();
