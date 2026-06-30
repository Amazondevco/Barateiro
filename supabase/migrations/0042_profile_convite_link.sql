-- Link de acesso (recuperação/cadastro) por USUÁRIO, para o super admin copiar e
-- enviar manualmente a cada pessoa criada na rede.
alter table profiles add column if not exists convite_link text;
alter table profiles add column if not exists convite_em timestamptz;
