-- "Tipo de unidade" saiu do builder de checklist — a segmentação é feita em
-- "Quem preenche" (unidades/departamentos/usuários). tipo_unidade vira opcional;
-- null = vale para qualquer tipo de unidade.
alter table formularios alter column tipo_unidade drop not null;

-- Zera os existentes (o app não filtra mais por tipo; checklists ficavam ocultos
-- quando o tipo da unidade do operador não batia, ex.: "escritorio" vs "loja").
update formularios set tipo_unidade = null where tipo_unidade is not null;
