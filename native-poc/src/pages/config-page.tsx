import { useEffect, useState } from "react";
import { LogOut, MoonStar, RefreshCcw, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "../context/auth-context";
import { getQueueItems } from "../lib/queue-store";
import { syncQueue } from "../lib/sync";
import { useNetworkStatus } from "../lib/use-network-status";

type QueueSummary = {
  pending: number;
  synced: number;
  errors: number;
};

const emptyQueue: QueueSummary = {
  pending: 0,
  synced: 0,
  errors: 0,
};

export function ConfigPage() {
  const { signOutUser } = useAuth();
  const network = useNetworkStatus();
  const [queue, setQueue] = useState<QueueSummary>(emptyQueue);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshQueue() {
    const items = await getQueueItems();

    setQueue({
      pending: items.filter((item) => item.status === "pending").length,
      synced: items.filter((item) => item.status === "synced").length,
      errors: items.filter((item) => item.status === "error").length,
    });
  }

  useEffect(() => {
    void refreshQueue();

    const intervalId = window.setInterval(() => {
      void refreshQueue();
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  async function handleSyncNow() {
    setMessage(null);
    setError(null);

    if (!network.connected) {
      setError("Sem internet no momento. O app mantém os envios na fila e sincroniza quando voltar.");
      return;
    }

    try {
      setSyncing(true);
      await syncQueue();
      await refreshQueue();
      setMessage("Fila verificada. Envios pendentes foram sincronizados quando possível.");
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Não foi possível sincronizar agora.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="app-main stack-lg">
      <header className="page-header">
        <div>
          <p className="eyebrow">Configurações</p>
          <h1>Preferências do app</h1>
        </div>
      </header>

      <section className="card stack-md">
        <div className="profile-row">
          <div className="profile-icon">
            {network.connected ? <Wifi size={16} /> : <WifiOff size={16} />}
          </div>
          <div>
            <p className="summary-label">Conexão</p>
            <strong>{network.connected ? "Online" : "Offline"}</strong>
            <p className="muted-text">
              Tipo: {network.loading ? "verificando..." : network.connectionType || "desconhecido"}
            </p>
          </div>
        </div>

        <div className="queue-grid">
          <div>
            <span className="summary-label">Pendentes</span>
            <strong>{queue.pending}</strong>
          </div>
          <div>
            <span className="summary-label">Sincronizados</span>
            <strong>{queue.synced}</strong>
          </div>
          <div>
            <span className="summary-label">Com erro</span>
            <strong>{queue.errors}</strong>
          </div>
        </div>

        {message ? <p className="banner success inline-banner">{message}</p> : null}
        {error ? <p className="banner danger inline-banner">{error}</p> : null}

        <button className="primary-button" type="button" onClick={handleSyncNow} disabled={syncing}>
          <RefreshCcw className={syncing ? "spin" : ""} size={16} />
          {syncing ? "Sincronizando..." : "Sincronizar agora"}
        </button>
      </section>

      <section className="card stack-md">
        <div className="profile-row">
          <div className="profile-icon">
            <MoonStar size={16} />
          </div>
          <div>
            <p className="summary-label">Tema</p>
            <strong>Sistema</strong>
            <p className="muted-text">O app acompanha o padrão visual do Check.AI e a cor da rede.</p>
          </div>
        </div>

        <div className="profile-row">
          <div className="profile-icon">
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className="summary-label">Privacidade</p>
            <strong>Sessão protegida</strong>
            <p className="muted-text">Login salvo localmente para reduzir atrito no uso em campo.</p>
          </div>
        </div>
      </section>

      <button className="secondary-button" type="button" onClick={() => signOutUser()}>
        <LogOut size={16} />
        Sair da conta
      </button>
    </div>
  );
}
