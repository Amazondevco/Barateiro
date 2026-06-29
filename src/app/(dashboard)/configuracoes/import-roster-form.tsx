"use client";

import { useActionState, useRef, useState } from "react";
import { Upload, FileUp, Check, Sparkles } from "lucide-react";
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
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(action, {});

  if (state.ok && open) {
    // mantém aberto para mostrar o resultado
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" /> Importar lista
      </Button>

      {open && (
        <Modal title="Importar equipe" onClose={() => setOpen(false)} size="lg">
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
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-primary">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Envie um <strong>Excel, PDF, Word ou CSV</strong> com a equipe.
                  A IA lê o arquivo e extrai nome, CPF, cargo, unidade e
                  departamento.
                </p>
              </div>

              {/* Arquivo */}
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  name="file"
                  accept=".csv,.xlsx,.xls,.pdf,.docx"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                >
                  <FileUp className="h-4 w-4" /> Escolher arquivo
                </Button>
                {fileName && (
                  <span className="ml-3 text-sm text-muted-foreground">{fileName}</span>
                )}
              </div>

              <div className="relative text-center text-xs text-muted-foreground">
                <span className="bg-card px-2">ou cole a lista (CSV)</span>
              </div>

              <div>
                <Label htmlFor="lista">
                  Lista <span className="font-normal text-muted-foreground">(nome; cpf; cargo; unidade; departamento)</span>
                </Label>
                <textarea
                  id="lista"
                  name="lista"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={6}
                  placeholder={"João Silva; 123.456.789-00; Gerente; Loja Centro; Açougue"}
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
                <Button type="submit" disabled={pending || (!fileName && !texto.trim())}>
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
