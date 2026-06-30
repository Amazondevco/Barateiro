-- Leitura de respostas pelo admin: registra quando/quem leu, para mostrar o
-- badge "Lido pelo admin" no painel e marcar "não lidas" na listagem.

alter table respostas add column if not exists lida_em timestamptz;
alter table respostas add column if not exists lida_por uuid;

-- Marca a resposta como lida (idempotente: mantém o primeiro leitor).
-- Só usuários do painel (profiles) marcam — operadores do app são identidades.
create or replace function marcar_resposta_lida(p_resposta uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_em timestamptz;
begin
  if not exists (select 1 from profiles where id = auth.uid()) then
    return null;
  end if;

  update respostas
     set lida_em = coalesce(lida_em, now()),
         lida_por = coalesce(lida_por, auth.uid())
   where id = p_resposta
  returning lida_em into v_em;

  return v_em;
end;
$$;

grant execute on function marcar_resposta_lida(uuid) to authenticated;
