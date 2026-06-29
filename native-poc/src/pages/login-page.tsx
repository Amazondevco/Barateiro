import { useState } from "react";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";

export function LoginPage() {
  const { user, signInWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/app" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithPassword(email, password);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Falha ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen centered">
      <div className="login-card">
        <p className="eyebrow">Check.AI Native</p>
        <h1>Entrar no app do operador</h1>
        <p className="hero-copy">
          Sessão persistida no dispositivo para abrir a SPA sem SSR e com suporte ao modo offline.
        </p>

        {error ? <p className="banner danger inline-banner">{error}</p> : null}

        <form className="stack-md" onSubmit={handleSubmit}>
          <label className="field">
            <span>E-mail</span>
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={16} /> : <LogIn size={16} />}
            Entrar
          </button>
        </form>

        <div className="login-foot">
          <ShieldCheck size={18} />
          <span>Fluxo cliente com Supabase Auth e persistência local.</span>
        </div>
      </div>
    </div>
  );
}
