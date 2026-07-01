"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  SlidersHorizontal,
  GripVertical,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  Check,
  CircleCheck,
  CircleDashed,
  Clock,
  FolderPlus,
  Folder,
  Trash2,
  Loader2,
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
import { createClient } from "@/lib/supabase/client";

export type FormItem = {
  id: string;
  nome: string;
  descricao: string | null;
  enviadoHoje?: boolean;
  foraDoHorario?: boolean; // fora do dia/horário de preenchimento (ainda preenchível)
};

type Pasta = { id: string; nome: string; formularioIds: string[] };

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
  redeId,
  forms,
}: {
  membroId: string;
  redeId: string;
  forms: FormItem[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [busca, setBusca] = useState("");
  const [modo, setModo] = useState<Modo>("az");
  const [status, setStatus] = useState<Status>("todos");
  const [ordem, setOrdem] = useState<string[]>([]);
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [abertas, setAbertas] = useState<Record<string, boolean>>({});
  const [modalAberto, setModalAberto] = useState(false);

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

  // Pastas pessoais (RLS entrega só as do próprio usuário) da rede.
  const carregarPastas = useCallback(async () => {
    if (!redeId) return;
    const { data } = await supabase
      .from("pastas")
      .select("id, nome, ordem, pasta_formularios(formulario_id)")
      .eq("rede_id", redeId)
      .order("ordem")
      .order("created_at");
    setPastas(
      (data ?? []).map((p) => ({
        id: String(p.id),
        nome: String(p.nome),
        formularioIds: (
          (p.pasta_formularios as { formulario_id: string }[] | null) ?? []
        ).map((x) => String(x.formulario_id)),
      })),
    );
  }, [redeId, supabase]);

  useEffect(() => {
    void carregarPastas();
  }, [carregarPastas]);

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

  // Agrupa por pasta. `pastaDeForm`: formId → pastaId (um checklist em 1 pasta).
  const pastaDeForm = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of pastas)
      for (const fid of p.formularioIds) m.set(fid, p.id);
    return m;
  }, [pastas]);

  const soltos = ordenados.filter((f) => !pastaDeForm.has(f.id));
  const pastasView = pastas.map((p) => ({
    ...p,
    forms: ordenados.filter((f) => pastaDeForm.get(f.id) === p.id),
  }));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = soltos.map((f) => f.id);
    const oldI = ids.indexOf(String(active.id));
    const newI = ids.indexOf(String(over.id));
    // Reordena só os soltos; mantém a ordem geral coerente.
    const novaOrdemSoltos = arrayMove(ids, oldI, newI);
    const resto = ordem.filter((id) => !ids.includes(id));
    salvarOrdem([...novaOrdemSoltos, ...resto]);
  }

  function escolherOrdem(v: Modo) {
    setModo(v);
    if (v === "custom") salvarOrdem(ordenados.map((f) => f.id));
  }

  async function criarPasta(nome: string, formularioIds: string[]) {
    const { data: nova, error } = await supabase
      .from("pastas")
      .insert({ rede_id: redeId, nome })
      .select("id")
      .single();
    if (error || !nova) return;
    if (formularioIds.length > 0) {
      // um checklist em 1 pasta: tira dos vínculos anteriores (RLS: só os meus)
      await supabase
        .from("pasta_formularios")
        .delete()
        .in("formulario_id", formularioIds);
      await supabase.from("pasta_formularios").insert(
        formularioIds.map((fid) => ({
          pasta_id: String(nova.id),
          formulario_id: fid,
        })),
      );
    }
    setAbertas((a) => ({ ...a, [String(nova.id)]: true }));
    await carregarPastas();
  }

  async function apagarPasta(id: string) {
    await supabase.from("pastas").delete().eq("id", id); // cascata nos vínculos
    await carregarPastas();
  }

  const modoLabel = ORDENAR.find((o) => o.v === modo)?.label ?? "Ordenar";
  const filtroAtivo = status !== "todos";
  const semNada = ordenados.length === 0 && pastas.length === 0;

  return (
    <div className="space-y-4">
      {/* busca — sobrepõe o banner */}
      <div className="relative -mt-5">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar checklist…"
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

        {/* Criar pasta */}
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-3.5 text-[13px] font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
        >
          <FolderPlus className="h-4 w-4" /> Criar pasta
        </button>
      </div>

      {semNada ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Nenhum checklist</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {busca || filtroAtivo
              ? "Ajuste a busca ou os filtros."
              : "Quando o gestor liberar checklists para você, eles aparecem aqui."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pastas */}
          {pastasView.map((p) => (
            <PastaCard
              key={p.id}
              pasta={p}
              membroId={membroId}
              aberta={abertas[p.id] ?? false}
              onToggle={() =>
                setAbertas((a) => ({ ...a, [p.id]: !(a[p.id] ?? false) }))
              }
              onApagar={() => void apagarPasta(p.id)}
            />
          ))}

          {/* Soltos (fora de pasta) */}
          {modo === "custom" ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={soltos.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {soltos.map((f) => (
                  <SortableCard key={f.id} form={f} membroId={membroId} />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            soltos.map((f) => (
              <FormCard key={f.id} form={f} membroId={membroId} />
            ))
          )}
        </div>
      )}

      {modalAberto && (
        <CriarPastaModal
          forms={forms}
          emPasta={pastaDeForm}
          onClose={() => setModalAberto(false)}
          onCriar={async (nome, ids) => {
            await criarPasta(nome, ids);
            setModalAberto(false);
          }}
        />
      )}
    </div>
  );
}

// Pasta (cartão recolhível) com seus checklists.
function PastaCard({
  pasta,
  membroId,
  aberta,
  onToggle,
  onApagar,
}: {
  pasta: Pasta & { forms: FormItem[] };
  membroId: string;
  aberta: boolean;
  onToggle: () => void;
  onApagar: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Folder className="h-6 w-6" />
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold">
              {pasta.nome}
            </span>
            <span className="block text-[13px] text-muted-foreground">
              {pasta.forms.length} checklist(s)
            </span>
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
              aberta ? "rotate-180" : ""
            }`}
          />
        </button>
        <button
          type="button"
          onClick={onApagar}
          aria-label="Apagar pasta"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-danger-bg hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {aberta && (
        <div className="space-y-2 border-t border-border bg-muted/30 p-3">
          {pasta.forms.length === 0 ? (
            <p className="px-1 py-2 text-center text-xs text-muted-foreground">
              Nenhum checklist nesta pasta (ou filtrado pela busca).
            </p>
          ) : (
            pasta.forms.map((f) => (
              <FormCard key={f.id} form={f} membroId={membroId} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Modal: nome da pasta + seleção múltipla de checklists.
function CriarPastaModal({
  forms,
  emPasta,
  onClose,
  onCriar,
}: {
  forms: FormItem[];
  emPasta: Map<string, string>;
  onClose: () => void;
  onCriar: (nome: string, ids: string[]) => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [salvando, setSalvando] = useState(false);

  const ids = forms.filter((f) => sel[f.id]).map((f) => f.id);
  const podeSalvar = nome.trim().length > 0 && !salvando;

  async function salvar() {
    if (!podeSalvar) return;
    setSalvando(true);
    try {
      await onCriar(nome.trim(), ids);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FolderPlus className="h-5 w-5" />
          </span>
          <h2 className="flex-1 text-base font-bold">Criar pasta</h2>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Nome da pasta
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
              placeholder="Ex.: Manhã, Frios, Auditorias…"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium">Adicionar checklists</p>
            <div className="space-y-1.5">
              {forms.map((f) => {
                const jaEm = emPasta.get(f.id);
                return (
                  <label
                    key={f.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 accent-primary"
                      checked={!!sel[f.id]}
                      onChange={(e) =>
                        setSel((s) => ({ ...s, [f.id]: e.target.checked }))
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {f.nome}
                      </span>
                      {jaEm ? (
                        <span className="block text-xs text-muted-foreground">
                          Já está em outra pasta — será movido
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
              {forms.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  Nenhum checklist disponível.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className="flex gap-3 border-t border-border p-4"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl bg-muted text-sm font-semibold text-foreground transition-colors hover:bg-border"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void salvar()}
            disabled={!podeSalvar}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Criar pasta
          </button>
        </div>
      </div>
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
  const fora = !!form.foraDoHorario;
  return (
    <Link
      href={`/app/rede/${membroId}/form/${form.id}`}
      className={`flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        fora ? "opacity-70 hover:border-warning" : "hover:border-primary"
      }`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
          fora ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
        }`}
      >
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
        ) : fora ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning">
            <Clock className="h-3.5 w-3.5" /> Fora do horário
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
      <Link
        href={`/app/rede/${membroId}/form/${form.id}`}
        className={`flex min-w-0 flex-1 items-center gap-4 ${form.foraDoHorario ? "opacity-70" : ""}`}
      >
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            form.foraDoHorario ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          }`}
        >
          <ClipboardList className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{form.nome}</p>
          {form.descricao && (
            <p className="truncate text-[13px] text-muted-foreground">{form.descricao}</p>
          )}
        </div>
        {form.enviadoHoje ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-xs font-semibold text-success">
            <CircleCheck className="h-3.5 w-3.5" /> Hoje
          </span>
        ) : form.foraDoHorario ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning">
            <Clock className="h-3.5 w-3.5" /> Fora
          </span>
        ) : null}
      </Link>
    </div>
  );
}
