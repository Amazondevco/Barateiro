-- Guarda o último link de convite/cadastro gerado para o responsável da rede,
-- para o super admin copiar e reenviar manualmente (enquanto o e-mail não sai).
alter table redes add column if not exists convite_link text;
alter table redes add column if not exists convite_em timestamptz;
