import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ClipboardList, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Rede — Barateiro" };

export default async function AppRedePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: membro } = await supabase
    .from("rede_membros")
    .select("rede_id, status, papel, assinatura_svg, redes(nome)")
    .eq("id", id)
    .single();
  if (!membro) notFound();
  const m = membro as unknown as {
    rede_id: string;
    status: string;
    assinatura_svg: string | null;
    redes: { nome: string } | null;
  };

  // 1º acesso: ainda não adotou a assinatura → adota antes dos formulários.
  if (!m.assinatura_svg) redirect(`/app/rede/${id}/assinar`);

  const { data: forms } = await supabase
    .from("formularios")
    .select("id, nome, descricao, formulario_secoes(count)")
    .eq("rede_id", m.rede_id)
    .eq("status", "ativo")
    .order("nome");

  type Form = {
    id: string;
    nome: string;
    descricao: string | null;
    formulario_secoes: { count: number }[];
  };
  const lista = (forms ?? []) as Form[];

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <Link href="/app" className="text-muted-foreground hover:text-foreground" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-sm font-semibold leading-tight">{m.redes?.nome}</p>
          <p className="text-xs text-muted-foreground">Seus formulários</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 p-4">
        {lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Nenhum formulário disponível</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Quando o gestor liberar checklists para o seu acesso, eles aparecem aqui.
            </p>
          </div>
        ) : (
          lista.map((f) => (
            <Link
              key={f.id}
              href={`/app/rede/${id}/form/${f.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{f.nome}</p>
                {f.descricao && (
                  <p className="truncate text-xs text-muted-foreground">{f.descricao}</p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
