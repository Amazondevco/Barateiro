-- ============================================================
-- Fluxo de acesso do app dos gerentes (padrão para redes novas)
-- Baixar → Cadastro (dados obrigatórios) → [Aprovação] → Acesso.
-- Sem completar o cadastro, o usuário NÃO acessa o app.
-- ============================================================
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
