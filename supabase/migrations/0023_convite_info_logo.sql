-- convite_info passa a retornar também o logo da rede (para o cabeçalho do registro).
drop function if exists convite_info(text);

create function convite_info(p_token text)
returns table (
  rede_id uuid,
  rede_nome text,
  rede_logo text,
  papel papel,
  unidade_id uuid,
  exige_aprovacao boolean
)
language sql security definer set search_path = public stable as $$
  select c.rede_id, r.nome, r.logo_url, c.papel_default, c.unidade_default, c.exige_aprovacao
  from convites c
  join redes r on r.id = c.rede_id
  where c.token = p_token
    and (c.validade is null or c.validade > now())
$$;

grant execute on function convite_info(text) to authenticated, anon;
