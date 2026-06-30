"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "loading";
type Toast = { id: string; type: ToastType; message: string };
type ToastInput = { type?: ToastType; message: string; duration?: number };

type ToastApi = {
  show: (t: ToastInput) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  loading: (message: string) => string;
  update: (id: string, patch: ToastInput) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

// Tempo padrão por tipo (ms). loading = 0 → não some sozinho.
const PADRAO: Record<ToastType, number> = {
  success: 3500,
  info: 4000,
  error: 5500,
  loading: 0,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const seq = useRef(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) {
      clearTimeout(tm);
      timers.current.delete(id);
    }
  }, []);

  const arm = useCallback(
    (id: string, type: ToastType, duration?: number) => {
      const old = timers.current.get(id);
      if (old) clearTimeout(old);
      const ms = duration ?? PADRAO[type];
      if (ms > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), ms),
        );
      }
    },
    [dismiss],
  );

  const show = useCallback(
    (t: ToastInput) => {
      const id = `t${seq.current++}`;
      const type = t.type ?? "info";
      setToasts((prev) => [...prev, { id, type, message: t.message }]);
      arm(id, type, t.duration);
      return id;
    },
    [arm],
  );

  const update = useCallback(
    (id: string, patch: ToastInput) => {
      setToasts((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, type: patch.type ?? t.type, message: patch.message }
            : t,
        ),
      );
      arm(id, patch.type ?? "info", patch.duration);
    },
    [arm],
  );

  const api: ToastApi = {
    show,
    success: (message, duration) => show({ type: "success", message, duration }),
    error: (message, duration) => show({ type: "error", message, duration }),
    info: (message, duration) => show({ type: "info", message, duration }),
    loading: (message) => show({ type: "loading", message }),
    update,
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,24rem)] flex-col gap-2.5">
            {toasts.map((t) => (
              <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

const ESTILO: Record<
  ToastType,
  { card: string; icon: string; texto: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    card: "border-success/30 bg-success-bg",
    icon: "bg-success text-white",
    texto: "text-success",
    Icon: CheckCircle2,
  },
  error: {
    card: "border-danger/30 bg-danger-bg",
    icon: "bg-danger text-white",
    texto: "text-danger",
    Icon: AlertCircle,
  },
  info: {
    card: "border-primary/30 bg-primary/10",
    icon: "bg-primary text-primary-foreground",
    texto: "text-foreground",
    Icon: Info,
  },
  loading: {
    card: "border-border bg-card",
    icon: "bg-muted text-muted-foreground",
    texto: "text-foreground",
    Icon: Loader2,
  },
};

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const s = ESTILO[toast.type];
  const Icon = s.Icon;
  return (
    <div
      role="status"
      className={`toast-in pointer-events-auto relative flex items-center gap-3 rounded-2xl border ${s.card} px-4 py-3.5 pr-5 shadow-md`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.icon}`}
      >
        <Icon className={`h-4 w-4 ${toast.type === "loading" ? "animate-spin" : ""}`} />
      </span>
      <p className={`min-w-0 flex-1 text-sm font-medium ${s.texto}`}>
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fora do provider: vira no-op para nunca quebrar quem chama.
    const noop = () => "";
    return {
      show: noop,
      success: noop,
      error: noop,
      info: noop,
      loading: noop,
      update: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}

// Dispara toast a partir do estado de um Server Action (useActionState).
// Mostra `success` quando state.ok, ou o erro quando state.error.
export function useActionToast(
  state: { ok?: boolean; error?: string } | undefined,
  opts: { success?: string },
) {
  const { toast } = useToastBundle();
  const anterior = useRef(state);
  useEffect(() => {
    if (state === anterior.current) return;
    anterior.current = state;
    if (state?.ok && opts.success) toast.success(opts.success);
    else if (state?.error) toast.error(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

// Pequeno helper para não repetir useToast() em cada arquivo.
function useToastBundle() {
  const toast = useToast();
  return { toast };
}
