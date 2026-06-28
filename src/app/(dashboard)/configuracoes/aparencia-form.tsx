"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import type { FormState } from "./actions";

export function AparenciaForm({
  action,
  logoUrl,
  cor,
  nome,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  logoUrl: string | null;
  cor: string | null;
  nome: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [color, setColor] = useState(cor ?? "#2563eb");
  const [logo, setLogo] = useState(logoUrl ?? "");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardContent>
          <form action={formAction} className="space-y-4">
            <h3 className="font-semibold">Identidade da rede</h3>
            <div>
              <Label htmlFor="logo_url">URL do logo</Label>
              <Input
                id="logo_url"
                name="logo_url"
                placeholder="https://…"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Upload de arquivo entra junto com o Storage (Fase 4). Por ora, cole a URL.
              </p>
            </div>
            <div>
              <Label htmlFor="cor_primaria">Cor primária</Label>
              <div className="flex items-center gap-2">
                <input
                  id="cor_primaria"
                  name="cor_primaria"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-input bg-card"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="max-w-32"
                />
              </div>
            </div>

            {state.error && (
              <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
                {state.error}
              </p>
            )}
            {state.ok && (
              <p className="rounded-lg bg-success-bg px-3 py-2 text-sm text-success">
                Salvo. Recarregue para ver o tema aplicado.
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Salvar aparência"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardContent>
          <h3 className="mb-3 font-semibold">Prévia</h3>
          <div className="flex items-center gap-2.5 rounded-lg border border-border p-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={nome}
                className="h-9 w-9 rounded-lg object-contain"
              />
            ) : (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ background: color }}
              >
                {nome.charAt(0)}
              </span>
            )}
            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold">{nome}</span>
              <span className="text-[11px] text-muted-foreground">
                Gestão da Rede
              </span>
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <span
              className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-white"
              style={{ background: color }}
            >
              Botão
            </span>
            <span
              className="inline-flex h-9 items-center rounded-lg border px-4 text-sm font-medium"
              style={{ borderColor: color, color }}
            >
              Outline
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
