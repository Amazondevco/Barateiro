"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EnderecoFields } from "./endereco-fields";
import type { FormState } from "./unidade-actions";

export function AddUnidadeForm({
  action,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});

  if (state.ok && open) setOpen(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nova unidade
      </Button>

      {open && (
        <Modal title="Nova unidade" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="u_nome">Nome *</Label>
                <Input id="u_nome" name="nome" required />
              </div>
              <div>
                <Label htmlFor="u_codigo">Código</Label>
                <Input id="u_codigo" name="codigo" />
              </div>
              <div>
                <Label htmlFor="u_tipo">Tipo</Label>
                <Select id="u_tipo" name="tipo" defaultValue="loja">
                  <option value="loja">Loja</option>
                  <option value="cd">CD / Galpão</option>
                  <option value="escritorio">Escritório / Sede</option>
                  <option value="outro">Outro</option>
                </Select>
              </div>
              <EnderecoFields />
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
