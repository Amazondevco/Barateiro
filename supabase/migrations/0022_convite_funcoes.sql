-- ============================================================
-- Funções para o usuário do app entrar numa rede via convite (link do ícone).
-- RLS de rede_membros só deixa admin inserir; o self-join entra por estas
-- funções SECURITY DEFINER (a pessoa só consegue se vincular como ela mesma).
-- ============================================================

-- Info pública do convite (por token) — para a tela de registro mostrar a rede.
create or replace function convite_info(p_token text)
returns table (
  rede_id uuid,
  rede_nome text,
  papel papel,
  unidade_id uuid,
  exige_aprovacao boolean
)
language sql security definer set search_path = public stable as $$
  select c.rede_id, r.nome, c.papel_default, c.unidade_default, c.exige_aprovacao
  from convites c
  join redes r on r.id = c.rede_id
  where c.token = p_token
    and (c.validade is null or c.validade > now())
$$;

-- Usa o convite: cria/atualiza o vínculo do usuário LOGADO com a rede,
-- registrando a assinatura eletrônica adotada.
create or replace function usar_convite(
  p_token text,
  p_assinatura text,
  p_consent boolean
)
returns rede_membros
language plpgsql security definer set search_path = public as $$
declare
  c convites%rowtype;
  m rede_membros;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if not p_consent then
    raise exception 'É preciso confirmar a assinatura';
  end if;
  if coalesce(p_assinatura, '') = '' then
    raise exception 'Assinatura vazia';
  end if;

  select * into c from convites
  where token = p_token and (validade is null or validade > now());
  if not found then
    raise exception 'Convite inválido ou expirado';
  end if;

  if not exists (select 1 from identidades where id = auth.uid()) then
    raise exception 'Conclua o cadastro antes de entrar numa rede';
  end if;

  insert into rede_membros (
    identidade_id, rede_id, papel, unidade_id, icone_id, origem, status,
    assinatura_svg, assinatura_consentimento, assinatura_aceite_em,
    aprovado_em
  ) values (
    auth.uid(), c.rede_id, c.papel_default, c.unidade_default, c.icone_id, 'link_icone',
    case when c.exige_aprovacao then 'pendente'::membro_status else 'ativo'::membro_status end,
    p_assinatura, true, now(),
    case when c.exige_aprovacao then null else now() end
  )
  on conflict (identidade_id, rede_id) do update set
    assinatura_svg = excluded.assinatura_svg,
    assinatura_consentimento = true,
    assinatura_aceite_em = now()
  returning * into m;

  return m;
end $$;

grant execute on function convite_info(text) to authenticated, anon;
grant execute on function usar_convite(text, text, boolean) to authenticated;
