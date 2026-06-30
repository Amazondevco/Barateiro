-- Geolocalização nos formulários:
-- - exige_localizacao: captura GPS no envio.
-- - geofence_raio_m: se preenchido, o envio precisa estar dentro desse raio da
--   unidade (referência = unidades.geo_lat/lng). Fora do raio → presenca_ok=false.
alter table formularios add column if not exists exige_localizacao boolean not null default false;
alter table formularios add column if not exists geofence_raio_m int;

-- enviar_resposta passa a aceitar lat/lng e calcular presenca_ok (Haversine).
drop function if exists enviar_resposta(uuid, jsonb, text, date);

create or replace function enviar_resposta(
  p_formulario uuid,
  p_itens jsonb,
  p_assinatura text,
  p_data date default current_date,
  p_lat double precision default null,
  p_lng double precision default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_form     formularios%rowtype;
  v_membro   rede_membros%rowtype;
  v_unidade  uuid;
  v_uni      unidades%rowtype;
  v_resp     uuid;
  v_item     jsonb;
  v_total    int;
  v_nao      int := 0;
  v_ref      date := least(coalesce(p_data, current_date), current_date);
  v_presenca boolean := null;
  v_dist     double precision;
begin
  select * into v_form from formularios where id = p_formulario;
  if not found then raise exception 'Formulário não encontrado'; end if;

  select * into v_membro from rede_membros
  where identidade_id = auth.uid() and rede_id = v_form.rede_id and status = 'ativo';
  if not found then raise exception 'Sem acesso a este formulário'; end if;

  v_unidade := coalesce(
    v_membro.unidade_id,
    (select id from unidades where rede_id = v_form.rede_id order by created_at limit 1)
  );
  if v_unidade is null then raise exception 'Rede sem unidade'; end if;
  select * into v_uni from unidades where id = v_unidade;

  -- Presença: só avalia se o form exige geofence e há coords da unidade e do envio.
  if v_form.exige_localizacao and v_form.geofence_raio_m is not null
     and v_uni.geo_lat is not null and v_uni.geo_lng is not null
     and p_lat is not null and p_lng is not null then
    v_dist := 6371000 * acos(least(1, greatest(-1,
      cos(radians(v_uni.geo_lat)) * cos(radians(p_lat)) * cos(radians(p_lng) - radians(v_uni.geo_lng))
      + sin(radians(v_uni.geo_lat)) * sin(radians(p_lat))
    )));
    v_presenca := v_dist <= v_form.geofence_raio_m;
  end if;

  v_total := coalesce(jsonb_array_length(p_itens), 0);
  for v_item in select * from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) loop
    if lower(coalesce(v_item->>'valor','')) in ('nao','não','ruptura') then
      v_nao := v_nao + 1;
    end if;
  end loop;

  insert into respostas (
    formulario_id, unidade_id, usuario_id, rede_id, data_referencia,
    status, total_itens, total_nao, assinatura_svg, assinada_em,
    geo_lat, geo_lng, presenca_ok
  ) values (
    p_formulario, v_unidade, auth.uid(), v_form.rede_id, v_ref,
    'no_prazo', v_total, v_nao, p_assinatura,
    case when nullif(p_assinatura,'') is not null then now() end,
    p_lat, p_lng, v_presenca
  )
  returning id into v_resp;

  for v_item in select * from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) loop
    insert into resposta_itens (resposta_id, item_id, valor, observacao, foto_url)
    values (
      v_resp,
      (v_item->>'item_id')::uuid,
      v_item->>'valor',
      nullif(v_item->>'observacao',''),
      nullif(v_item->>'foto_url','')
    );
  end loop;

  return v_resp;
end $$;

grant execute on function enviar_resposta(uuid, jsonb, text, date, double precision, double precision) to authenticated;
