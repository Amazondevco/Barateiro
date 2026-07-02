import { redirect } from "next/navigation";
import { Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { PAPEL_LABEL, type Papel } from "@/lib/types";
import { AddUsuarioForm } from "@/components/add-usuario-form";
import { EditUsuarioButton } from "@/components/edit-usuario-button";
import { createUsuario, setUsuarioStatus } from "@/app/(dashboard)/usuarios/actions";
import { AdminSubHeader } from "../../../ui";

export const metadata = { title: "Usuários do sistema — Check.AI" };

type Row = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  status: string;
  departamento_id: string | null;
  departamentos: { nome: string } | null;
};

export default async function AdminUsuariosSistemaPage() {
  const profile = await getSessionProfile();
  const redeId = profile?.rede_id;
  if (!redeId) redirect("/");

  const supabase = await createClient();
  const [{ data }, { data: unidades }, { data: deptos }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,nome,email,papel,status,departamento_id,departamentos(nome)")
      .eq("rede_id", redeId)
      .order("nome"),
    supabase.from("unidades").select("id,nome").eq("rede_id", redeId).order("nome"),
    supabase
      .from("departamentos")
      .select("id,nome")
      .eq("rede_id", redeId)
      .eq("status", "ativo")
      .order("nome"),
  ]);

  const usuarios = (data ?? []) as unknown as Row[];
  const deptoOpts = (deptos ?? []).map((d) => ({ id: d.id, nome: d.nome }));
  const unidadeOpts = (unidades ?? []).map((u) => ({ id: u.id, nome: u.nome }));

  return (
    <div>
      <AdminSubHeader title="Usuários do sistema" back="/app/admin/gestao/usuarios">
        <AddUsuarioForm
          action={createUsuario}
          redeId={redeId}
          unidades={unidadeOpts}
          departamentos={deptoOpts}
        />
      </AdminSubHeader>

      <div className="space-y-3 p-4">
        {usuarios.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Monitor className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              Nenhum usuário do sistema. Crie o admin e os gerentes da sua rede.
            </p>
          </div>
        ) : (
          usuarios.map((u) => (
            <div
              key={u.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold">
                    {u.nome || "—"}
                  </p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {u.email}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {PAPEL_LABEL[u.papel as Papel]}
                    {u.departamentos?.nome ? ` · ${u.departamentos.nome}` : ""}
                  </p>
                </div>
                <Badge tone={u.status === "ativo" ? "success" : "neutral"}>
                  {u.status}
                </Badge>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
                <EditUsuarioButton
                  usuario={{
                    id: u.id,
                    nome: u.nome,
                    email: u.email,
                    papel: u.papel,
                    status: u.status,
                    departamento_id: u.departamento_id,
                  }}
                  departamentos={deptoOpts}
                />
                <form
                  action={setUsuarioStatus.bind(
                    null,
                    u.id,
                    u.status === "ativo" ? "inativo" : "ativo",
                    redeId,
                  )}
                >
                  <Button variant="ghost" size="sm" type="submit">
                    {u.status === "ativo" ? "Desativar" : "Ativar"}
                  </Button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
