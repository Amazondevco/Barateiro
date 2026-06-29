"use client";

import { useEffect, useState } from "react";
import { Download, Share, Plus, X, Check } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Botão "Adicionar à tela inicial".
// Android/Chrome: dispara o prompt nativo (beforeinstallprompt).
// iOS/Safari: não há API → mostramos o passo a passo (Compartilhar → Adicionar).
export function AddToHome({ compact = false }: { compact?: boolean }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [instalado, setInstalado] = useState(true); // assume instalado até checar
  const [iOS, setIOS] = useState(false);
  const [ajudaIOS, setAjudaIOS] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;
    setInstalado(standalone);
    setIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalado(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Já instalado → nada a mostrar.
  if (instalado) return null;

  async function clicar() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalado(true);
      setDeferred(null);
    } else {
      // iOS (ou navegador sem prompt) → instruções
      setAjudaIOS(true);
    }
  }

  return (
    <>
      {compact ? (
        <button
          onClick={clicar}
          className="flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Download className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">
              Adicionar à tela inicial
            </span>
            <span className="block text-xs text-muted-foreground">
              Abra como um app, sem navegador.
            </span>
          </span>
          <Plus className="h-5 w-5 shrink-0 text-primary" />
        </button>
      ) : (
        <button
          onClick={clicar}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
        >
          <Download className="h-4 w-4" /> Adicionar à tela inicial
        </button>
      )}

      {ajudaIOS && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4"
          onClick={() => setAjudaIOS(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Adicionar à tela inicial</p>
              <button
                onClick={() => setAjudaIOS(false)}
                aria-label="Fechar"
                className="text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ol className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </span>
                <span className="flex items-center gap-1.5">
                  Toque em <Share className="h-4 w-4 text-primary" />
                  <b>Compartilhar</b>
                  {iOS ? " (barra do Safari)" : " no menu do navegador"}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  2
                </span>
                <span className="flex items-center gap-1.5">
                  Escolha <Plus className="h-4 w-4 text-primary" />
                  <b>Adicionar à Tela de Início</b>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  3
                </span>
                <span className="flex items-center gap-1.5">
                  Confirme em <Check className="h-4 w-4 text-success" />
                  <b>Adicionar</b>
                </span>
              </li>
            </ol>
            <button
              onClick={() => setAjudaIOS(false)}
              className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
