"use client";

import { useEffect } from "react";

// Registra o service worker (só em produção/HTTPS; localhost também conta).
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Limpeza: remove qualquer SW antigo e seus caches (estavam travando telas
    // em dev ao servir JS velho). Reintroduzir PWA depois, de forma controlada.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
  }, []);

  return null;
}
