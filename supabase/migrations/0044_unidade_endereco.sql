-- Endereço estruturado da unidade (CEP preenche o resto + lat/lng).
alter table unidades add column if not exists cep text;
alter table unidades add column if not exists bairro text;
alter table unidades add column if not exists numero text;
alter table unidades add column if not exists complemento text;
