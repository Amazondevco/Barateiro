"use client";

import { useEffect } from "react";

// Registra o service worker (instalação + offline básico).
// Em dev (localhost http) o navegador permite; em produção roda em HTTPS.
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("SW falhou:", err));
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
