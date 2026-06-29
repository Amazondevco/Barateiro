"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowDownAZ, GripVertical, ClipboardList, ChevronRight } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type FormItem = { id: string; nome: string; descricao: string | null };

export function FormsBoard({
  membroId,
  forms,
}: {
  membroId: string;
  forms: FormItem[];
}) {
  const [busca, setBusca] = useState("");
  const [modo, setModo] = useState<"az" | "custom">("az");
  const [ordem, setOrdem] = useState<string[]>([]);

  const chave = `formorder:${membroId}`;
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(chave);
      if (salvo) {
        setOrdem(JSON.parse(salvo));
        setModo("custom");
      }
    } catch {
      /* ignore */
    }
  }, [chave]);

  function salvarOrdem(ids: string[]) {
    setOrdem(ids);
    try {
      localStorage.setItem(chave, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }

  // ordena: custom segue `ordem` (novos vão pro fim); az por nome
  const ordenados = useMemo(() => {
    const base = forms.filter((f) =>
      f.nome.toLowerCase().includes(busca.trim().toLowerCase()),
    );
    if (modo === "az") return [...base].sort((a, b) => a.nome.localeCompare(b.nome));
    const pos = new Map(ordem.map((id, i) => [id, i]));
    return [...base].sort(
      (a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9),
    );
  }, [forms, busca, modo, ordem]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = ordenados.map((f) => f.id);
    const oldI = ids.indexOf(String(active.id));
    const newI = ids.indexOf(String(over.id));
    salvarOrdem(arrayMove(ids, oldI, newI));
  }

  function ativarCustom() {
    setModo("custom");
    salvarOrdem(ordenados.map((f) => f.id));
  }

  return (
    <div className="space-y-3">
      {/* busca + ordenação */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar formulário…"
            className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button
          onClick={() => setModo("az")}
          className={`flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm ${
            modo === "az" ? "border-primary bg-primary/10 text-primary" : "border-input"
          }`}
          title="Ordem alfabética"
        >
          <ArrowDownAZ className="h-4 w-4" /> A–Z
        </button>
        <button
          onClick={ativarCustom}
          className={`flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm ${
            modo === "custom" ? "border-primary bg-primary/10 text-primary" : "border-input"
          }`}
          title="Arrastar para ordenar"
        >
          <GripVertical className="h-4 w-4" /> Minha ordem
        </button>
      </div>

      {ordenados.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Nenhum formulário</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {busca ? "Ajuste a busca." : "Quando o gestor liberar checklists para você, eles aparecem aqui."}
          </p>
        </div>
      ) : modo === "custom" ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ordenados.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {ordenados.map((f) => (
                <SortableCard key={f.id} form={f} membroId={membroId} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-2">
          {ordenados.map((f) => (
            <FormCard key={f.id} form={f} membroId={membroId} />
          ))}
        </div>
      )}
    </div>
  );
}

function FormCard({ form, membroId }: { form: FormItem; membroId: string }) {
  return (
    <Link
      href={`/app/rede/${membroId}/form/${form.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ClipboardList className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{form.nome}</p>
        {form.descricao && <p className="truncate text-xs text-muted-foreground">{form.descricao}</p>}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
}

function SortableCard({ form, membroId }: { form: FormItem; membroId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: form.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-xl border border-border bg-card p-4">
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Arrastar"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <Link href={`/app/rede/${membroId}/form/${form.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ClipboardList className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{form.nome}</p>
          {form.descricao && <p className="truncate text-xs text-muted-foreground">{form.descricao}</p>}
        </div>
      </Link>
    </div>
  );
}
