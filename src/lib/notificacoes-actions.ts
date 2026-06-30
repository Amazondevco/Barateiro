"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

export type Notificacao = {
  id: string;
  titulo: string;
  subtitulo: string;
  href: string;
  quando: string; // ISO
};

// Notificações do painel (v1): respostas de formulário ainda NÃO lidas pelo
// admin, na rede do usuário. Abrir a resposta marca como lida (some daqui).
export async function getNotificacoes(): Promise<{
  itens: Notificacao[];
  total: number;
}> {
  const caller = await getSessionProfile();
  if (!caller?.rede_id) return { itens: [], total: 0 };

  const supabase = await createClient();
  const { data, count } = await supabase
    .from("respostas")
    .select(
      "id, enviado_em, formulario_id, formularios!inner(nome, rede_id), unidades(nome)",
      { count: "exact" },
    )
    .eq("formularios.rede_id", caller.rede_id)
    .is("lida_em", null)
    .order("enviado_em", { ascending: false })
    .limit(12);

  const itens: Notificacao[] = (data ?? []).map((r) => {
    const form = r.formularios as unknown as { nome: string } | null;
    const uni = r.unidades as unknown as { nome: string } | null;
    return {
      id: String(r.id),
      titulo: "Nova resposta",
      subtitulo: `${form?.nome ?? "Formulário"}${uni?.nome ? ` · ${uni.nome}` : ""}`,
      href: `/formularios/${r.formulario_id}?tab=respostas`,
      quando: String(r.enviado_em),
    };
  });

  return { itens, total: count ?? itens.length };
}
