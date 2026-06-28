"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { FormState } from "@/app/(dashboard)/usuarios/actions";

type RedeOpt = { id: string; nome: string };
type UnidadeOpt = { id: string; nome: string };

export function AddUsuarioForm({
  action,
  redeId,
  redes,
  unidades = [],
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  redeId?: string; // modo "rede"
  redes?: RedeOpt[]; // modo "global"
  unidades?: UnidadeOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [papel, setPapel] = useState<string>(redeId ? "gerente" : "gerente");
  const [state, formAction, pending] = useActionState(action, {});

  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Novo usuário
      </Button>
    );
  }

  const isSuperOption = !redeId; // só no modo global dá pra criar super_admin

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <h3 className="font-semibold">Novo usuário</h3>

          {redeId && <input type="hidden" name="rede_id" value={redeId} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="us_nome">Nome *</Label>
              <Input id="us_nome" name="nome" required />
            </div>
            <div>
              <Label htmlFor="us_email">E-mail *</Label>
              <Input id="us_email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="us_senha">Senha provisória *</Label>
              <Input id="us_senha" name="senha" type="text" minLength={6} required />
            </div>
            <div>
              <Label htmlFor="us_papel">Papel</Label>
              <Select
                id="us_papel"
                name="papel"
                value={papel}
                onChange={(e) => setPapel(e.target.value)}
              >
                {isSuperOption && <option value="super_admin">Super Admin</option>}
                <option value="admin_supermercado">Admin do supermercado</option>
                <option value="gerente">Gerente</option>
              </Select>
            </div>

            {!redeId && papel !== "super_admin" && (
              <div className="sm:col-span-2">
                <Label htmlFor="us_rede">Rede</Label>
                <Select id="us_rede" name="rede_id" defaultValue="">
                  <option value="" disabled>
                    Selecione a rede
                  </option>
                  {redes?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {redeId && papel === "gerente" && unidades.length > 0 && (
            <div>
              <Label>Unidades sob responsabilidade</Label>
              <div className="flex flex-wrap gap-2">
                {unidades.map((u) => (
                  <label
                    key={u.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                  >
                    <input
                      type="checkbox"
                      name="unidade_ids"
                      value={u.id}
                      className="accent-[var(--primary)]"
                    />
                    {u.nome}
                  </label>
                ))}
              </div>
            </div>
          )}

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
              {pending ? "Criando…" : "Criar usuário"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
