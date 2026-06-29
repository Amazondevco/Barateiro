-- ============================================================
-- PENDENTE NO BANCO REMOTO — colar no SQL Editor do Supabase e RUN
-- Migrations 0016 + 0017 (idempotentes: seguras de rodar mais de uma vez)
-- ============================================================

-- 0016: Disponibilidade do formulário (janela de horário + dias da semana)
alter table formularios
  add column if not exists disponivel_de  time,
  add column if not exists disponivel_ate time,
  add column if not exists dias_semana    int[] not null default '{}'; -- ISO: 1=Seg ... 7=Dom

-- 0017: Fluxo de acesso/cadastro do app (padrão para redes novas)
alter table plataforma
  add column if not exists app_exige_cadastro boolean not null default true,
  add column if not exists app_aprovacao_admin boolean not null default false,
  add column if not exists app_cadastro_campos jsonb not null default '[
    {"label":"Nome completo","tipo":"texto","obrigatorio":true},
    {"label":"E-mail","tipo":"email","obrigatorio":true},
    {"label":"Telefone","tipo":"telefone","obrigatorio":true},
    {"label":"CPF","tipo":"texto","obrigatorio":false},
    {"label":"Unidade / Loja","tipo":"texto","obrigatorio":true},
    {"label":"Cargo / Função","tipo":"texto","obrigatorio":true},
    {"label":"Foto de perfil","tipo":"foto","obrigatorio":false}
  ]'::jsonb;
