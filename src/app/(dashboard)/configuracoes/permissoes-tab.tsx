"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Lock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { PERMISSOES, PERMISSAO_LABEL } from "@/lib/permissoes";
import { createCargo, updateCargo, deleteCargo } from "./cargo-actions";

type Cargo = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  sistema: boolean;
  permissoes: string[];
};

export function PermissoesTab({
  redeId,
  cargos,
}: {
  redeId: string;
  cargos: Cargo[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate(nome: string, perms: string[]) {
    setError(null);
    startTransition(async () => {
      const r = await createCargo(redeId, nome, perms);
      if (r.error) setError(r.error);
      else {
        setCreating(false);
        router.refresh();
      }
    });
  }
  function handleUpdate(id: string, nome: string, perms: string[]) {
    setError(null);
    startTransition(async () => {
      const r = await updateCargo(id, nome, perms);
      if (r.error) setError(r.error);
      else {
        setEditingId(null);
        router.refresh();
      }
    });
  }
  function handleDelete(id: string) {
    if (!confirm("Excluir este cargo?")) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteCargo(id);
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Cargos fixos não podem ser alterados. Crie cargos personalizados com
          as permissões que quiser.
        </p>
        {!creating && (
          <Button
            onClick={() => {
              setCreating(true);
              setEditingId(null);
            }}
          >
            <Plus className="h-4 w-4" /> Novo cargo
          </Button>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {creating && (
        <CargoEditor
          title="Novo cargo"
          pending={pending}
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      {cargos.map((c) =>
        editingId === c.id ? (
          <CargoEditor
            key={c.id}
            title={`Editar ${c.nome}`}
            initialNome={c.nome}
            initialPerms={c.permissoes}
            pending={pending}
            onSubmit={(n, p) => handleUpdate(c.id, n, p)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <Card key={c.id}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.nome}</h3>
                    {c.sistema ? (
                      <Badge tone="neutral">
                        <Lock className="mr-1 h-3 w-3" /> Fixo
                      </Badge>
                    ) : (
                      <Badge tone="primary">Personalizado</Badge>
                    )}
                  </div>
                  {c.descricao && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {c.descricao}
                    </p>
                  )}
                </div>
                {!c.sistema && (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingId(c.id);
                        setCreating(false);
                      }}
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(c.id)}
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {c.permissoes.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    Sem permissões.
                  </span>
                ) : (
                  c.permissoes.map((p) => (
                    <Badge key={p} tone="neutral">
                      {PERMISSAO_LABEL[p] ?? p}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}

function CargoEditor({
  title,
  initialNome = "",
  initialPerms = [],
  pending,
  onSubmit,
  onCancel,
}: {
  title: string;
  initialNome?: string;
  initialPerms?: string[];
  pending: boolean;
  onSubmit: (nome: string, perms: string[]) => void;
  onCancel: () => void;
}) {
  const [nome, setNome] = useState(initialNome);
  const [perms, setPerms] = useState<string[]>(initialPerms);

  function toggle(k: string) {
    setPerms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        <h3 className="font-semibold">{title}</h3>
        <div className="max-w-sm">
          <Label htmlFor="cargo_nome">Nome do cargo</Label>
          <Input
            id="cargo_nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Supervisor, Repositor"
          />
        </div>

        {PERMISSOES.map((g) => (
          <div key={g.grupo}>
            <p className="mb-2 text-sm font-medium">{g.grupo}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {g.itens.map((it) => (
                <label
                  key={it.key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                >
                  <input
                    type="checkbox"
                    checked={perms.includes(it.key)}
                    onChange={() => toggle(it.key)}
                    className="accent-[var(--primary)]"
                  />
                  {it.label}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={() => onSubmit(nome, perms)} disabled={pending}>
            {pending ? "Salvando…" : "Salvar cargo"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
