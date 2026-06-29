"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, UploadCloud } from "lucide-react";
import { listOutbox } from "@/lib/offline-db";
import { onOutboxChange } from "@/lib/offline-sync";

// Diagnóstico operacional — SÓ LEITURA. Status de conexão (navigator.onLine)
// e contagem de envios pendentes na fila local. Sem sincronização manual.
export function OpDiagnostics() {
  const [online, setOnline] = useState(true);
  const [pendentes, setPendentes] = useState<number | null>(null);

  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);

    let vivo = true;
    const refresh = () =>
      listOutbox()
        .then((s) => vivo && setPendentes(s.length))
        .catch(() => {});
    refresh();
    const off = onOutboxChange(refresh);

    return () => {
      vivo = false;
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
      off();
    };
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border py-3 first:pt-0">
        <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {online ? (
            <Wifi className="h-4 w-4 text-muted-foreground" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
          Status de conexão
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span
            className={`h-2 w-2 rounded-full ring-2 ${
              online
                ? "bg-success ring-success/20"
                : "bg-danger ring-danger/20"
            }`}
          />
          {online ? "Online" : "Offline"}
        </span>
      </div>
      <div className="flex items-center justify-between py-3 last:pb-0">
        <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <UploadCloud className="h-4 w-4 text-muted-foreground" />
          Envios pendentes
        </span>
        <span className="text-sm font-semibold text-muted-foreground">
          {pendentes === null ? "—" : pendentes === 0 ? "Nenhum" : pendentes}
        </span>
      </div>
    </div>
  );
}
