-- Ao criar rede: além dos cargos fixos, cria 1 unidade e 1 departamento padrão
create or replace function on_rede_seed_cargos()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform seed_cargos(new.id);
  insert into unidades (rede_id, nome, codigo, tipo)
    values (new.id, 'Matriz', '001', 'loja');
  insert into departamentos (rede_id, nome, escopo)
    values (new.id, 'Geral', 'rede');
  return new;
end $$;
