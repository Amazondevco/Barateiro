"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { FormState } from "./unidade-actions";

export function AddUnidadeForm({
  action,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});

  if (state.ok && open) setOpen(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nova unidade
      </Button>
    );
  }

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <h3 className="font-semibold">Nova unidade</h3>
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
            <div className="sm:col-span-2">
              <Label htmlFor="u_endereco">Endereço</Label>
              <Input id="u_endereco" name="endereco" />
            </div>
            <div>
              <Label htmlFor="u_cidade">Cidade</Label>
              <Input id="u_cidade" name="cidade" />
            </div>
            <div>
              <Label htmlFor="u_uf">UF</Label>
              <Input id="u_uf" name="uf" maxLength={2} />
            </div>
            <div>
              <Label htmlFor="u_lat">Latitude (GPS)</Label>
              <Input id="u_lat" name="geo_lat" placeholder="-23.55" />
            </div>
            <div>
              <Label htmlFor="u_lng">Longitude (GPS)</Label>
              <Input id="u_lng" name="geo_lng" placeholder="-46.63" />
            </div>
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
      </CardContent>
    </Card>
  );
}
