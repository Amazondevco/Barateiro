import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { getQueueItems } from "../lib/queue-store";
import { useNetworkStatus } from "../lib/use-network-status";

type QueueSummary = {
  pending: number;
  errors: number;
};

async function readQueueSummary() {
  const items = await getQueueItems();

  return {
    pending: items.filter((item) => item.status === "pending").length,
    errors: items.filter((item) => item.status === "error").length,
  };
}

export function NativeStatusBanner() {
  const network = useNetworkStatus();
  const [queue, setQueue] = useState<QueueSummary>({ pending: 0, errors: 0 });

  useEffect(() => {
    let mounted = true;

    async function refreshQueue() {
      const nextQueue = await readQueueSummary();

      if (mounted) {
        setQueue(nextQueue);
      }
    }

    void refreshQueue();

    const intervalId = window.setInterval(() => {
      void refreshQueue();
    }, 4000);

    window.addEventListener("focus", refreshQueue);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshQueue);
    };
  }, []);

  if (network.connected && queue.pending === 0 && queue.errors === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-2 z-50 -translate-x-1/2">
      <div className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-md">
        {!network.connected ? (
          <span className="inline-flex items-center gap-1.5">
            <CloudOff className="h-3.5 w-3.5 text-warning" />
            Offline
          </span>
        ) : null}

        {queue.pending > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
            {queue.pending} envio{queue.pending > 1 ? "s" : ""} pendente
            {queue.pending > 1 ? "s" : ""}
          </span>
        ) : null}

        {queue.errors > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-danger">
            {queue.errors} erro{queue.errors > 1 ? "s" : ""} de sincronização
          </span>
        ) : null}
      </div>
    </div>
  );
}
