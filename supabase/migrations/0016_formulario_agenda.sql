-- ============================================================
-- Disponibilidade do formulário: janela de horário e dias da semana.
-- null/vazio = sem restrição (vale o dia todo / todos os dias).
-- ============================================================
alter table formularios
  add column if not exists disponivel_de  time,
  add column if not exists disponivel_ate time,
  add column if not exists dias_semana    int[] not null default '{}'; -- ISO: 1=Seg ... 7=Dom
