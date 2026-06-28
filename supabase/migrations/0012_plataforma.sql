-- ============================================================
-- Configurações da plataforma (Super Admin) — linha única
-- Aparência da plataforma + padrões que toda rede nova herda.
-- Apenas o super_admin lê/edita.
-- ============================================================
create table if not exists plataforma (
  id boolean primary key default true,
  nome text not null default 'Amazon Dev & Co.',
  logo_url text,
  banner_url text,
  cor_primaria text default '#2563eb',
  cor_sidebar text default '#0f172a',
  default_horario_limite time not null default '10:00',
  default_dias int[] not null default array[1,3,5,6],
  default_janela_edicao int not null default 30,
  default_retencao_fotos int not null default 60,
  updated_at timestamptz not null default now(),
  constraint plataforma_single check (id = true)
);
insert into plataforma (id) values (true) on conflict (id) do nothing;

alter table plataforma enable row level security;
drop policy if exists plat_super on plataforma;
create policy plat_super on plataforma for all
  using (is_super_admin()) with check (is_super_admin());

-- Rede nova herda os padrões da plataforma (+ cargos/unidade/depto)
create or replace function on_rede_seed_cargos()
returns trigger language plpgsql security definer set search_path = public as $$
declare p plataforma%rowtype;
begin
  perform seed_cargos(new.id);
  insert into unidades (rede_id, nome, codigo, tipo)
    values (new.id, 'Matriz', '001', 'loja');
  insert into departamentos (rede_id, nome, escopo)
    values (new.id, 'Geral', 'rede');
  select * into p from plataforma where id = true;
  if found then
    update redes set
      horario_limite = p.default_horario_limite,
      dias_frequencia = p.default_dias,
      janela_edicao_min = p.default_janela_edicao,
      retencao_fotos_dias = p.default_retencao_fotos
    where id = new.id;
  end if;
  return new;
end $$;
