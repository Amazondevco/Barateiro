import { useEffect, useState } from "react";
import { Fingerprint, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useAuth } from "../context/auth-context";
import {
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  verifyBiometric,
} from "../lib/biometric";
import { Button } from "../ui/button";

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

  useEffect(() => {
    void isBiometricAvailable().then(setBioAvailable);
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
