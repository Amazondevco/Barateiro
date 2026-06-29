import { BellRing, WifiOff } from "lucide-react";

export function NoticesPage() {
  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Avisos</p>
        <h1>Central de notificações</h1>
        <p className="hero-copy">
          Placeholder da Fase 1 para a área que depois vai receber push, avisos e sugestões do app nativo.
        </p>
      </header>

      <section className="card stack-sm">
        <div className="profile-row">
          <span className="profile-icon">
            <BellRing size={16} />
          </span>
          <div>
            <p className="summary-label">Push e avisos</p>
            <strong>Estrutura reservada para Fase 4</strong>
          </div>
        </div>

        <div className="profile-row">
          <span className="profile-icon">
            <WifiOff size={16} />
          </span>
          <div>
            <p className="summary-label">Comportamento offline</p>
            <strong>Mensagens locais e fila de sincronização continuam disponíveis</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
