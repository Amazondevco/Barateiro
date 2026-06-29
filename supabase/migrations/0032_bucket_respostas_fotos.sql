-- Fotos anexadas nas respostas de formulário (itens do tipo foto).
insert into storage.buckets (id, name, public)
values ('respostas-fotos', 'respostas-fotos', true)
on conflict (id) do nothing;

drop policy if exists rfotos_read on storage.objects;
create policy rfotos_read on storage.objects
  for select using (bucket_id = 'respostas-fotos');

drop policy if exists rfotos_insert on storage.objects;
create policy rfotos_insert on storage.objects
  for insert with check (bucket_id = 'respostas-fotos' and auth.uid() is not null);
