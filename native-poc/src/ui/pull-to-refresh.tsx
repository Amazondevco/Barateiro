import { useRef, useState } from "react";
import { Loader2, ArrowDown } from "lucide-react";

// Puxar de cima pra baixo (no topo da tela) recarrega — como num navegador.
// Chama onRefresh; quem usa decide (checar OTA + recarregar).
const THRESHOLD = 70;

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    startY.current = window.scrollY <= 0 && !refreshing ? e.touches[0].clientY : null;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && window.scrollY <= 0) {
      setPull(Math.min(dy * 0.5, 90)); // com resistência
    } else {
      setPull(0);
    }
  }
  async function onTouchEnd() {
    const armado = startY.current != null && pull >= THRESHOLD && !refreshing;
    startY.current = null;
    if (armado) {
      setRefreshing(true);
      setPull(48);
      try {
        await onRefresh();
      } finally {
        // Se não recarregou (sem update), volta ao normal.
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden text-muted-foreground"
        style={{ height: pull, transition: startY.current == null ? "height .2s" : "none" }}
      >
        {refreshing ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : pull > 8 ? (
          <ArrowDown
            className="h-5 w-5"
            style={{
              transform: pull >= THRESHOLD ? "rotate(180deg)" : "none",
              transition: "transform .15s",
              color: pull >= THRESHOLD ? "var(--primary)" : undefined,
            }}
          />
        ) : null}
      </div>
      {children}
    </div>
  );
}
