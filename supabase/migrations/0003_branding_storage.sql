-- ============================================================
-- Branding: banner da rede + bucket de Storage (logos/banners)
-- ============================================================

alter table redes add column if not exists banner_url text;

-- Bucket público para arquivos de marca
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Leitura pública; escrita apenas por usuários autenticados
drop policy if exists "branding_public_read" on storage.objects;
create policy "branding_public_read" on storage.objects
  for select using (bucket_id = 'branding');

drop policy if exists "branding_auth_insert" on storage.objects;
create policy "branding_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'branding');

drop policy if exists "branding_auth_update" on storage.objects;
create policy "branding_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'branding');

drop policy if exists "branding_auth_delete" on storage.objects;
create policy "branding_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'branding');
