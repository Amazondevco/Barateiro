"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { FormState } from "./actions";
import type { Rede } from "@/lib/types";
import { TipoNegocioField, LogoUploader } from "./rede-form-fields";

const DIAS = [
  { v: 1, l: "Seg" },
  { v: 2, l: "Ter" },
  { v: 3, l: "Qua" },
  { v: 4, l: "Qui" },
  { v: 5, l: "Sex" },
  { v: 6, l: "Sáb" },
  { v: 7, l: "Dom" },
];

export function RedeForm({
  action,
  rede,
  submitLabel = "Salvar",
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  rede?: Partial<Rede>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const dias = rede?.dias_frequencia ?? [1, 3, 5, 6];

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold">Dados da rede</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" name="nome" defaultValue={rede?.nome ?? ""} required />
            </div>
            <div className="sm:col-span-2">
              <Label>Tipo de negócio *</Label>
              <TipoNegocioField defaultValue={rede?.tipo_negocio} />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" name="cnpj" defaultValue={rede?.cnpj ?? ""} />
            </div>
            <div>
              <Label htmlFor="plano">Plano</Label>
              <Select id="plano" name="plano" defaultValue={rede?.plano ?? "free"}>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold">Identidade (white-label)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <LogoUploader defaultUrl={rede?.logo_url} />
            </div>
            <div>
              <Label htmlFor="cor_primaria">Cor primária</Label>
              <div className="flex items-center gap-2">
                <input
                  id="cor_primaria"
                  name="cor_primaria"
                  type="color"
                  defaultValue={rede?.cor_primaria ?? "#2563eb"}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-input bg-card"
                />
                <span className="text-sm text-muted-foreground">
                  Aparece no tema do cliente
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold">Contato</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="contato_nome">Nome</Label>
              <Input id="contato_nome" name="contato_nome" defaultValue={rede?.contato_nome ?? ""} />
            </div>
            <div>
              <Label htmlFor="contato_email">E-mail</Label>
              <Input id="contato_email" name="contato_email" type="email" defaultValue={rede?.contato_email ?? ""} />
            </div>
            <div>
              <Label htmlFor="contato_fone">Telefone</Label>
              <Input id="contato_fone" name="contato_fone" defaultValue={rede?.contato_fone ?? ""} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold">Regras operacionais do checklist</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="horario_limite">Horário limite</Label>
              <Input id="horario_limite" name="horario_limite" type="time" defaultValue={rede?.horario_limite ?? "10:00"} />
            </div>
            <div>
              <Label htmlFor="janela_edicao_min">Janela de edição (min)</Label>
              <Input id="janela_edicao_min" name="janela_edicao_min" type="number" min={0} defaultValue={rede?.janela_edicao_min ?? 30} />
            </div>
            <div>
              <Label htmlFor="retencao_fotos_dias">Retenção de fotos (dias)</Label>
              <Input id="retencao_fotos_dias" name="retencao_fotos_dias" type="number" min={1} defaultValue={rede?.retencao_fotos_dias ?? 60} />
            </div>
          </div>
          <div>
            <Label>Dias da semana (obrigatórios)</Label>
            <div className="flex flex-wrap gap-2">
              {DIAS.map((d) => (
                <label
                  key={d.v}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                >
                  <input
                    type="checkbox"
                    name="dias_frequencia"
                    value={d.v}
                    defaultChecked={dias.includes(d.v)}
                    className="accent-[var(--primary)]"
                  />
                  {d.l}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {state.error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-success-bg px-3 py-2 text-sm text-success">
          Salvo com sucesso.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
