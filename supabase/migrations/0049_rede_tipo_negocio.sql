-- Tipo de negócio da rede-cliente (segmento). Deixa o sistema genérico para
-- qualquer empresa que use checklists. Alimenta os prompts de IA (geração de
-- checklist e relatórios) com o contexto do ramo. Redes antigas ficam nulas
-- (tratadas como "Outro"/genérico) até serem editadas.
alter table redes add column if not exists tipo_negocio text;
