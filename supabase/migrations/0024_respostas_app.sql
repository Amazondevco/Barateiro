-- ============================================================
-- Fase 4: usuário do app (identidade) preenche e assina formulários.
-- - respostas.usuario_id passa a referenciar auth.users (serve profiles E identidades)
-- - assinatura carimbada em cada resposta
-- - membros ativos leem os formulários da sua rede
-- - função enviar_resposta() salva resposta + itens (bypass da RLS antiga por profiles)
-- ============================================================

-- 1) Assinatura na resposta
alter table respostas
  add column if not exists assinatura_svg text,
  add column if not exists assinada_em    timestamptz;

-- 2) FK de usuario_id: profiles → auth.users (compatível com dados existentes)
do $$
declare cname text;
begin
  select tc.constraint_name into cname
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name
  where tc.table_name = 'respostas' and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'usuario_id';
  if cname is not null then
    execute format('alter table respostas drop constraint %I', cname);
  end if;
end $$;
alter table respostas
  add constraint respostas_usuario_auth_fkey
  foreign key (usuario_id) references auth.users(id) on delete restrict;

-- 3) Leitura dos formulários para membros ativos (policies ADITIVAS)
drop policy if exists formularios_membro_read on formularios;
create policy formularios_membro_read on formularios for select using (
  exists (
    select 1 from rede_membros m
    where m.identidade_id = auth.uid() and m.rede_id = formularios.rede_id and m.status = 'ativo'
  )
);

drop policy if exists secoes_membro_read on formulario_secoes;
create policy secoes_membro_read on formulario_secoes for select using (
  exists (
    select 1 from formularios f
    join rede_membros m on m.rede_id = f.rede_id
    where f.id = formulario_secoes.formulario_id and m.identidade_id = auth.uid() and m.status = 'ativo'
  )
);

drop policy if exists itens_membro_read on formulario_itens;
create policy itens_membro_read on formulario_itens for select using (
  exists (
    select 1 from formulario_secoes s
    join formularios f on f.id = s.formulario_id
    join rede_membros m on m.rede_id = f.rede_id
    where s.id = formulario_itens.secao_id and m.identidade_id = auth.uid() and m.status = 'ativo'
  )
);

-- membro lê as próprias respostas
drop policy if exists resp_membro_read on respostas;
create policy resp_membro_read on respostas for select using (usuario_id = auth.uid());

-- 4) Envio da resposta (valida vínculo ativo; carimba assinatura)
create or replace function enviar_resposta(
  p_formulario uuid,
  p_itens jsonb,         -- [{item_id, valor, observacao, foto_url}]
  p_assinatura text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_form    formularios%rowtype;
  v_membro  rede_membros%rowtype;
  v_unidade uuid;
  v_resp    uuid;
  v_item    jsonb;
  v_total   int;
  v_nao     int := 0;
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

  v_total := coalesce(jsonb_array_length(p_itens), 0);
  for v_item in select * from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) loop
    if lower(coalesce(v_item->>'valor','')) in ('nao','não','ruptura') then
      v_nao := v_nao + 1;
    end if;
  end loop;

  insert into respostas (
    formulario_id, unidade_id, usuario_id, rede_id, data_referencia,
    status, total_itens, total_nao, assinatura_svg, assinada_em
  ) values (
    p_formulario, v_unidade, auth.uid(), v_form.rede_id, current_date,
    'no_prazo', v_total, v_nao, p_assinatura,
    case when nullif(p_assinatura,'') is not null then now() end
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

grant execute on function enviar_resposta(uuid, jsonb, text) to authenticated;
