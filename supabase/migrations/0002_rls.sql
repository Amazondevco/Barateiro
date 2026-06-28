-- ============================================================
-- RLS — isolamento multi-tenant + recorte por papel
-- ============================================================

-- ---------- Helpers (SECURITY DEFINER: evitam recursão no profiles) ----------
create or replace function auth_papel()
returns papel language sql stable security definer set search_path = public as $$
  select papel from profiles where id = auth.uid()
$$;

create or replace function auth_rede_id()
returns uuid language sql stable security definer set search_path = public as $$
  select rede_id from profiles where id = auth.uid()
$$;

create or replace function is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and papel = 'super_admin')
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and papel = 'admin_supermercado')
$$;

create or replace function user_unidade_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select unidade_id from usuario_unidades where user_id = auth.uid()
$$;

-- ---------- Ativar RLS ----------
alter table redes              enable row level security;
alter table unidades           enable row level security;
alter table departamentos      enable row level security;
alter table profiles           enable row level security;
alter table usuario_unidades   enable row level security;
alter table formularios        enable row level security;
alter table formulario_secoes  enable row level security;
alter table formulario_itens   enable row level security;
alter table respostas          enable row level security;
alter table resposta_itens     enable row level security;
alter table audit_logs         enable row level security;

-- ============================================================
-- REDES
-- ============================================================
create policy redes_super on redes for all
  using (is_super_admin()) with check (is_super_admin());
create policy redes_tenant_read on redes for select
  using (id = auth_rede_id());

-- ============================================================
-- UNIDADES
-- ============================================================
create policy unidades_super on unidades for all
  using (is_super_admin()) with check (is_super_admin());
create policy unidades_admin on unidades for all
  using (is_admin() and rede_id = auth_rede_id())
  with check (is_admin() and rede_id = auth_rede_id());
create policy unidades_gerente_read on unidades for select
  using (id in (select user_unidade_ids()));

-- ============================================================
-- DEPARTAMENTOS
-- ============================================================
create policy deptos_super on departamentos for all
  using (is_super_admin()) with check (is_super_admin());
create policy deptos_admin on departamentos for all
  using (is_admin() and rede_id = auth_rede_id())
  with check (is_admin() and rede_id = auth_rede_id());
create policy deptos_tenant_read on departamentos for select
  using (rede_id = auth_rede_id());

-- ============================================================
-- PROFILES
-- ============================================================
create policy profiles_super on profiles for all
  using (is_super_admin()) with check (is_super_admin());
create policy profiles_admin on profiles for all
  using (is_admin() and rede_id = auth_rede_id())
  with check (is_admin() and rede_id = auth_rede_id());
create policy profiles_self_read on profiles for select
  using (id = auth.uid());
create policy profiles_self_update on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ============================================================
-- USUARIO_UNIDADES
-- ============================================================
create policy uu_super on usuario_unidades for all
  using (is_super_admin()) with check (is_super_admin());
create policy uu_admin on usuario_unidades for all
  using (is_admin() and exists (
    select 1 from profiles p where p.id = usuario_unidades.user_id and p.rede_id = auth_rede_id()))
  with check (is_admin() and exists (
    select 1 from profiles p where p.id = usuario_unidades.user_id and p.rede_id = auth_rede_id()));
create policy uu_self_read on usuario_unidades for select
  using (user_id = auth.uid());

-- ============================================================
-- FORMULÁRIOS (+ seções + itens). Templates globais: rede_id null.
-- ============================================================
create policy form_super on formularios for all
  using (is_super_admin()) with check (is_super_admin());
create policy form_admin on formularios for all
  using (is_admin() and rede_id = auth_rede_id())
  with check (is_admin() and rede_id = auth_rede_id());
create policy form_tenant_read on formularios for select
  using (rede_id = auth_rede_id() or rede_id is null);

create policy secoes_super on formulario_secoes for all
  using (is_super_admin()) with check (is_super_admin());
create policy secoes_read on formulario_secoes for select
  using (exists (select 1 from formularios f where f.id = formulario_id
    and (f.rede_id = auth_rede_id() or f.rede_id is null)));
create policy secoes_admin on formulario_secoes for all
  using (is_admin() and exists (select 1 from formularios f where f.id = formulario_id and f.rede_id = auth_rede_id()))
  with check (is_admin() and exists (select 1 from formularios f where f.id = formulario_id and f.rede_id = auth_rede_id()));

create policy itens_super on formulario_itens for all
  using (is_super_admin()) with check (is_super_admin());
create policy itens_read on formulario_itens for select
  using (exists (select 1 from formulario_secoes s join formularios f on f.id = s.formulario_id
    where s.id = secao_id and (f.rede_id = auth_rede_id() or f.rede_id is null)));
create policy itens_admin on formulario_itens for all
  using (is_admin() and exists (select 1 from formulario_secoes s join formularios f on f.id = s.formulario_id
    where s.id = secao_id and f.rede_id = auth_rede_id()))
  with check (is_admin() and exists (select 1 from formulario_secoes s join formularios f on f.id = s.formulario_id
    where s.id = secao_id and f.rede_id = auth_rede_id()));

-- ============================================================
-- RESPOSTAS (+ itens)
-- ============================================================
create policy resp_super on respostas for all
  using (is_super_admin()) with check (is_super_admin());
create policy resp_admin on respostas for all
  using (is_admin() and rede_id = auth_rede_id())
  with check (is_admin() and rede_id = auth_rede_id());
-- Gerente: lê e cria respostas das suas unidades
create policy resp_gerente_read on respostas for select
  using (unidade_id in (select user_unidade_ids()));
create policy resp_gerente_insert on respostas for insert
  with check (usuario_id = auth.uid() and unidade_id in (select user_unidade_ids()));
create policy resp_gerente_update on respostas for update
  using (usuario_id = auth.uid() and unidade_id in (select user_unidade_ids()))
  with check (usuario_id = auth.uid());

create policy ri_super on resposta_itens for all
  using (is_super_admin()) with check (is_super_admin());
create policy ri_tenant on resposta_itens for all
  using (exists (select 1 from respostas r where r.id = resposta_id
    and (r.rede_id = auth_rede_id() or r.usuario_id = auth.uid())))
  with check (exists (select 1 from respostas r where r.id = resposta_id
    and (r.rede_id = auth_rede_id() or r.usuario_id = auth.uid())));

-- ============================================================
-- AUDIT LOGS
-- ============================================================
create policy audit_super on audit_logs for all
  using (is_super_admin()) with check (is_super_admin());
create policy audit_admin_read on audit_logs for select
  using (is_admin() and rede_id = auth_rede_id());
create policy audit_insert on audit_logs for insert
  with check (auth.uid() is not null);
