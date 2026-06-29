-- ============================================================
-- Roteia o signup do Auth:
--   metadata.tipo = 'app'  → cria IDENTIDADE (usuário final do app)
--   caso contrário          → cria PROFILE (usuário do dashboard, como antes)
-- Evita que todo cadastro do app vire um usuário de dashboard.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_user_meta_data->>'tipo','') = 'app' then
    insert into public.identidades (
      id, nome, email, cpf, celular, foto_url,
      cep, uf, cidade, bairro, logradouro, numero, complemento,
      termo_versao, termo_aceite_em
    ) values (
      new.id,
      coalesce(new.raw_user_meta_data->>'nome',''),
      new.email,
      nullif(new.raw_user_meta_data->>'cpf',''),
      nullif(new.raw_user_meta_data->>'celular',''),
      nullif(new.raw_user_meta_data->>'foto_url',''),
      nullif(new.raw_user_meta_data->>'cep',''),
      nullif(new.raw_user_meta_data->>'uf',''),
      nullif(new.raw_user_meta_data->>'cidade',''),
      nullif(new.raw_user_meta_data->>'bairro',''),
      nullif(new.raw_user_meta_data->>'logradouro',''),
      nullif(new.raw_user_meta_data->>'numero',''),
      nullif(new.raw_user_meta_data->>'complemento',''),
      nullif(new.raw_user_meta_data->>'termo_versao',''),
      case when nullif(new.raw_user_meta_data->>'termo_versao','') is not null then now() end
    )
    on conflict (id) do nothing;
  else
    insert into public.profiles (id, email, nome, papel, rede_id)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'nome',''),
      coalesce((new.raw_user_meta_data->>'papel')::papel, 'gerente'),
      (new.raw_user_meta_data->>'rede_id')::uuid
    )
    on conflict (id) do nothing;
  end if;
  return new;
end $$;
