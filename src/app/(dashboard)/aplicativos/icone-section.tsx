"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/table";
import { deleteIcone } from "./icone-actions";
import type { AppIcone } from "./icone-types";

export function IconeSection({ icones }: { icones: AppIcone[] }) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteIcone(id);
      setConfirmId(null);
    });
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Ícones PWA</h2>
            <Badge tone="primary">Progressive Web App</Badge>
          </div>
          <Link
            href="/aplicativos/icones/novo"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" /> Novo ícone
          </Link>
        </div>

        <p className="max-w-2xl text-sm text-muted-foreground">
          Cada ícone é uma versão instalável no celular. O acesso é por filtro
          (cargo/unidade/departamento) — quem casa com o filtro vê o app.
        </p>

        {icones.length === 0 ? (
          <EmptyState
            title="Nenhum ícone ainda"
            description="Crie o primeiro app instalável para a sua equipe."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {icones.map((icone) => (
              <IconeCard
                key={icone.id}
                icone={icone}
                onDelete={() => setConfirmId(icone.id)}
              />
            ))}
            <Link
              href="/aplicativos/icones/novo"
              className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Novo ícone</span>
            </Link>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        title="Excluir ícone"
        description={`"${icones.find((i) => i.id === confirmId)?.nome}" será removido permanentemente.`}
        confirmLabel="Excluir ícone"
        onConfirm={() => handleDelete(confirmId!)}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}

function IconeCard({
  icone,
  onDelete,
}: {
  icone: AppIcone;
  onDelete: () => void;
}) {
  const tags = [
    icone.cargos.length > 0 ? `${icone.cargos.length} cargo(s)` : null,
    icone.unidades.length > 0 ? `${icone.unidades.length} unidade(s)` : "todas as unidades",
    icone.departamentos.length > 0 ? `${icone.departamentos.length} depto.` : null,
  ].filter(Boolean) as string[];

  const initials = icone.nome
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Link href={`/aplicativos/icones/${icone.id}`} className="block">
        <div
          className="flex flex-col items-center gap-2 py-5 transition-opacity hover:opacity-90"
          style={{ backgroundColor: `${icone.cor}18` }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-[16px] text-lg font-semibold text-white"
            style={{ backgroundColor: icone.cor }}
          >
            {initials}
          </div>
          <span className="text-xs font-medium" style={{ color: icone.cor }}>
            {icone.nomeCurto}
          </span>
        </div>
        <div className="p-3">
          <p className="mb-2 text-sm font-medium">{icone.nome}</p>
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <Badge key={t} tone="neutral" className="text-[10px]">{t}</Badge>
            ))}
          </div>
        </div>
      </Link>
      <div className="flex justify-end px-3 pb-3">
        <button
          onClick={onDelete}
          className="text-muted-foreground transition-colors hover:text-danger"
          aria-label="Excluir ícone"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
