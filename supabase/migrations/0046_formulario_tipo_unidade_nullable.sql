-- "Tipo de unidade" saiu do builder de checklist — a segmentação é feita em
-- "Quem preenche" (unidades/departamentos/usuários). tipo_unidade vira opcional;
-- null = vale para qualquer tipo de unidade.
alter table formularios alter column tipo_unidade drop not null;
