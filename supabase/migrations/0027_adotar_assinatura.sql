-- ============================================================
-- Adoção da assinatura no 1º acesso à rede (membro provisionado por roster).
-- A pessoa só assina por si mesma (identidade_id = auth.uid()).
-- ============================================================
create or replace function adotar_assinatura(
  p_membro uuid,
  p_assinatura text,
  p_consent boolean
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not p_consent then raise exception 'É preciso confirmar a assinatura'; end if;
  if coalesce(p_assinatura, '') = '' then raise exception 'Assinatura vazia'; end if;

  update rede_membros set
    assinatura_svg = p_assinatura,
    assinatura_consentimento = true,
    assinatura_aceite_em = now()
  where id = p_membro and identidade_id = auth.uid();

  if not found then raise exception 'Vínculo não encontrado'; end if;
end $$;

grant execute on function adotar_assinatura(uuid, text, boolean) to authenticated;
