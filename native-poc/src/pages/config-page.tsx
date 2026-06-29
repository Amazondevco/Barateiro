import { LogOut, MoonStar, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/auth-context";

export function ConfigPage() {
  const { signOutUser } = useAuth();

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Configurações</p>
        <h1>Preferências do app</h1>
        <p className="hero-copy">Base inicial da SPA do operador para evoluir nas próximas etapas.</p>
      </header>

      <section className="card stack-sm">
        <div className="profile-row">
          <span className="profile-icon">
            <MoonStar size={16} />
          </span>
          <div>
            <p className="summary-label">Tema</p>
            <strong>Seguir configuração do sistema</strong>
          </div>
        </div>

        <div className="profile-row">
          <span className="profile-icon">
            <ShieldCheck size={16} />
          </span>
          <div>
            <p className="summary-label">Privacidade</p>
            <strong>Estrutura pronta para termo e preferências do dispositivo</strong>
          </div>
        </div>

        <button className="secondary-button" type="button" onClick={() => void signOutUser()}>
          <LogOut size={16} />
          Sair do app
        </button>
      </section>
    </div>
  );
}
