import { useEffect, useRef, useState } from "react";
import { Fingerprint } from "lucide-react";
import { verifyBiometric } from "../lib/biometric";
import { isNativePlatform } from "../lib/platform";
import { Button } from "./button";
import logoUrl from "../assets/checkai-logo.svg";

// Trava OBRIGATÓRIA na abertura do app (cold start): só entra com a biometria
// ou o código/PIN do celular. NÃO re-trava ao voltar do segundo plano — só
// quando o app é fechado de vez e aberto de novo (novo mount).
export function BiometricGate({ children }: { children: React.ReactNode }) {
  const armado = isNativePlatform();
  const [locked, setLocked] = useState(armado);
  const verificando = useRef(false);

  async function unlock() {
    if (verificando.current) return;
    verificando.current = true;
    const ok = await verifyBiometric();
    verificando.current = false;
    if (ok) setLocked(false);
  }

  useEffect(() => {
    if (armado) void unlock();
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
