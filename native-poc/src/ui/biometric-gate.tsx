import { useEffect, useRef, useState } from "react";
import { Fingerprint } from "lucide-react";
import { App as CapApp } from "@capacitor/app";
import { isBiometricEnabled, verifyBiometric } from "../lib/biometric";
import { isNativePlatform } from "../lib/platform";
import { Button } from "./button";
import logoUrl from "../assets/checkai-logo.svg";

// Trava a interface logada atrás da biometria quando o usuário ativou
// "Desbloqueio por biometria" na Config. Re-trava ao voltar do background.
export function BiometricGate({ children }: { children: React.ReactNode }) {
  const armado = isNativePlatform() && isBiometricEnabled();
  const [locked, setLocked] = useState(armado);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const verificando = useRef(false);

  async function unlock() {
    if (verificando.current) return;
    verificando.current = true;
    const ok = await verifyBiometric();
    verificando.current = false;
    if (ok) setLocked(false);
  }

  useEffect(() => {
    if (!armado) return;

    // pede biometria ao abrir
    void unlock();

    // ao voltar pro app, re-trava e pede de novo; ao sair, marca travado
    const handle = CapApp.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        if (isBiometricEnabled()) setLocked(true);
      } else if (lockedRef.current) {
        void unlock();
      }
    });

    return () => {
      void handle.then((h) => h.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!locked) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center">
      <img src={logoUrl} alt="Check.AI" className="h-16 w-16 rounded-2xl shadow-sm" />
      <div>
        <p className="text-lg font-semibold">Check<span className="text-[#15803d]">.AI</span></p>
        <p className="mt-1 text-sm text-muted-foreground">
          App bloqueado. Use a biometria para desbloquear.
        </p>
      </div>
      <Button type="button" onClick={() => void unlock()}>
        <Fingerprint className="h-4 w-4" />
        Desbloquear
      </Button>
    </div>
  );
}
