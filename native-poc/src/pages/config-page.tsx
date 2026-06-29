import { useEffect, useState } from "react";
import {
  ChevronRight,
  Fingerprint,
  History,
  LogOut,
  Monitor,
  Moon,
  Sun,
  UploadCloud,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
import {
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  verifyBiometric,
} from "../lib/biometric";
import { useNetworkStatus } from "../lib/use-network-status";
import { getQueueItems } from "../lib/queue-store";

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
  const [theme, setTheme] = useState<Theme>(() => readTheme());
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(() => isBiometricEnabled());
  const [bioMsg, setBioMsg] = useState<string | null>(null);
  const net = useNetworkStatus();
  const [pendentes, setPendentes] = useState(0);

  useEffect(() => {
    void isBiometricAvailable().then(setBioAvailable);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      const items = await getQueueItems();
      if (mounted) setPendentes(items.filter((i) => i.status !== "synced").length);
    }
    void refresh();
    const id = setInterval(() => void refresh(), 5000);
    const onSynced = () => void refresh();
    window.addEventListener("checkai:queue-synced", onSynced);
    return () => {
      mounted = false;
      clearInterval(id);
      window.removeEventListener("checkai:queue-synced", onSynced);
    };
  }, []);

  async function toggleBio() {
    setBioMsg(null);
    if (bioOn) {
      setBiometricEnabled(false);
      setBioOn(false);
      return;
    }
    const ok = await verifyBiometric();
    if (!ok) {
      setBioMsg("Não foi possível confirmar a biometria.");
      return;
    }
    setBiometricEnabled(true);
    setBioOn(true);
  }

  function escolherTema(t: Theme) {
    setTheme(t);
    applyTheme(t);
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

      {/* Segurança — biometria (só quando o aparelho suporta) */}
      {bioAvailable ? (
        <section>
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Segurança
          </p>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Desbloqueio por biometria</p>
                <p className="text-xs text-muted-foreground">
                  Pede digital/face ao abrir o app.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={bioOn}
                onClick={() => void toggleBio()}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  bioOn ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    bioOn ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            {bioMsg ? (
              <p className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
                {bioMsg}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Diagnóstico Operacional — só leitura */}
      <section>
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Diagnóstico Operacional
        </p>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between border-b border-border py-3 first:pt-0 last:border-none last:pb-0">
            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {net.connected ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              Status de conexão
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span
                className={`h-2 w-2 rounded-full ${
                  net.connected ? "bg-success" : "bg-danger"
                }`}
              />
              {net.connected ? "Online" : "Offline"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-border py-3 last:border-none last:pb-0">
            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UploadCloud className="h-4 w-4" />
              Envios pendentes
            </span>
            <span
              className={`text-sm font-semibold ${
                pendentes > 0 ? "text-warning" : "text-muted-foreground"
              }`}
            >
              {pendentes > 0 ? pendentes : "Nenhum"}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 pb-0">
            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <History className="h-4 w-4" />
              Sincronização
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {net.connected && pendentes === 0 ? "Em dia" : "Pendente"}
            </span>
          </div>
        </div>
      </section>

      {/* Conta */}
      <section>
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Conta
        </p>
        <button
          type="button"
          onClick={() => signOutUser()}
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-danger/40 hover:bg-danger-bg/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-bg text-danger">
            <LogOut className="h-5 w-5" />
          </span>
          <span className="flex-1 text-[15px] font-semibold text-danger">
            Sair da conta
          </span>
          <ChevronRight className="h-5 w-5 text-danger/40" />
        </button>
      </section>
    </div>
  );
}
