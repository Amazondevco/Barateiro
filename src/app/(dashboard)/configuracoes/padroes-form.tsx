"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { updatePadroes, type FormState } from "./plataforma-actions";

const DIAS = [
  { v: 1, l: "Seg" },
  { v: 2, l: "Ter" },
  { v: 3, l: "Qua" },
  { v: 4, l: "Qui" },
  { v: 5, l: "Sex" },
  { v: 6, l: "Sáb" },
  { v: 7, l: "Dom" },
];

export function PadroesForm({
  horario,
  dias,
  janela,
  retencao,
}: {
  horario: string;
  dias: number[];
  janela: number;
  retencao: number;
}) {
  const initial: FormState = {};
  const [state, formAction, pending] = useActionState(updatePadroes, initial);

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="max-w-2xl space-y-4">
          <div>
            <h3 className="font-semibold">Padrões das redes</h3>
            <p className="text-sm text-muted-foreground">
              Toda rede nova herda estes valores. Só o Super Admin edita.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="horario">Horário limite</Label>
              <Input id="horario" name="horario" type="time" defaultValue={horario} />
            </div>
            <div>
              <Label htmlFor="janela">Janela de edição (min)</Label>
              <Input id="janela" name="janela" type="number" min={0} defaultValue={janela} />
            </div>
            <div>
              <Label htmlFor="retencao">Retenção de fotos (dias)</Label>
              <Input id="retencao" name="retencao" type="number" min={1} defaultValue={retencao} />
            </div>
          </div>

          <div>
            <Label>Dias da semana (frequência)</Label>
            <div className="flex flex-wrap gap-2">
              {DIAS.map((d) => (
                <label
                  key={d.v}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                >
                  <input
                    type="checkbox"
                    name="dias"
                    value={d.v}
                    defaultChecked={dias.includes(d.v)}
                    className="accent-[var(--primary)]"
                  />
                  {d.l}
                </label>
              ))}
            </div>
          </div>

          {state.error && (
            <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="rounded-lg bg-success-bg px-3 py-2 text-sm text-success">
              Padrões salvos.
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar padrões"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
