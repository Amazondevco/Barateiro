"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  X,
  Mic,
  Square,
  BarChart3,
  GripVertical,
  Download,
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
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import type { Computed } from "@/lib/relatorios";
import {
  gerarPainelIA,
  novoRelatorio,
  excluirRelatorio,
  reordenarRelatorios,
  type RelState,
} from "./relatorio-actions";

export type RelItem = {
  id: string;
  titulo: string;
  kind: string;
  origem: string;
  data: Computed;
};

export function RelatoriosView({
  formId,
  relatorios,
}: {
  formId: string;
  relatorios: RelItem[];
}) {
  const router = useRouter();
  const [pend, start] = useTransition();
  const [novoOpen, setNovoOpen] = useState(false);

  function gerar() {
    start(async () => {
      await gerarPainelIA(formId);
      router.refresh();
    });
  }
  function excluir(id: string) {
    start(async () => {
      await excluirRelatorio(formId, id);
      router.refresh();
    });
  }

  // ordem local (otimista) — persiste ao arrastar
  const [ordemIds, setOrdemIds] = useState<string[]>(relatorios.map((r) => r.id));
  useEffect(() => {
    setOrdemIds(relatorios.map((r) => r.id));
  }, [relatorios]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const ordenados = ordemIds
    .map((id) => relatorios.find((r) => r.id === id))
    .filter((r): r is RelItem => !!r);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const novos = arrayMove(
      ordemIds,
      ordemIds.indexOf(String(active.id)),
      ordemIds.indexOf(String(over.id)),
    );
    setOrdemIds(novos);
    start(async () => {
      await reordenarRelatorios(formId, novos);
    });
  }

  function exportar() {
    document.body.classList.add("imprimindo");
    const limpar = () => {
      document.body.classList.remove("imprimindo");
      window.removeEventListener("afterprint", limpar);
    };
    window.addEventListener("afterprint", limpar);
    window.print();
  }

  if (!relatorios.length) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <BarChart3 className="h-9 w-9 text-muted-foreground" />
          <p className="font-medium">Nenhum relatório ainda</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Deixe a IA montar os relatórios importantes deste formulário, ou crie um do seu jeito.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <Button onClick={gerar} disabled={pend}>
              {pend ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Gerar painel com IA
            </Button>
            <Button variant="outline" onClick={() => setNovoOpen(true)}>
              <Plus className="h-4 w-4" /> Novo relatório
            </Button>
          </div>
        </div>
        {novoOpen && <NovoDialog formId={formId} onClose={() => setNovoOpen(false)} />}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <p className="text-sm text-muted-foreground">
          Arraste pelos pontos para reordenar.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportar}>
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={gerar} disabled={pend}>
            {pend ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Regerar com IA
          </Button>
          <Button size="sm" onClick={() => setNovoOpen(true)}>
            <Plus className="h-4 w-4" /> Novo relatório
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ordenados.map((r) => r.id)} strategy={rectSortingStrategy}>
          <div id="painel-export" className="grid gap-4 sm:grid-cols-2">
            {ordenados.map((r) => (
              <CartaoRelatorio
                key={r.id}
                item={r}
                onExcluir={() => excluir(r.id)}
                disabled={pend}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {novoOpen && <NovoDialog formId={formId} onClose={() => setNovoOpen(false)} />}
    </div>
  );
}

function CartaoRelatorio({
  item,
  onExcluir,
  disabled,
}: {
  item: RelItem;
  onExcluir: () => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="no-print mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label="Arrastar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <h3 className="flex-1 text-sm font-semibold">{item.titulo}</h3>
        <button
          onClick={onExcluir}
          disabled={disabled}
          className="no-print shrink-0 text-muted-foreground hover:text-danger"
          aria-label="Remover"
          title="Remover"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <Grafico data={item.data} />
    </div>
  );
}

function Grafico({ data }: { data: Computed }) {
  if (data.kind === "vazio")
    return <p className="py-8 text-center text-sm text-muted-foreground">Sem respostas ainda.</p>;

  if (data.kind === "volume")
    return (
      <div className="py-4 text-center">
        <p className="text-4xl font-bold text-primary">{data.total}</p>
        <p className="text-xs text-muted-foreground">envios registrados</p>
      </div>
    );

  if (data.kind === "conformidade")
    return (
      <div className="flex items-center gap-4">
        <Donut pct={data.pct} />
        <div className="space-y-1 text-sm">
          <p className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Conforme: <b>{data.conforme}</b>
          </p>
          <p className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" /> Não-conf.: <b>{data.nao}</b>
          </p>
          <p className="text-xs text-muted-foreground">de {data.total} itens</p>
        </div>
      </div>
    );

  if (data.kind === "media_numerica")
    return (
      <div className="py-4 text-center">
        <p className="text-4xl font-bold text-primary">
          {data.n ? data.media : "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          {data.n ? `média de ${data.n} respostas` : "sem dados numéricos"}
        </p>
      </div>
    );

  if (data.kind === "evolucao") return <Linha points={data.points} />;

  // barras (nao_por_pergunta | distribuicao | por_unidade)
  const bars =
    data.kind === "nao_por_pergunta" || data.kind === "distribuicao"
      ? data.bars.map((b) => ({ label: b.label, valor: b.value, sufixo: "" }))
      : data.bars.map((b) => ({ label: b.label, valor: b.pct, sufixo: "%" }));
  const max = Math.max(1, ...bars.map((b) => b.valor));
  if (!bars.length)
    return <p className="py-8 text-center text-sm text-muted-foreground">Sem dados.</p>;
  return (
    <div className="space-y-2">
      {bars.map((b, i) => (
        <div key={i}>
          <div className="mb-0.5 flex justify-between text-xs">
            <span className="truncate pr-2 text-muted-foreground">{b.label}</span>
            <span className="shrink-0 font-medium">
              {b.valor}
              {b.sufixo}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(b.valor / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" className="stroke-muted" strokeWidth="12" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        className="stroke-primary"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-[20px] font-bold">
        {pct}%
      </text>
    </svg>
  );
}

function Linha({ points }: { points: { label: string; pct: number }[] }) {
  if (points.length < 2)
    return <p className="py-8 text-center text-sm text-muted-foreground">Poucos dias com dados.</p>;
  const W = 280,
    H = 90,
    pad = 6;
  const step = (W - pad * 2) / (points.length - 1);
  const pts = points.map((p, i) => {
    const x = pad + i * step;
    const y = pad + (H - pad * 2) * (1 - p.pct / 100);
    return `${x},${y}`;
  });
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <polyline points={pts.join(" ")} fill="none" className="stroke-primary" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => {
          const [x, y] = pts[i].split(",").map(Number);
          return <circle key={i} cx={x} cy={y} r="2.5" className="fill-primary" />;
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}

// Dialog "Novo relatório" — descrição em texto ou áudio.
function NovoDialog({ formId, onClose }: { formId: string; onClose: () => void }) {
  const [state, action, pend] = useActionState(
    novoRelatorio.bind(null, formId),
    {} as RelState,
  );
  const [texto, setTexto] = useState("");
  const [audio, setAudio] = useState<string | null>(null);
  const [gravando, setGravando] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  async function gravar() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const r = new FileReader();
        r.onloadend = () => setAudio(String(r.result));
        r.readAsDataURL(blob);
      };
      recRef.current = rec;
      rec.start();
      setGravando(true);
      setTimeout(() => rec.state !== "inactive" && rec.stop(), 30000);
    } catch {
      /* sem microfone */
    }
  }
  function parar() {
    recRef.current?.stop();
    setGravando(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        action={action}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold">Novo relatório</p>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-2 text-sm text-muted-foreground">
          Descreva o que quer ver (a IA escolhe o melhor gráfico). Pode falar também.
        </p>
        <input type="hidden" name="audio" value={audio ?? ""} />
        <textarea
          name="descricao"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          placeholder="Ex.: conformidade por loja; perguntas que mais reprovam; evolução no mês…"
          className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-2 flex items-center gap-2">
          {!gravando ? (
            <Button type="button" variant="outline" size="sm" onClick={gravar}>
              <Mic className="h-4 w-4" /> {audio ? "Regravar" : "Falar"}
            </Button>
          ) : (
            <Button type="button" variant="danger" size="sm" onClick={parar}>
              <Square className="h-4 w-4" /> Parar
            </Button>
          )}
          {audio && !gravando && <span className="text-xs text-success">áudio gravado ✓</span>}
        </div>

        {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pend || (!texto.trim() && !audio)}>
            {pend ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Criar com IA
          </Button>
        </div>
      </form>
    </div>
  );
}
