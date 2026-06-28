-- Tipos de campo flexíveis + opções/ajuda por item + quebra de página por seção
alter table formulario_itens alter column tipo type text;
alter table formulario_itens add column if not exists opcoes text[];
alter table formulario_itens add column if not exists ajuda text;
alter table formulario_secoes add column if not exists quebra_pagina boolean not null default false;
