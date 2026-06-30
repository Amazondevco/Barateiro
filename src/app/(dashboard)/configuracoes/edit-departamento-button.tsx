"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Tooltip, iconBtnClass } from "@/components/ui/tooltip";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useActionToast } from "@/components/toast";
import { updateDepartamento } from "./departamento-actions";

type D = {
  id: string;
  nome: string;
  escopo: string;
  unidade_id: string | null;
};

export function EditDepartamentoButton({
  departamento,
  unidades,
}: {
  departamento: D;
  unidades: { id: string; nome: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [escopo, setEscopo] = useState(departamento.escopo);
  const [state, formAction, pending] = useActionState(
    updateDepartamento.bind(null, departamento.id),
    {},
  );
  useActionToast(state, { success: "Departamento atualizado." });
  if (state.ok && open) setOpen(false);

  return (
    <>
      <Tooltip label="Editar">
        <button onClick={() => setOpen(true)} className={iconBtnClass}>
          <Pencil className="h-4 w-4" />
        </button>
      </Tooltip>
      {open && (
        <Modal title="Editar departamento" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="ed_nome">Nome *</Label>
              <Input id="ed_nome" name="nome" defaultValue={departamento.nome} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ed_escopo">Escopo</Label>
                <Select
                  id="ed_escopo"
                  name="escopo"
                  value={escopo}
                  onChange={(e) => setEscopo(e.target.value)}
                >
                  <option value="unidade">De uma unidade</option>
                  <option value="rede">Geral da rede</option>
                </Select>
              </div>
              {escopo === "unidade" && (
                <div>
                  <Label htmlFor="ed_unidade">Unidade</Label>
                  <Select
                    id="ed_unidade"
                    name="unidade_id"
                    defaultValue={departamento.unidade_id ?? ""}
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
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
