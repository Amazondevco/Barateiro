import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { Button } from "../ui/button";
import { Input, Label } from "../ui/input";
import { ClientsCarousel } from "../ui/clients-carousel";
import { useI18n } from "../lib/i18n/i18n";
import logoUrl from "../assets/checkai-logo.svg";

export function LoginPage() {
  const { t } = useI18n();
  const { user, signInWithPassword } = useAuth();
  const [params] = useSearchParams();
  // Vindo da conclusão do cadastro (deep link): e-mail já preenchido + aviso.
  const [email, setEmail] = useState(params.get("email") ?? "");
  const cadastroOk = params.get("cadastro") === "ok";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        authError instanceof Error ? authError.message : t("Falha ao autenticar."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center bg-background p-6">
      <div className="mx-auto w-full max-w-sm">
        {/* Marca Check.AI (verde fixo da marca do produto) */}
        <div className="mb-8 flex items-center gap-2.5">
          <img
            src={logoUrl}
            alt="Check.AI"
            className="h-10 w-10 rounded-2xl shadow-sm"
          />
          <span className="text-xl font-bold tracking-tight">
            Check<span className="text-[#15803d]">.AI</span>
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">{t("Entrar")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("Acesse o app da sua rede.")}
        </p>

        {cadastroOk ? (
          <p className="mt-4 rounded-lg bg-success-bg px-3 py-2 text-sm text-success">
            {t("Cadastro concluído! Faça login para entrar.")}
          </p>
        ) : null}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email">{t("E-mail")}</Label>
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
            <Label htmlFor="password">{t("Senha")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("Ocultar senha") : t("Mostrar senha")}
                title={showPassword ? t("Ocultar senha") : t("Mostrar senha")}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {error ? (
            <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? t("Entrando…") : t("Entrar")}
          </Button>
        </form>

        <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>© Amazon Dev &amp; Co. · {new Date().getFullYear()}</span>
          <span className="tabular-nums opacity-70">v{__APP_VERSION__}</span>
        </div>
      </div>

      {/* Carrossel de logos (clientes) — fixo na base, decorativo */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <ClientsCarousel />
      </div>
    </div>
  );
}
