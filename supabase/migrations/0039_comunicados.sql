-- ============================================================
-- Comunicados — push notifications + inbox de avisos do app.
-- Enviados pelo painel (super admin: qualquer rede; admin: a própria).
-- Alvo dentro da rede: todos | usuário | unidade | departamento | cargo(s).
-- O app lê via RLS apenas os comunicados direcionados ao membro.
-- ============================================================

create table if not exists comunicados (
  id         uuid primary key default gen_random_uuid(),
  rede_id    uuid not null references redes(id) on delete cascade,
  autor_id   uuid references auth.users(id) on delete set null,
  titulo     text not null,
  corpo      text not null,
  alvo_tipo  text not null default 'todos'
             check (alvo_tipo in ('todos','usuario','unidade','departamento','cargo')),
  -- ids do alvo (identidades / unidades / departamentos / cargos). Vazio = todos.
  alvo_ids   uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists comunicados_rede_idx
  on comunicados (rede_id, created_at desc);

alter table comunicados enable row level security;

-- App: membro lê os comunicados direcionados a ele, na rede dele.
drop policy if exists comunicados_app_select on comunicados;
create policy comunicados_app_select on comunicados for select using (
  exists (
    select 1 from rede_membros m
    where m.identidade_id = auth.uid()
      and m.rede_id = comunicados.rede_id
      and m.status = 'ativo'
      and (
        comunicados.alvo_tipo = 'todos'
        or (comunicados.alvo_tipo = 'usuario'      and m.identidade_id   = any (comunicados.alvo_ids))
        or (comunicados.alvo_tipo = 'unidade'      and m.unidade_id      = any (comunicados.alvo_ids))
        or (comunicados.alvo_tipo = 'departamento' and m.departamento_id = any (comunicados.alvo_ids))
        or (comunicados.alvo_tipo = 'cargo'        and m.cargo_id        = any (comunicados.alvo_ids))
      )
  )
);

-- Painel: super admin vê tudo; admin/gerente vê a própria rede.
drop policy if exists comunicados_painel_select on comunicados;
create policy comunicados_painel_select on comunicados for select using (
  is_super_admin() or is_admin_da_rede(rede_id)
);

-- Painel: criar (super admin qualquer rede; admin a própria). Autor = quem envia.
drop policy if exists comunicados_insert on comunicados;
create policy comunicados_insert on comunicados for insert with check (
  autor_id = auth.uid()
  and (is_super_admin() or is_admin_da_rede(rede_id))
);

-- Painel: apagar (mesma regra de escrita).
drop policy if exists comunicados_delete on comunicados;
create policy comunicados_delete on comunicados for delete using (
  is_super_admin() or is_admin_da_rede(rede_id)
);
