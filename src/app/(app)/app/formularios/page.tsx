import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormulariosTabs, type EnviadoItem } from "./pending-enviados";

export const metadata = { title: "Checklists enviados — Check.AI" };

export default async function EnviadosPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const sub = (claims?.claims as { sub?: string } | undefined)?.sub;
  if (!sub) redirect("/login");

  const { data: respostas } = await supabase
    .from("respostas")
    .select("id, enviado_em, total_itens, total_nao, formularios(nome), unidades(nome)")
    .eq("usuario_id", sub)
    .order("enviado_em", { ascending: false })
    .limit(100);

  type R = {
    id: string;
    enviado_em: string;
    total_itens: number;
    total_nao: number;
    formularios: { nome: string } | null;
    unidades: { nome: string } | null;
  };
  const lista = (respostas ?? []) as unknown as R[];

  const enviados: EnviadoItem[] = lista.map((r) => ({
    id: r.id,
    formNome: r.formularios?.nome ?? "Checklist",
    data: new Date(r.enviado_em).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    unidade: r.unidades?.nome ?? null,
    totalNao: r.total_nao,
  }));

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <header className="mb-6 mt-2">
        <h1 className="text-2xl font-bold tracking-tight">Checklists</h1>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground">
          Seus envios e o que ainda está na fila.
        </p>
      </header>

      <FormulariosTabs enviados={enviados} />
    </div>
  );
}
