"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useActionToast } from "@/components/toast";
import type { RosterState } from "./roster-actions";

type Opt = { id: string; nome: string };

function maskCPF(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function AddRosterForm({
  action,
  unidades,
  cargos,
  departamentos,
}: {
  action: (prev: RosterState, fd: FormData) => Promise<RosterState>;
  unidades: Opt[];
  cargos: Opt[];
  departamentos: Opt[];
}) {
  const [open, setOpen] = useState(false);
  const [cpf, setCpf] = useState("");
  const [state, formAction, pending] = useActionState(action, {});
  useActionToast(state, { success: "Pessoa adicionada à equipe." });

  if (state.ok && open) {
    setOpen(false);
    setCpf("");
  }

  return (
    <>
      <Button size="lg" className="font-semibold" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Adicionar pessoa
      </Button>

      {open && (
        <Modal title="Adicionar à equipe do app" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" name="nome" placeholder="Nome da pessoa" required />
            </div>
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                name="cpf"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                A pessoa entra automaticamente ao se cadastrar no app com este CPF.
              </p>
            </div>
            <div>
              <Label htmlFor="cargo_id">Cargo (permissão)</Label>
              <Select id="cargo_id" name="cargo_id" defaultValue="">
                <option value="">Sem cargo</option>
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="unidade_id">Unidade</Label>
              <Select id="unidade_id" name="unidade_id" defaultValue="">
                <option value="">Sem unidade</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="departamento_id">Departamento</Label>
              <Select id="departamento_id" name="departamento_id" defaultValue="">
                <option value="">Sem departamento</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </Select>
            </div>

            {state.error && (
              <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
                {state.error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Adicionando…" : "Adicionar"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
