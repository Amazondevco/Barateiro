-- "Permitir apenas fotos tiradas na hora": quando true, o app só abre a câmera
-- (sem galeria) nos campos de foto do checklist. Default false (permite galeria).
alter table formularios
  add column if not exists foto_apenas_camera boolean not null default false;
