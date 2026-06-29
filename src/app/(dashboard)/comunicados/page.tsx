import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { ComunicadoComposer } from "./composer";

export const metadata = { title: "Comunicados — Check.AI" };

const ALVO_LABEL: Record<string, string> = {
  todos: "Todos da rede",
  usuario: "Usuário(s)",
  unidade: "Unidade(s)",
  departamento: "Departamento(s)",
  cargo: "Cargo(s)",
};

export default async function ComunicadosPage() {
  const { profile, rede } = await getSessionContext();
  if (
    profile?.papel !== "super_admin" &&
    profile?.papel !== "admin_supermercado"
  ) {
    redirect("/");
  }
  const isSuper = profile.papel === "super_admin";

  const supabase = await createClient();

  let redes: { id: string; nome: string }[] = [];
  if (isSuper) {
    const { data } = await supabase
      .from("redes")
      .select("id, nome")
      .order("nome");
    redes = (data ?? []) as { id: string; nome: string }[];
  }
  const redeFixa =
    !isSuper && profile.rede_id
      ? { id: profile.rede_id, nome: rede?.nome ?? "Minha rede" }
      : null;

  const { data: historicoRaw } = await supabase
    .from("comunicados")
    .select("id, titulo, corpo, alvo_tipo, alvo_ids, created_at, redes(nome)")
    .order("created_at", { ascending: false })
    .limit(30);

  type Item = {
    id: string;
    titulo: string;
    corpo: string;
    alvo_tipo: string;
    alvo_ids: string[];
    created_at: string;
    redes: { nome: string } | null;
  };
  const historico = (historicoRaw ?? []) as unknown as Item[];

  return (
    <div className="space-y-5">
      <PageHeader title="Comunicados" crumb="Comunicados" />
      <p className="text-sm text-muted-foreground">
        Envie avisos para o app dos operadores — para todos da rede ou para
        usuários, unidades, departamentos e cargos específicos.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <ComunicadoComposer
          isSuper={isSuper}
          redes={redes}
          redeFixa={redeFixa}
        />

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Enviados recentemente
          </h2>
          {historico.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-8 text-center">
              <Megaphone className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhum comunicado enviado ainda.
              </p>
            </div>
          ) : (
            historico.map((c) => (
              <article
                key={c.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{c.titulo}</p>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {ALVO_LABEL[c.alvo_tipo] ?? c.alvo_tipo}
                    {c.alvo_tipo !== "todos" && c.alvo_ids?.length
                      ? ` · ${c.alvo_ids.length}`
                      : ""}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {c.corpo}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {isSuper && c.redes?.nome ? `${c.redes.nome} · ` : ""}
                  {new Date(c.created_at).toLocaleString("pt-BR")}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
