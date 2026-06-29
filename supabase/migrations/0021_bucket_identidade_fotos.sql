-- ============================================================
-- Bucket para foto de perfil do cadastro do app.
-- A foto sobe DURANTE o cadastro (antes da confirmação de e-mail),
-- por isso permite insert anônimo. Leitura pública.
-- ⚠️ v1/teste: endurecer depois (limite de tamanho/tipo, mover p/ pós-confirmação).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('identidade-fotos', 'identidade-fotos', true)
on conflict (id) do nothing;

drop policy if exists idfotos_public_read on storage.objects;
create policy idfotos_public_read on storage.objects
  for select using (bucket_id = 'identidade-fotos');

drop policy if exists idfotos_insert on storage.objects;
create policy idfotos_insert on storage.objects
  for insert with check (bucket_id = 'identidade-fotos');
