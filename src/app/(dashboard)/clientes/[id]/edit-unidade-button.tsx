"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Tooltip, iconBtnClass } from "@/components/ui/tooltip";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EnderecoFields } from "./endereco-fields";
import { useActionToast } from "@/components/toast";
import { updateUnidade } from "./unidade-actions";

type U = {
  id: string;
  nome: string;
  codigo: string | null;
  tipo: string;
  endereco: string | null;
  cep: string | null;
  bairro: string | null;
  numero: string | null;
  complemento: string | null;
  cidade: string | null;
  uf: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
};

export function EditUnidadeButton({
  unidade,
  redeId,
  open: openProp,
  onOpenChange,
  hideTrigger = false,
}: {
  unidade: U;
  redeId: string;
  // Modo controlado: a linha (clicável) abre/fecha o modal.
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [openLocal, setOpenLocal] = useState(false);
  const open = onOpenChange ? !!openProp : openLocal;
  const setOpen = onOpenChange ?? setOpenLocal;
  const [state, formAction, pending] = useActionState(
    updateUnidade.bind(null, unidade.id, redeId),
    {},
  );
  useActionToast(state, { success: "Unidade atualizada." });
  if (state.ok && open) setOpen(false);

  return (
    <>
      {!hideTrigger && (
        <Tooltip label="Editar">
          <button onClick={() => setOpen(true)} className={iconBtnClass}>
            <Pencil className="h-4 w-4" />
          </button>
        </Tooltip>
      )}
      {open && (
        <Modal title="Editar unidade" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="eu_nome">Nome *</Label>
                <Input id="eu_nome" name="nome" defaultValue={unidade.nome} required />
              </div>
              <div>
                <Label htmlFor="eu_codigo">Código</Label>
                <Input id="eu_codigo" name="codigo" defaultValue={unidade.codigo ?? ""} />
              </div>
              <div>
                <Label htmlFor="eu_tipo">Tipo</Label>
                <Select id="eu_tipo" name="tipo" defaultValue={unidade.tipo}>
                  <option value="loja">Loja</option>
                  <option value="cd">CD / Galpão</option>
                  <option value="escritorio">Escritório / Sede</option>
                  <option value="outro">Outro</option>
                </Select>
              </div>
              <EnderecoFields
                initial={{
                  cep: unidade.cep,
                  endereco: unidade.endereco,
                  bairro: unidade.bairro,
                  numero: unidade.numero,
                  complemento: unidade.complemento,
                  cidade: unidade.cidade,
                  uf: unidade.uf,
                  geo_lat: unidade.geo_lat,
                  geo_lng: unidade.geo_lng,
                }}
              />
            </div>

            {state.error && (
              <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
                {state.error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
