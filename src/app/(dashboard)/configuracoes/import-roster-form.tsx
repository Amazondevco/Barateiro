"use client";

import { useActionState, useRef, useState } from "react";
import { Upload, FileUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/input";
import type { ImportState } from "./roster-actions";

export function ImportRosterForm({
  action,
}: {
  action: (prev: ImportState, fd: FormData) => Promise<ImportState>;
}) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(action, {});

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setTexto(String(reader.result ?? ""));
    reader.readAsText(f);
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" /> Importar lista
      </Button>

      {open && (
        <Modal
          title="Importar equipe"
          onClose={() => setOpen(false)}
          size="lg"
        >
          {state.ok ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-medium text-success">
                <Check className="h-4 w-4" /> {state.inseridos} pessoa(s) adicionada(s).
              </p>
              {state.erros && state.erros.length > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning-bg p-3">
                  <p className="mb-1 text-xs font-medium text-warning">
                    {state.erros.length} linha(s) ignorada(s):
                  </p>
                  <ul className="space-y-0.5 text-xs text-warning">
                    {state.erros.slice(0, 10).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setOpen(false)}>Fechar</Button>
              </div>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cole a lista ou envie um arquivo. Uma pessoa por linha, colunas
                separadas por <code>;</code> ou vírgula:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
nome; cpf; cargo; unidade; departamento
João Silva; 123.456.789-00; Gerente; Loja Centro; Açougue
              </pre>

              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={onFile}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <FileUp className="h-4 w-4" /> Enviar arquivo CSV
                </Button>
              </div>

              <div>
                <Label htmlFor="lista">Lista</Label>
                <textarea
                  id="lista"
                  name="lista"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={8}
                  placeholder="Cole as linhas aqui…"
                  className="w-full rounded-lg border border-input bg-card p-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
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
                <Button type="submit" disabled={pending || !texto.trim()}>
                  {pending ? "Importando…" : "Importar"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
