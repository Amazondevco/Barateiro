"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  SlidersHorizontal,
  GripVertical,
  ClipboardList,
  ChevronRight,
  Check,
  CircleCheck,
  CircleDashed,
} from "lucide-react";
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

export type FormItem = {
  id: string;
  nome: string;
  descricao: string | null;
  enviadoHoje?: boolean;
};

type Modo = "az" | "za" | "custom";
type Status = "todos" | "pendentes" | "enviados";

const ORDENAR: { v: Modo; label: string }[] = [
  { v: "az", label: "Nome (A–Z)" },
  { v: "za", label: "Nome (Z–A)" },
  { v: "custom", label: "Minha ordem" },
];
const FILTROS: { v: Status; label: string }[] = [
  { v: "todos", label: "Todos" },
  { v: "pendentes", label: "Pendentes hoje" },
  { v: "enviados", label: "Enviados hoje" },
];

export function FormsBoard({
  membroId,
  forms,
}: {
  membroId: string;
  forms: FormItem[];
}) {
  const [busca, setBusca] = useState("");
  const [modo, setModo] = useState<Modo>("az");
  const [status, setStatus] = useState<Status>("todos");
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

  const ordenados = useMemo(() => {
    let base = forms.filter((f) =>
      f.nome.toLowerCase().includes(busca.trim().toLowerCase()),
    );
    if (status === "pendentes") base = base.filter((f) => !f.enviadoHoje);
    if (status === "enviados") base = base.filter((f) => f.enviadoHoje);

    if (modo === "az") return [...base].sort((a, b) => a.nome.localeCompare(b.nome));
    if (modo === "za") return [...base].sort((a, b) => b.nome.localeCompare(a.nome));
    const pos = new Map(ordem.map((id, i) => [id, i]));
    return [...base].sort(
      (a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9),
    );
  }, [forms, busca, modo, status, ordem]);

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

  function escolherOrdem(v: Modo) {
    setModo(v);
    if (v === "custom") salvarOrdem(ordenados.map((f) => f.id));
  }

  const modoLabel = ORDENAR.find((o) => o.v === modo)?.label ?? "Ordenar";
  const filtroAtivo = status !== "todos";

  return (
    <div className="space-y-4">
      {/* busca — sobrepõe o banner */}
      <div className="relative -mt-5">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar formulário…"
          className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm shadow-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* filtros + ordenar (sem overflow: o overflow corta o menu que abre embaixo) */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Popover
          label="Filtros"
          icon={SlidersHorizontal}
          active={filtroAtivo}
          badge={filtroAtivo ? 1 : 0}
        >
          <p className="px-1 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          {FILTROS.map((f) => (
            <Opcao
              key={f.v}
              label={f.label}
              icon={
                f.v === "enviados"
                  ? CircleCheck
                  : f.v === "pendentes"
                    ? CircleDashed
                    : undefined
              }
              selected={status === f.v}
              onClick={() => setStatus(f.v)}
            />
          ))}
          {filtroAtivo && (
            <button
              onClick={() => setStatus("todos")}
              className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted"
            >
              Limpar filtros
            </button>
          )}
        </Popover>

        <Popover label={modoLabel} icon={ArrowUpDown}>
          <p className="px-1 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ordenar por
          </p>
          {ORDENAR.map((o) => (
            <Opcao
              key={o.v}
              label={o.label}
              icon={o.v === "custom" ? GripVertical : undefined}
              selected={modo === o.v}
              onClick={() => escolherOrdem(o.v)}
            />
          ))}
        </Popover>
      </div>

      {ordenados.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Nenhum formulário</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {busca || filtroAtivo
              ? "Ajuste a busca ou os filtros."
              : "Quando o gestor liberar checklists para você, eles aparecem aqui."}
          </p>
        </div>
      ) : modo === "custom" ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ordenados.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {ordenados.map((f) => (
                <SortableCard key={f.id} form={f} membroId={membroId} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-3">
          {ordenados.map((f) => (
            <FormCard key={f.id} form={f} membroId={membroId} />
          ))}
        </div>
      )}
    </div>
  );
}

// Botão + painel flutuante (fecha ao clicar fora)
function Popover({
  label,
  icon: Icon,
  active,
  badge = 0,
  children,
}: {
  label: string;
  icon: typeof Search;
  active?: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium shadow-sm transition-colors ${
          active
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover:bg-muted"
        }`}
      >
        <Icon className="h-4 w-4" /> {label}
        {badge > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute left-0 top-11 z-20 w-52 rounded-xl border border-border bg-card p-1.5 shadow-lg"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function Opcao({
  label,
  icon: Icon,
  selected,
  onClick,
}: {
  label: string;
  icon?: typeof Search;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${
        selected ? "font-medium text-primary" : ""
      }`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
      <span className="flex-1 truncate">{label}</span>
      {selected && <Check className="h-4 w-4 shrink-0" />}
    </button>
  );
}

function FormCard({ form, membroId }: { form: FormItem; membroId: string }) {
  return (
    <Link
      href={`/app/rede/${membroId}/form/${form.id}`}
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <ClipboardList className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{form.nome}</p>
        {form.descricao && (
          <p className="truncate text-[13px] text-muted-foreground">{form.descricao}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {form.enviadoHoje ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-xs font-semibold text-success">
            <CircleCheck className="h-3.5 w-3.5" /> Hoje
          </span>
        ) : (
          <span className="h-5" />
        )}
        <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
      </div>
    </Link>
  );
}

function SortableCard({ form, membroId }: { form: FormItem; membroId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: form.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Arrastar"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <Link href={`/app/rede/${membroId}/form/${form.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ClipboardList className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{form.nome}</p>
          {form.descricao && (
            <p className="truncate text-[13px] text-muted-foreground">{form.descricao}</p>
          )}
        </div>
        {form.enviadoHoje && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-xs font-semibold text-success">
            <CircleCheck className="h-3.5 w-3.5" /> Hoje
          </span>
        )}
      </Link>
    </div>
  );
}
