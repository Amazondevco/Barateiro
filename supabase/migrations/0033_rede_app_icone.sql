-- Ícone do app (carinha na tela inicial) por rede, escolhido na aba Aplicativo.
alter table redes add column if not exists app_icone_url text;
