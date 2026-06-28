"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateUnidade } from "./unidade-actions";

type U = {
  id: string;
  nome: string;
  codigo: string | null;
  tipo: string;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
};

export function EditUnidadeButton({
  unidade,
  redeId,
}: {
  unidade: U;
  redeId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateUnidade.bind(null, unidade.id, redeId),
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
              <div className="sm:col-span-2">
                <Label htmlFor="eu_endereco">Endereço</Label>
                <Input id="eu_endereco" name="endereco" defaultValue={unidade.endereco ?? ""} />
              </div>
              <div>
                <Label htmlFor="eu_cidade">Cidade</Label>
                <Input id="eu_cidade" name="cidade" defaultValue={unidade.cidade ?? ""} />
              </div>
              <div>
                <Label htmlFor="eu_uf">UF</Label>
                <Input id="eu_uf" name="uf" maxLength={2} defaultValue={unidade.uf ?? ""} />
              </div>
              <div>
                <Label htmlFor="eu_lat">Latitude (GPS)</Label>
                <Input id="eu_lat" name="geo_lat" defaultValue={unidade.geo_lat ?? ""} />
              </div>
              <div>
                <Label htmlFor="eu_lng">Longitude (GPS)</Label>
                <Input id="eu_lng" name="geo_lng" defaultValue={unidade.geo_lng ?? ""} />
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
