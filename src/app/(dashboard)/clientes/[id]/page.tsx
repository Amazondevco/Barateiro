import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Power } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD, EmptyState } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { PAPEL_LABEL, type Papel } from "@/lib/types";
import { RedeForm } from "../rede-form";
import { updateRede, setRedeStatus } from "../actions";
import { createUnidade, setUnidadeStatus } from "./unidade-actions";
import { AddUnidadeForm } from "./add-unidade-form";
import { AddUsuarioForm } from "@/components/add-usuario-form";
import { createUsuario } from "../../usuarios/actions";
import { ConviteResponsavelButton } from "./convite-button";

const TABS = [
  { key: "dados", label: "Dados" },
  { key: "unidades", label: "Unidades" },
  { key: "usuarios", label: "Usuários" },
];

const TIPO_LABEL: Record<string, string> = {
  loja: "Loja",
  cd: "CD / Galpão",
  escritorio: "Escritório",
  outro: "Outro",
};

export default async function RedeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const tab = (await searchParams).tab ?? "dados";
  const supabase = await createClient();

  const { data: rede } = await supabase
    .from("redes")
    .select("*")
    .eq("id", id)
    .single();

  if (!rede) notFound();

  const [{ data: unidades }, { data: usuarios }, { data: departamentos }] =
    await Promise.all([
      supabase
        .from("unidades")
        .select("id,nome,codigo,tipo,cidade,uf,status")
        .eq("rede_id", id)
        .order("nome"),
      supabase
        .from("profiles")
        .select("id,nome,email,papel,status")
        .eq("rede_id", id)
        .order("nome"),
      supabase
        .from("departamentos")
        .select("id,nome")
        .eq("rede_id", id)
        .eq("status", "ativo")
        .order("nome"),
    ]);

  const unidadeOpts = (unidades ?? []).map((u) => ({ id: u.id, nome: u.nome }));
  const deptoOpts = (departamentos ?? []).map((d) => ({ id: d.id, nome: d.nome }));

  return (
    <>
      <Link
        href="/clientes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Clientes
      </Link>

      <PageHeader
        title={rede.nome}
        subtitle={rede.cnpj ?? "Sem CNPJ"}
        action={
          <div className="flex items-center gap-3">
            <Badge tone={rede.status === "ativo" ? "success" : "neutral"}>
              {rede.status}
            </Badge>
            <form
              action={setRedeStatus.bind(
                null,
                id,
                rede.status === "ativo" ? "inativo" : "ativo",
              )}
            >
              <Button variant="outline" size="sm" type="submit">
                <Power className="h-4 w-4" />
                {rede.status === "ativo" ? "Desativar" : "Ativar"}
              </Button>
            </form>
          </div>
        }
      />

      {/* Abas */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/clientes/${id}?tab=${t.key}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Conteúdo */}
      {tab === "dados" && (
        <div className="max-w-3xl">
          <RedeForm action={updateRede.bind(null, id)} rede={rede} />
        </div>
      )}

      {tab === "unidades" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <AddUnidadeForm action={createUnidade.bind(null, id)} />
          </div>
          {(unidades ?? []).length === 0 ? (
            <EmptyState
              title="Nenhuma unidade"
              description="Adicione lojas, CDs ou escritórios desta rede."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Unidade</TH>
                  <TH>Tipo</TH>
                  <TH>Cidade</TH>
                  <TH>Status</TH>
                  <TH className="w-28" />
                </TR>
              </THead>
              <tbody>
                {(unidades ?? []).map((u) => (
                  <TR key={u.id}>
                    <TD>
                      <span className="font-medium">{u.nome}</span>
                      {u.codigo && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          #{u.codigo}
                        </span>
                      )}
                    </TD>
                    <TD>{TIPO_LABEL[u.tipo] ?? u.tipo}</TD>
                    <TD>
                      {u.cidade ? `${u.cidade}${u.uf ? "/" + u.uf : ""}` : "—"}
                    </TD>
                    <TD>
                      <Badge tone={u.status === "ativo" ? "success" : "neutral"}>
                        {u.status}
                      </Badge>
                    </TD>
                    <TD>
                      <form
                        action={setUnidadeStatus.bind(
                          null,
                          u.id,
                          id,
                          u.status === "ativo" ? "inativo" : "ativo",
                        )}
                      >
                        <Button variant="ghost" size="sm" type="submit">
                          {u.status === "ativo" ? "Desativar" : "Ativar"}
                        </Button>
                      </form>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      )}

      {tab === "usuarios" && (
        <div className="space-y-4">
          <ConviteResponsavelButton
            redeId={id}
            email={rede.contato_email}
            linkInicial={(rede as { convite_link?: string | null }).convite_link ?? null}
          />
          <div className="flex items-center justify-end gap-3">
            <AddUsuarioForm
              action={createUsuario}
              redeId={id}
              unidades={unidadeOpts}
              departamentos={deptoOpts}
            />
          </div>
          {(usuarios ?? []).length === 0 ? (
            <EmptyState
              title="Nenhum usuário"
              description="Crie o admin do supermercado e os gerentes desta rede."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Nome</TH>
                  <TH>E-mail</TH>
                  <TH>Papel</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <tbody>
                {(usuarios ?? []).map((u) => (
                  <TR key={u.id}>
                    <TD className="font-medium">{u.nome || "—"}</TD>
                    <TD>{u.email}</TD>
                    <TD>{PAPEL_LABEL[u.papel as Papel]}</TD>
                    <TD>
                      <Badge tone={u.status === "ativo" ? "success" : "neutral"}>
                        {u.status}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      )}
    </>
  );
}
