import { Mail, BellRing, CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Avisos — Check.AI" };

type Comunicado = {
  id: string;
  titulo: string;
  corpo: string;
  created_at: string;
};

export default async function AvisosPage() {
  // RLS de `comunicados_app_select` já restringe ao membro logado.
  const supabase = await createClient();
  const { data } = await supabase
    .from("comunicados")
    .select("id, titulo, corpo, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const avisos = (data ?? []) as Comunicado[];

  if (avisos.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="h-7 w-7" />
        </div>
        <p className="font-medium">Sem avisos por enquanto</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Comunicados e mensagens da sua rede vão aparecer aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 py-6">
      <header className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Avisos</h1>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground">
          Comunicados da sua rede.
        </p>
      </header>

      {avisos.map((aviso, i) => {
        const novo = i === 0;
        const data = new Date(aviso.created_at).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        return (
          <article
            key={aviso.id}
            className={`relative flex gap-4 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm ${
              novo ? "border-l-4 border-l-primary" : ""
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                novo
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {novo ? (
                <BellRing className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </span>
            <div className={`min-w-0 flex-1 ${novo ? "" : "opacity-80"}`}>
              <div className="mb-1 flex items-start justify-between gap-2">
                <h2 className="font-semibold leading-tight">{aviso.titulo}</h2>
                {novo && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Novo
                  </span>
                )}
              </div>
              <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {aviso.corpo}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {data}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
