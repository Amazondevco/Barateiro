"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  saveFormulario,
  type SecaoDraft,
  type FormularioPayload,
} from "./actions";
import type { ItemTipo, UnidadeTipo } from "@/lib/types";

const TIPO_ITEM: { v: ItemTipo; l: string }[] = [
  { v: "ok_nao", l: "OK / NÃO" },
  { v: "sim_nao", l: "Sim / Não" },
  { v: "abastecido_ruptura", l: "Abastecido / Ruptura" },
];

type Initial = {
  nome: string;
  descricao: string;
  tipo_unidade: UnidadeTipo;
  status: "ativo" | "inativo";
  departamentos: string[];
  secoes: SecaoDraft[];
};

const novaSecao = (): SecaoDraft => ({
  titulo: "",
  permite_na: true,
  itens: [{ texto: "", tipo: "ok_nao", obriga_obs: true, obriga_foto: true }],
});

export function FormBuilder({
  redeId,
  formId,
  departamentos,
  initial,
}: {
  redeId: string;
  formId: string | null;
  departamentos: { id: string; nome: string }[];
  initial?: Initial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nome, setNome] = useState(initial?.nome ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [tipoUnidade, setTipoUnidade] = useState<UnidadeTipo>(
    initial?.tipo_unidade ?? "loja",
  );
  const [status, setStatus] = useState<"ativo" | "inativo">(
    initial?.status ?? "ativo",
  );
  const [deps, setDeps] = useState<string[]>(initial?.departamentos ?? []);
  const [secoes, setSecoes] = useState<SecaoDraft[]>(
    initial?.secoes?.length ? initial.secoes : [novaSecao()],
  );

  function patchSecao(i: number, patch: Partial<SecaoDraft>) {
    setSecoes((s) => s.map((sec, idx) => (idx === i ? { ...sec, ...patch } : sec)));
  }
  function patchItem(si: number, ii: number, patch: Partial<SecaoDraft["itens"][number]>) {
    setSecoes((s) =>
      s.map((sec, idx) =>
        idx === si
          ? {
              ...sec,
              itens: sec.itens.map((it, j) =>
                j === ii ? { ...it, ...patch } : it,
              ),
            }
          : sec,
      ),
    );
  }

  function save() {
    setError(null);
    const payload: FormularioPayload = {
      nome,
      descricao,
      tipo_unidade: tipoUnidade,
      status,
      departamentos: deps,
      secoes,
    };
    startTransition(async () => {
      const res = await saveFormulario(redeId, formId, payload);
      if (res.error) setError(res.error);
      else router.push("/formularios");
    });
  }

  return (
    <div className="max-w-4xl space-y-6 pb-4">
      {/* Dados */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold">Dados do formulário</h3>
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Checklist Diário do Gerente"
            />
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tipo">Tipo de unidade</Label>
              <Select
                id="tipo"
                value={tipoUnidade}
                onChange={(e) => setTipoUnidade(e.target.value as UnidadeTipo)}
              >
                <option value="loja">Loja</option>
                <option value="cd">CD / Galpão</option>
                <option value="escritorio">Escritório</option>
                <option value="outro">Outro</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "ativo" | "inativo")
                }
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departamentos */}
      <Card>
        <CardContent className="space-y-3">
          <h3 className="font-semibold">Atribuir a departamentos</h3>
          {departamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum departamento cadastrado. Crie em Configurações →
              Departamentos.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {departamentos.map((d) => {
                const on = deps.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      setDeps((v) =>
                        on ? v.filter((x) => x !== d.id) : [...v, d.id],
                      )
                    }
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      on
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:bg-muted"
                    }`}
                  >
                    {d.nome}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seções */}
      {secoes.map((sec, si) => (
        <Card key={si}>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Input
                value={sec.titulo}
                onChange={(e) => patchSecao(si, { titulo: e.target.value })}
                placeholder={`Seção ${si + 1} (ex.: Hortifrúti)`}
                className="font-medium"
              />
              <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={sec.permite_na}
                  onChange={(e) =>
                    patchSecao(si, { permite_na: e.target.checked })
                  }
                  className="accent-[var(--primary)]"
                />
                Permite N/A
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setSecoes((s) => s.filter((_, idx) => idx !== si))
                }
                aria-label="Remover seção"
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>

            {/* Itens */}
            <div className="space-y-2">
              {sec.itens.map((it, ii) => (
                <div
                  key={ii}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2"
                >
                  <Input
                    value={it.texto}
                    onChange={(e) =>
                      patchItem(si, ii, { texto: e.target.value })
                    }
                    placeholder="Texto do item de verificação"
                    className="min-w-50 flex-1"
                  />
                  <Select
                    value={it.tipo}
                    onChange={(e) =>
                      patchItem(si, ii, { tipo: e.target.value as ItemTipo })
                    }
                    className="w-44"
                  >
                    {TIPO_ITEM.map((t) => (
                      <option key={t.v} value={t.v}>
                        {t.l}
                      </option>
                    ))}
                  </Select>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={it.obriga_obs}
                      onChange={(e) =>
                        patchItem(si, ii, { obriga_obs: e.target.checked })
                      }
                      className="accent-[var(--primary)]"
                    />
                    Obs.
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={it.obriga_foto}
                      onChange={(e) =>
                        patchItem(si, ii, { obriga_foto: e.target.checked })
                      }
                      className="accent-[var(--primary)]"
                    />
                    Foto
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      patchSecao(si, {
                        itens: sec.itens.filter((_, j) => j !== ii),
                      })
                    }
                    className="text-muted-foreground hover:text-danger"
                    aria-label="Remover item"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  patchSecao(si, {
                    itens: [
                      ...sec.itens,
                      {
                        texto: "",
                        tipo: "ok_nao",
                        obriga_obs: true,
                        obriga_foto: true,
                      },
                    ],
                  })
                }
              >
                <Plus className="h-4 w-4" /> Adicionar item
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => setSecoes((s) => [...s, novaSecao()])}
      >
        <Plus className="h-4 w-4" /> Adicionar seção
      </Button>

      <p className="text-xs text-muted-foreground">
        Regra do checklist: ao responder <strong>NÃO</strong>, os campos
        marcados (Obs./Foto) ficam obrigatórios para o gerente.
      </p>

      {error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/formularios")}
        >
          Cancelar
        </Button>
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar formulário"}
        </Button>
      </div>
    </div>
  );
}
