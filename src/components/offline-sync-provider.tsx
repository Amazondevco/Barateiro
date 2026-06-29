"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { sincronizar, onOutboxChange, pendingCount } from "@/lib/offline-sync";

// Mostra o estado offline / fila de envios e dispara a sincronização.
export function OfflineSyncProvider() {
  const [pend, setPend] = useState(0);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let vivo = true;
    const refresh = () => pendingCount().then((n) => vivo && setPend(n));
    refresh();
    const off = onOutboxChange(refresh);

    const aoOnline = () => {
      setOnline(true);
      sincronizar();
    };
    const aoOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", aoOnline);
    window.addEventListener("offline", aoOffline);

    // tenta sincronizar ao montar
    sincronizar();

    return () => {
      vivo = false;
      off();
      window.removeEventListener("online", aoOnline);
      window.removeEventListener("offline", aoOffline);
    };
  }, []);

  if (online && pend === 0) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-md">
        {!online ? (
          <>
            <CloudOff className="h-3.5 w-3.5 text-warning" />
            Offline{pend > 0 ? ` · ${pend} p/ enviar` : ""}
          </>
        ) : (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
            Enviando {pend} {pend === 1 ? "formulário" : "formulários"}…
          </>
        )}
      </div>
    </div>
  );
}
