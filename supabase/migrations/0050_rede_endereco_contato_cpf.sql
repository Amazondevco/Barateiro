-- ============================================================
-- Endereço da rede (JSON em texto) + CPF do contato responsável.
-- (A tabela `redes` não tinha coluna de endereço — `endereco/cidade/uf` são da
--  tabela `unidades`. Estas colunas suportam o card Endereço e o CPF do contato
--  no cadastro da rede.)
-- ============================================================

alter table redes add column if not exists endereco text;
alter table redes add column if not exists contato_cpf text;
