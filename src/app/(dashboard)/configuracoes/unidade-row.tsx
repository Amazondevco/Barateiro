"use client";

import { useState } from "react";
import { Power, Store, Warehouse, Building2, MapPin, type LucideIcon } from "lucide-react";
import { TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LeadCell } from "@/components/ui/icon-chip";
import { Tooltip, iconBtnClass } from "@/components/ui/tooltip";
import { EditUnidadeButton } from "@/app/(dashboard)/clientes/[id]/edit-unidade-button";
import { setUnidadeStatus } from "@/app/(dashboard)/clientes/[id]/unidade-actions";

const TIPO_LABEL: Record<string, string> = {
  loja: "Loja",
  cd: "CD / Galpão",
  escritorio: "Escritório / Sede",
  outro: "Outro",
};

const TIPO_ICON: Record<string, LucideIcon> = {
  loja: Store,
  cd: Warehouse,
  escritorio: Building2,
  outro: MapPin,
};

type U = {
  id: string;
  nome: string;
  codigo: string | null;
  tipo: string;
  cidade: string | null;
  uf: string | null;
  status: string;
  endereco: string | null;
  cep: string | null;
  bairro: string | null;
  numero: string | null;
  complemento: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
};

// Linha de unidade: a LINHA INTEIRA abre a edição (além do lápis). O toggle de
// status fica isolado (não dispara a edição ao clicar).
export function UnidadeRow({ unidade, redeId }: { unidade: U; redeId: string }) {
  const [open, setOpen] = useState(false);
  const ativo = unidade.status === "ativo";

  return (
    <TR
      onClick={() => setOpen(true)}
      className="cursor-pointer transition-colors hover:bg-muted/40"
    >
      <TD>
        <LeadCell
          icon={TIPO_ICON[unidade.tipo] ?? Store}
          seed={unidade.nome}
          title={unidade.nome}
          subtitle={unidade.codigo ? `#${unidade.codigo}` : undefined}
        />
      </TD>
      <TD>{TIPO_LABEL[unidade.tipo] ?? unidade.tipo}</TD>
      <TD>
        {unidade.cidade ? `${unidade.cidade}${unidade.uf ? "/" + unidade.uf : ""}` : "—"}
      </TD>
      <TD>
        <Badge tone={ativo ? "success" : "neutral"}>{unidade.status}</Badge>
      </TD>
      <TD onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <EditUnidadeButton
            unidade={unidade}
            redeId={redeId}
            open={open}
            onOpenChange={setOpen}
          />
          <Tooltip label={ativo ? "Desativar" : "Ativar"}>
            <form action={setUnidadeStatus.bind(null, unidade.id, redeId, ativo ? "inativo" : "ativo")}>
              <button className={iconBtnClass} type="submit">
                <Power className="h-4 w-4" />
              </button>
            </form>
          </Tooltip>
        </div>
      </TD>
    </TR>
  );
}
