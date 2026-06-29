import { useEffect, useState } from "react";
import { Network } from "@capacitor/network";

type NetworkState = {
  connected: boolean;
  connectionType: string;
  loading: boolean;
};

const fallbackStatus = (): NetworkState => ({
  connected: typeof navigator === "undefined" ? true : navigator.onLine,
  connectionType: "unknown",
  loading: false,
});

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkState>(() => ({
    ...fallbackStatus(),
    loading: true,
  }));

  useEffect(() => {
    let disposed = false;

    async function loadStatus() {
      try {
        const nextStatus = await Network.getStatus();

        if (!disposed) {
          setStatus({
            connected: nextStatus.connected,
            connectionType: nextStatus.connectionType,
            loading: false,
          });
        }
      } catch {
        if (!disposed) {
          setStatus(fallbackStatus());
        }
      }
    }

    void loadStatus();

    const listener = Network.addListener("networkStatusChange", (nextStatus) => {
      setStatus({
        connected: nextStatus.connected,
        connectionType: nextStatus.connectionType,
        loading: false,
      });
    });

    return () => {
      disposed = true;
      void listener.then((handle) => handle.remove());
    };
  }, []);

  return status;
}
