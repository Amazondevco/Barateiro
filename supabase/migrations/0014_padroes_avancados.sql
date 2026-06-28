-- ============================================================
-- Padrões avançados da plataforma (Super Admin)
-- Toda rede nova herda: departamentos, tipos de unidade, padrões de
-- usuário e configuração do app dos gerentes.
-- ============================================================
alter table plataforma
  add column if not exists default_departamentos text[] not null
    default array['Hortifrúti','Açougue','Padaria','Mercearia','Frios e Laticínios','Limpeza','Frente de Caixa'],
  add column if not exists default_unidade_tipos text[] not null
    default array['loja','cd','escritorio','outro'],
  add column if not exists default_papel_usuario text not null default 'gerente',
  add column if not exists default_status_usuario text not null default 'ativo',
  add column if not exists default_limite_usuarios int,
  add column if not exists app_foto_obrigatoria boolean not null default true,
  add column if not exists app_geolocalizacao boolean not null default true,
  add column if not exists app_assinatura boolean not null default false,
  add column if not exists app_offline boolean not null default true;

-- Rede nova herda os padrões da plataforma (+ cargos/unidade/departamentos)
create or replace function on_rede_seed_cargos()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p plataforma%rowtype;
  d text;
begin
  perform seed_cargos(new.id);
  insert into unidades (rede_id, nome, codigo, tipo)
    values (new.id, 'Matriz', '001', 'loja');

  select * into p from plataforma where id = true;

  -- Departamentos padrão (lista definida pelo Super Admin); fallback 'Geral'
  if found and array_length(p.default_departamentos, 1) is not null then
    foreach d in array p.default_departamentos loop
      insert into departamentos (rede_id, nome, escopo) values (new.id, d, 'rede');
    end loop;
  else
    insert into departamentos (rede_id, nome, escopo) values (new.id, 'Geral', 'rede');
  end if;

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
