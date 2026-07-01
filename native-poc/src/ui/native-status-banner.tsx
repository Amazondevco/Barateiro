import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { getQueueItems } from "../lib/queue-store";
import { useNetworkStatus } from "../lib/use-network-status";
import { useI18n } from "../lib/i18n/i18n";

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
  const { t } = useI18n();
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
            {t("Offline")}
          </span>
        ) : null}

        {queue.pending > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
            {t("{n} envio(s) pendente(s)", { n: queue.pending })}
          </span>
        ) : null}

        {queue.errors > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-danger">
            {t("{n} erro(s) de sincronização", { n: queue.errors })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
