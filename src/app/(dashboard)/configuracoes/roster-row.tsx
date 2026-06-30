"use client";

import { useActionState, useState } from "react";
import { Trash2, Lock } from "lucide-react";
import { TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tooltip, iconBtnClass } from "@/components/ui/tooltip";
import { useToast, useActionToast } from "@/components/toast";
import {
  updateRosterPessoa,
  removeRosterPessoa,
} from "./roster-actions";

type Opt = { id: string; nome: string };
export type RosterPessoa = {
  id: string;
  nome: string;
  cpfFmt: string;
  status: string;
  cargo_id: string | null;
  unidade_id: string | null;
  departamento_id: string | null;
  cargoNome: string | null;
  unidadeNome: string | null;
  deptNome: string | null;
  protegido: boolean;
};

// Linha da equipe do app: a LINHA INTEIRA abre a edição (exceto as fixas/padrão
// da Check.AI). Botão de apagar remove a pessoa da rede.
export function RosterRow({
  pessoa,
  unidades,
  cargos,
  departamentos,
}: {
  pessoa: RosterPessoa;
  unidades: Opt[];
  cargos: Opt[];
  departamentos: Opt[];
}) {
  const [open, setOpen] = useState(false);
  const { success: toastSuccess } = useToast();
  const [state, formAction, pending] = useActionState(
    updateRosterPessoa.bind(null, pessoa.id),
    {},
  );
  useActionToast(state, { success: "Pessoa atualizada." });
  if (state.ok && open) setOpen(false);

  const editavel = !pessoa.protegido;

  return (
    <>
      <TR
        onClick={editavel ? () => setOpen(true) : undefined}
        className={
          editavel
            ? "cursor-pointer transition-colors hover:bg-muted/40"
            : undefined
        }
      >
        <TD>
          <span className="flex items-center gap-1.5">
            <span className="font-medium">{pessoa.nome}</span>
            {pessoa.protegido && (
              <Tooltip label="Cadastro padrão da Check.AI — não editável">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              </Tooltip>
            )}
          </span>
        </TD>
        <TD>{pessoa.cpfFmt}</TD>
        <TD>{pessoa.cargoNome ?? "—"}</TD>
        <TD>{pessoa.unidadeNome ?? "—"}</TD>
        <TD>{pessoa.deptNome ?? "—"}</TD>
        <TD>
          <Badge tone={pessoa.status === "vinculado" ? "success" : "warning"}>
            {pessoa.status === "vinculado" ? "Cadastrado" : "Aguardando"}
          </Badge>
        </TD>
        <TD onClick={(e) => e.stopPropagation()}>
          {editavel ? (
            <form
              action={removeRosterPessoa.bind(null, pessoa.id) as unknown as (fd: FormData) => void}
              onSubmit={(e) => {
                if (
                  !window.confirm(
                    `Remover ${pessoa.nome} da equipe do app? A pessoa perde o acesso à rede.`,
                  )
                ) {
                  e.preventDefault();
                  return;
                }
                toastSuccess(`${pessoa.nome} removido da equipe.`);
              }}
            >
              <Tooltip label="Apagar">
                <button className={iconBtnClass} type="submit" aria-label="Apagar">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Tooltip>
            </form>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TD>
      </TR>

      {open && (
        <Modal title="Editar pessoa da equipe" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor={`r_nome_${pessoa.id}`}>Nome completo</Label>
              <Input
                id={`r_nome_${pessoa.id}`}
                name="nome"
                defaultValue={pessoa.nome}
                required
              />
            </div>
            <div>
              <Label>CPF</Label>
              <Input value={pessoa.cpfFmt} disabled readOnly />
              <p className="mt-1 text-xs text-muted-foreground">
                O CPF é a chave de acesso e não pode ser alterado aqui.
              </p>
            </div>
            <div>
              <Label htmlFor={`r_cargo_${pessoa.id}`}>Cargo (permissão)</Label>
              <Select
                id={`r_cargo_${pessoa.id}`}
                name="cargo_id"
                defaultValue={pessoa.cargo_id ?? ""}
              >
                <option value="">Sem cargo</option>
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor={`r_uni_${pessoa.id}`}>Unidade</Label>
              <Select
                id={`r_uni_${pessoa.id}`}
                name="unidade_id"
                defaultValue={pessoa.unidade_id ?? ""}
              >
                <option value="">Sem unidade</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor={`r_dep_${pessoa.id}`}>Departamento</Label>
              <Select
                id={`r_dep_${pessoa.id}`}
                name="departamento_id"
                defaultValue={pessoa.departamento_id ?? ""}
              >
                <option value="">Sem departamento</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
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
                {pending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
