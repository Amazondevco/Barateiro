import { useEffect, useState } from "react";
import { RefreshCcw, WifiOff } from "lucide-react";
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
    <div className="native-status-banner">
      {!network.connected ? (
        <span>
          <WifiOff size={15} />
          Offline
        </span>
      ) : null}

      {queue.pending > 0 ? (
        <span>
          <RefreshCcw size={15} />
          {queue.pending} envio{queue.pending > 1 ? "s" : ""} pendente
          {queue.pending > 1 ? "s" : ""}
        </span>
      ) : null}

      {queue.errors > 0 ? (
        <span className="danger-text">
          {queue.errors} erro{queue.errors > 1 ? "s" : ""} de sincronização
        </span>
      ) : null}
    </div>
  );
}
