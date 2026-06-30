import { useEffect, useRef, useState } from "react";
import { Fingerprint } from "lucide-react";
import { App as CapApp } from "@capacitor/app";
import { verifyBiometric } from "../lib/biometric";
import { isNativePlatform } from "../lib/platform";
import { Button } from "./button";
import logoUrl from "../assets/checkai-logo.svg";

// Pede a biometria na ABERTURA do app, mas NÃO incomoda em recarregar a página
// (refresh) nem ao voltar do segundo plano rapidamente. Só volta a pedir quando o
// app foi FECHADO de vez ou ficou MUITO TEMPO fora.
const LIMITE_MS = 5 * 60 * 1000; // "muito tempo" = 5 min
const SESSAO_KEY = "checkai-bio-sessao"; // sessionStorage: some quando o app é morto
const ULTIMO_KEY = "checkai-bio-ultimo"; // localStorage: hora do último desbloqueio/saída

function recenteDesbloqueio(): boolean {
  try {
    // sem a flag de sessão → o processo é novo (app foi fechado) → pedir de novo.
    if (sessionStorage.getItem(SESSAO_KEY) !== "1") return false;
    const ultimo = Number(localStorage.getItem(ULTIMO_KEY) || 0);
    return Date.now() - ultimo < LIMITE_MS;
  } catch {
    return false;
  }
}
function marcarDesbloqueio() {
  try {
    sessionStorage.setItem(SESSAO_KEY, "1");
    localStorage.setItem(ULTIMO_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}
function marcarAtividade() {
  try {
    localStorage.setItem(ULTIMO_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const armado = isNativePlatform();
  // Trava no início só se NÃO for um refresh/retorno recente (mesmo processo).
  const [locked, setLocked] = useState(armado && !recenteDesbloqueio());
  const verificando = useRef(false);

  async function unlock() {
    if (verificando.current) return;
    verificando.current = true;
    const ok = await verifyBiometric();
    verificando.current = false;
    if (ok) {
      marcarDesbloqueio();
      setLocked(false);
    }
  }

  useEffect(() => {
    if (!armado) return;
    // Se já entrou destravado (refresh recente), registra atividade; senão pede.
    if (locked) void unlock();
    else marcarDesbloqueio();

    const sub = CapApp.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        // Saindo para o segundo plano: marca a hora (conta o tempo a partir daqui).
        marcarAtividade();
      } else {
        // Voltou: só re-trava se ficou MUITO TEMPO fora.
        const ultimo = Number(localStorage.getItem(ULTIMO_KEY) || 0);
        if (Date.now() - ultimo > LIMITE_MS) setLocked(true);
        else marcarAtividade();
      }
    });
    return () => {
      void sub.then((s) => s.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!locked) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
      <img src={logoUrl} alt="Check.AI" className="h-16 w-16 rounded-2xl shadow-sm" />
      <div>
        <p className="text-lg font-semibold">
          Check<span className="text-[#15803d]">.AI</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          App bloqueado. Use a biometria ou o código do celular para entrar.
        </p>
      </div>
      <Button type="button" onClick={() => void unlock()}>
        <Fingerprint className="h-4 w-4" />
        Desbloquear
      </Button>
    </div>
  );
}
