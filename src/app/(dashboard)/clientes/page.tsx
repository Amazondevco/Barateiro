import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD, EmptyState } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Clientes (Redes) — Check.AI" };

type RedeRow = {
  id: string;
  nome: string;
  cnpj: string | null;
  plano: string;
  status: "ativo" | "inativo";
  cor_primaria: string | null;
  unidades: { count: number }[];
  profiles: { count: number }[];
};

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("redes")
    .select(
      "id,nome,cnpj,plano,status,cor_primaria,unidades(count),profiles(count)",
    )
    .order("created_at", { ascending: false });

  const redes = (data ?? []) as RedeRow[];

  return (
    <>
      <PageHeader
        title="Clientes (Redes)"
        subtitle="Supermercados-clientes da plataforma."
        action={
          <Link href="/clientes/nova">
            <Button size="lg" className="font-semibold">
              <Plus className="h-4 w-4" /> Nova rede
            </Button>
          </Link>
        }
      />

      {redes.length === 0 ? (
        <EmptyState
          title="Nenhuma rede ainda"
          description="Cadastre o primeiro supermercado-cliente para começar."
          action={
            <Link href="/clientes/nova">
              <Button size="lg" className="font-semibold">
                <Plus className="h-4 w-4" /> Nova rede
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Rede</TH>
              <TH>Plano</TH>
              <TH>Unidades</TH>
              <TH>Usuários</TH>
              <TH>Status</TH>
              <TH className="w-10" />
            </TR>
          </THead>
          <tbody>
            {redes.map((r) => (
              <TR key={r.id} className="hover:bg-muted/40">
                <TD>
                  <Link
                    href={`/clientes/${r.id}`}
                    className="flex items-center gap-3"
                  >
                    <span
                      className="h-8 w-8 shrink-0 rounded-lg"
                      style={{ background: r.cor_primaria ?? "#2563eb" }}
                    />
                    <span>
                      <span className="block font-medium">{r.nome}</span>
                      {r.cnpj && (
                        <span className="block text-xs text-muted-foreground">
                          {r.cnpj}
                        </span>
                      )}
                    </span>
                  </Link>
                </TD>
                <TD className="capitalize">{r.plano}</TD>
                <TD>{r.unidades?.[0]?.count ?? 0}</TD>
                <TD>{r.profiles?.[0]?.count ?? 0}</TD>
                <TD>
                  <Badge tone={r.status === "ativo" ? "success" : "neutral"}>
                    {r.status}
                  </Badge>
                </TD>
                <TD>
                  <Link href={`/clientes/${r.id}`}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
