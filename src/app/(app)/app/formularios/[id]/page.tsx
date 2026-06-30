import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Envio — Check.AI" };

const VALOR_LABEL: Record<string, string> = {
  ok: "OK",
  nao: "Não",
  sim: "Sim",
  abastecido: "Abastecido",
  ruptura: "Ruptura",
  na: "N/A",
};

export default async function EnvioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const sub = (claims?.claims as { sub?: string } | undefined)?.sub;
  if (!sub) redirect("/login");

  const { data: resp } = await supabase
    .from("respostas")
    .select("id, formulario_id, enviado_em, assinatura_svg, formularios(nome), unidades(nome)")
    .eq("id", id)
    .single();
  if (!resp) notFound();
  const r = resp as unknown as {
    formulario_id: string;
    enviado_em: string;
    assinatura_svg: string | null;
    formularios: { nome: string } | null;
    unidades: { nome: string } | null;
  };

  const [{ data: itensResp }, { data: secoes }] = await Promise.all([
    supabase.from("resposta_itens").select("item_id, valor, observacao, foto_url").eq("resposta_id", id),
    supabase
      .from("formulario_secoes")
      .select("id, titulo, ordem, formulario_itens(id, texto, ordem)")
      .eq("formulario_id", r.formulario_id)
      .order("ordem"),
  ]);

  type ItemResp = { item_id: string; valor: string | null; observacao: string | null; foto_url: string | null };
  const respMap = new Map(
    ((itensResp ?? []) as ItemResp[]).map((i) => [i.item_id, i]),
  );

  type Sec = { id: string; titulo: string; ordem: number; formulario_itens: { id: string; texto: string; ordem: number }[] };
  const secs = ((secoes ?? []) as Sec[]).map((s) => ({
    ...s,
    formulario_itens: [...s.formulario_itens].sort((a, b) => a.ordem - b.ordem),
  }));

  const data = new Date(r.enviado_em).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function fmt(v: string | null) {
    if (!v) return "—";
    return VALOR_LABEL[v.toLowerCase()] ?? v;
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <Link href="/app/formularios" className="text-muted-foreground hover:text-foreground" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{r.formularios?.nome ?? "Checklist"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {data}
            {r.unidades?.nome ? ` · ${r.unidades.nome}` : ""}
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-5 p-4">
        {secs.map((s) => (
          <div key={s.id} className="space-y-2">
            {s.titulo && <h2 className="text-sm font-semibold">{s.titulo}</h2>}
            {s.formulario_itens.map((it) => {
              const a = respMap.get(it.id);
              const neg = ["nao", "ruptura"].includes((a?.valor ?? "").toLowerCase());
              return (
                <div key={it.id} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-sm">{it.texto}</p>
                  <p className={`mt-1 text-sm font-medium ${neg ? "text-danger" : "text-foreground"}`}>
                    {fmt(a?.valor ?? null)}
                  </p>
                  {a?.observacao && (
                    <p className="mt-1 text-xs text-muted-foreground">Obs.: {a.observacao}</p>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {r.assinatura_svg && (
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-sm font-medium">Assinatura</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.assinatura_svg} alt="Assinatura" className="h-20 rounded border border-border bg-white object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}
