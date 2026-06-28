"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateUsuario } from "@/app/(dashboard)/usuarios/actions";

type U = {
  id: string;
  nome: string;
  email: string;
  papel: string;
  status: string;
  departamento_id: string | null;
};

export function EditUsuarioButton({
  usuario,
  departamentos,
  podeSuper = false,
}: {
  usuario: U;
  departamentos: { id: string; nome: string }[];
  podeSuper?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateUsuario.bind(null, usuario.id),
    {},
  );
  if (state.ok && open) setOpen(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-primary hover:underline"
      >
        Editar
      </button>
      {open && (
        <Modal title="Editar usuário" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4">
            <div>
              <Label>E-mail</Label>
              <Input value={usuario.email} disabled />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="eus_nome">Nome *</Label>
                <Input id="eus_nome" name="nome" defaultValue={usuario.nome} required />
              </div>
              <div>
                <Label htmlFor="eus_papel">Papel</Label>
                <Select id="eus_papel" name="papel" defaultValue={usuario.papel}>
                  {podeSuper && <option value="super_admin">Super Admin</option>}
                  <option value="admin_supermercado">Admin do supermercado</option>
                  <option value="gerente">Gerente</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="eus_depto">Departamento *</Label>
                <Select
                  id="eus_depto"
                  name="departamento_id"
                  defaultValue={usuario.departamento_id ?? ""}
                  required
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {departamentos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="eus_status">Status</Label>
                <Select id="eus_status" name="status" defaultValue={usuario.status}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </Select>
              </div>
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
