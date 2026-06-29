-- ============================================================
-- Assinatura eletrônica adotada no vínculo com a rede.
-- Fica em rede_membros → dentro da rede (super_admin murado).
-- Adotada uma vez (desenhada 2x p/ confirmar) + ciência do titular;
-- depois é carimbada com 1 toque em cada checklist.
-- ============================================================
alter table rede_membros
  add column if not exists assinatura_svg          text,        -- assinatura adotada (dataURL/SVG)
  add column if not exists assinatura_consentimento boolean not null default false,
  add column if not exists assinatura_aceite_em     timestamptz;
