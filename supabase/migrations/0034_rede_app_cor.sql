-- Cor primária INTERNA do app da rede (botões/barra), separada da cor do dashboard.
alter table redes add column if not exists app_cor text;
