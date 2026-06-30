"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useActionToast } from "@/components/toast";
import type { FormState } from "./departamento-actions";

type UnidadeOpt = { id: string; nome: string };

export function AddDepartamentoForm({
  action,
  unidades,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  unidades: UnidadeOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [escopo, setEscopo] = useState("unidade");
  const [state, formAction, pending] = useActionState(action, {});
  useActionToast(state, { success: "Departamento criado." });

  if (state.ok && open) setOpen(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Novo departamento
      </Button>

      {open && (
        <Modal title="Novo departamento" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="d_nome">Nome *</Label>
              <Input
                id="d_nome"
                name="nome"
                placeholder="Ex.: Açougue, RH, Compras"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="d_escopo">Escopo</Label>
                <Select
                  id="d_escopo"
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
                  <Label htmlFor="d_unidade">Unidade</Label>
                  <Select id="d_unidade" name="unidade_id" defaultValue="">
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Adicionar"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
