import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD, EmptyState } from "@/components/ui/table";
import { LeadCell } from "@/components/ui/icon-chip";
import { AddUsuarioForm } from "@/components/add-usuario-form";
import { EditUsuarioButton } from "@/components/edit-usuario-button";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { PAPEL_LABEL, type Papel } from "@/lib/types";
import { createUsuario } from "./actions";

export const metadata = { title: "Usuários — Check.AI" };

type Row = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  status: "ativo" | "inativo";
  rede_id: string | null;
  departamento_id: string | null;
  redes: { nome: string } | null;
  departamentos: { nome: string } | null;
};

export default async function UsuariosPage() {
  const profile = await getSessionProfile();
  const isSuper = profile?.papel === "super_admin";
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select(
      "id,nome,email,papel,status,rede_id,departamento_id,redes(nome),departamentos(nome)",
    )
    .order("nome");
  const usuarios = (data ?? []) as unknown as Row[];

  // Opções para os formulários
  const { data: redes } = isSuper
    ? await supabase.from("redes").select("id,nome").order("nome")
    : { data: null };

  const unidadeOpts =
    !isSuper && profile?.rede_id
      ? (
          await supabase
            .from("unidades")
            .select("id,nome")
            .eq("rede_id", profile.rede_id)
            .order("nome")
        ).data ?? []
      : [];

  const deptoOpts =
    !isSuper && profile?.rede_id
      ? (
          await supabase
            .from("departamentos")
            .select("id,nome")
            .eq("rede_id", profile.rede_id)
            .eq("status", "ativo")
            .order("nome")
        ).data ?? []
      : [];

  return (
    <>
      <PageHeader
        title="Usuários"
        subtitle={
          isSuper ? "Todos os usuários da plataforma." : "Usuários da sua rede."
        }
        action={
          <AddUsuarioForm
            action={createUsuario}
            redeId={isSuper ? undefined : (profile?.rede_id ?? undefined)}
            redes={redes ?? undefined}
            unidades={unidadeOpts}
            departamentos={deptoOpts}
          />
        }
      />

      {usuarios.length === 0 ? (
        <EmptyState
          title="Nenhum usuário"
          description="Crie o primeiro usuário usando o botão acima."
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Nome</TH>
              <TH>E-mail</TH>
              <TH>Papel</TH>
              {isSuper ? <TH>Rede</TH> : <TH>Departamento</TH>}
              <TH>Status</TH>
              {!isSuper && <TH className="w-20" />}
            </TR>
          </THead>
          <tbody>
            {usuarios.map((u) => (
              <TR key={u.id}>
                <TD>
                  <LeadCell
                    text={u.nome || u.email}
                    seed={u.nome || u.email}
                    title={u.nome || "—"}
                  />
                </TD>
                <TD>{u.email}</TD>
                <TD>{PAPEL_LABEL[u.papel]}</TD>
                {isSuper ? (
                  <TD>{u.redes?.nome ?? "—"}</TD>
                ) : (
                  <TD>{u.departamentos?.nome ?? "—"}</TD>
                )}
                <TD>
                  <Badge tone={u.status === "ativo" ? "success" : "neutral"}>
                    {u.status}
                  </Badge>
                </TD>
                {!isSuper && (
                  <TD>
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
                  </TD>
                )}
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
