-- ============================================================
-- Muro real: super admin NÃO lê conteúdo de respostas por RLS.
-- Abrir conteúdo de uma rede passa a ser via função auditada.
-- (admin/gerente continuam com suas policies; a IA usa agregados.)
-- ============================================================
drop policy if exists resp_super on respostas;
drop policy if exists ri_super on resposta_itens;

-- Acesso de conteúdo de uma rede pelo super admin — REGISTRA em audit_logs.
create or replace function super_ver_conteudo_rede(p_rede uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v jsonb;
begin
  if not is_super_admin() then
    raise exception 'Apenas super admin';
  end if;

  insert into audit_logs (rede_id, usuario_id, acao, entidade, detalhe)
  values (p_rede, auth.uid(), 'ver_conteudo_rede', 'respostas',
          jsonb_build_object('via', 'assistente_ia'));

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v from (
    select f.nome as formulario, u.nome as unidade, r.status,
           r.data_referencia, r.total_itens, r.total_nao, r.enviado_em
    from respostas r
    join formularios f on f.id = r.formulario_id
    left join unidades u on u.id = r.unidade_id
    where r.rede_id = p_rede
    order by r.enviado_em desc
    limit 30
  ) x;

  return v;
end $$;

grant execute on function super_ver_conteudo_rede(uuid) to authenticated;
