import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { Button } from "../ui/button";
import { Input, Label } from "../ui/input";

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
      setError(
        authError instanceof Error ? authError.message : "Falha ao autenticar.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background p-6">
      <div className="mx-auto w-full max-w-sm">
        {/* Marca */}
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <span className="text-lg font-bold">C</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            Check<span className="text-primary">.AI</span>
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">Entrar</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Acesse o app da sua rede.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com.br"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <p className="mt-8 text-xs text-muted-foreground">
          © Amazon Dev &amp; Co. · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
