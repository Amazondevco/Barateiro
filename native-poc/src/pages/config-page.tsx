import { useEffect, useState } from "react";
import {
  LogOut,
  Monitor,
  Moon,
  RefreshCcw,
  Sun,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
import { getQueueItems } from "../lib/queue-store";
import { syncQueue } from "../lib/sync";
import { useNetworkStatus } from "../lib/use-network-status";
import { Button } from "../ui/button";

type QueueSummary = {
  pending: number;
  synced: number;
  errors: number;
};

const emptyQueue: QueueSummary = { pending: 0, synced: 0, errors: 0 };

type Theme = "system" | "light" | "dark";

function readTheme(): Theme {
  return (localStorage.getItem("checkai-theme") as Theme | null) ?? "system";
}

function applyTheme(t: Theme) {
  if (t === "system") {
    localStorage.removeItem("checkai-theme");
    const sys = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    document.documentElement.classList.toggle("dark", Boolean(sys));
  } else {
    localStorage.setItem("checkai-theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }
}

const THEME_OPTS: { v: Theme; label: string; icon: typeof Sun }[] = [
  { v: "system", label: "Sistema", icon: Monitor },
  { v: "light", label: "Claro", icon: Sun },
  { v: "dark", label: "Escuro", icon: Moon },
];

export function ConfigPage() {
  const { signOutUser } = useAuth();
  const network = useNetworkStatus();
  const [queue, setQueue] = useState<QueueSummary>(emptyQueue);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => readTheme());

  async function refreshQueue() {
    const items = await getQueueItems();
    setQueue({
      pending: items.filter((item) => item.status === "pending").length,
      synced: items.filter((item) => item.status === "synced").length,
      errors: items.filter((item) => item.status === "error").length,
    });
  }

  useEffect(() => {
    void refreshQueue();
    const intervalId = window.setInterval(() => void refreshQueue(), 4000);
    return () => window.clearInterval(intervalId);
  }, []);

  function escolherTema(t: Theme) {
    setTheme(t);
    applyTheme(t);
  }

  async function handleSyncNow() {
    setMessage(null);
    setError(null);

    if (!network.connected) {
      setError(
        "Sem internet no momento. O app mantém os envios na fila e sincroniza quando voltar.",
      );
      return;
    }

    try {
      setSyncing(true);
      await syncQueue();
      await refreshQueue();
      setMessage(
        "Fila verificada. Envios pendentes foram sincronizados quando possível.",
      );
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Não foi possível sincronizar agora.",
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-4">
      <header className="mt-2">
        <h1 className="text-xl font-semibold">Configurações</h1>
      </header>

      {/* Aparência */}
      <section>
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Aparência
        </p>
        <div className="rounded-xl border border-border bg-card p-2">
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTS.map((opt) => {
              const Icon = opt.icon;
              const on = theme === opt.v;
              return (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => escolherTema(opt.v)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition-colors ${
                    on
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Conexão & sincronização */}
      <section>
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Conexão & sincronização
        </p>
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {network.connected ? (
                <Wifi className="h-5 w-5" />
              ) : (
                <WifiOff className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {network.connected ? "Online" : "Offline"}
              </p>
              <p className="text-xs text-muted-foreground">
                Tipo:{" "}
                {network.loading
                  ? "verificando…"
                  : network.connectionType || "desconhecido"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              ["Pendentes", queue.pending],
              ["Sincronizados", queue.synced],
              ["Com erro", queue.errors],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg bg-muted p-3 text-center"
              >
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {message ? (
            <p className="rounded-lg bg-success-bg px-3 py-2 text-sm text-success">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            onClick={handleSyncNow}
            disabled={syncing}
          >
            <RefreshCcw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando…" : "Sincronizar agora"}
          </Button>
        </div>
      </section>

      {/* Conta */}
      <section>
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Conta
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => signOutUser()}
        >
          <LogOut className="h-4 w-4" />
          Sair da conta
        </Button>
      </section>
    </div>
  );
}
