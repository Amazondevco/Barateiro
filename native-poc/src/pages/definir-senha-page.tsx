import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useAuth } from "../context/auth-context";
import { useI18n } from "../lib/i18n/i18n";
import { clearPendingCadastro } from "../lib/deep-links";
import { Button } from "../ui/button";
import { Input, Label } from "../ui/input";
import logoUrl from "../assets/checkai-logo.svg";

const WEB_BASE = "https://check-ai-br.vercel.app";

// Critérios da senha (iguais aos do PWA): mín. 7, 1 maiúscula, 1 número.
function criterios(senha: string) {
  return [
    { ok: senha.length >= 7, texto: "Ao menos 7 caracteres" },
    { ok: /[A-Z]/.test(senha), texto: "1 letra maiúscula" },
    { ok: /[0-9]/.test(senha), texto: "1 número" },
  ];
}
function senhaValida(senha: string) {
  return criterios(senha).every((c) => c.ok);
}

// Conclusão de cadastro no APP (alvo do App Link do convite). Lê o token da query,
// define a senha pelo endpoint público e entra — tudo dentro do app nativo.
export function DefinirSenhaPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const token = params.get("convite") ?? "";
  const email = params.get("email") ?? "";
  const nome = params.get("nome") ?? "";

  // Sem token → link malformado: descarta o pendente para liberar o login.
  useEffect(() => {
    if (!token) clearPendingCadastro();
  }, [token]);

  // Já logado nesta sessão → não conclui cadastro de outra pessoa; libera o app.
  useEffect(() => {
    if (user) clearPendingCadastro();
  }, [user]);

  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Já logado → não faz sentido ficar aqui.
  if (user) return <Navigate to="/app" replace />;

  // Sem token → link inválido.
  if (!token) {
    return (
      <Tela>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("Link inválido ou expirado")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("Abra o link mais recente ou peça um novo ao administrador.")}
        </p>
        <button
          onClick={() => navigate("/login")}
          className="mt-4 text-sm font-medium text-primary"
        >
          {t("Ir para o login")}
        </button>
      </Tela>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!senhaValida(senha)) return setError(t("A senha não cumpre os requisitos."));
    if (senha !== confirma) return setError(t("As senhas não conferem."));

    setLoading(true);
    try {
      const res = await fetch(`${WEB_BASE}/api/definir-senha-convite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, senha }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        email?: string;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setLoading(false);
        // Link morto (usado/inválido) → descarta o pendente p/ liberar o login.
        if (res.status === 404 || res.status === 409) clearPendingCadastro();
        return setError(json.error ?? t("Não foi possível concluir. Tente novamente."));
      }
      // Concluído (conta associada à rede) → limpa o pendente e vai pro LOGIN,
      // com o e-mail já preenchido, para o usuário entrar.
      clearPendingCadastro();
      const alvo = `/login?email=${encodeURIComponent(json.email ?? email)}&cadastro=ok`;
      navigate(alvo, { replace: true });
    } catch {
      setLoading(false);
      setError(t("Não foi possível concluir. Tente novamente."));
    }
  }

  const lista = criterios(senha);
  const ativo = senha.length > 0;

  return (
    <Tela>
      <h1 className="text-3xl font-bold tracking-tight">{t("Defina sua senha")}</h1>
      <p className="mt-1.5 break-words text-sm text-muted-foreground">
        {nome ? `${t("Olá")}, ${nome.split(" ")[0]}. ` : ""}
        {t("Crie uma senha para acessar sua conta.")}
        {email ? ` (${email})` : ""}
      </p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="senha">{t("Crie uma senha")}</Label>
          <Input
            id="senha"
            type="password"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <ul className="mt-2 space-y-1.5">
            {lista.map((c) => {
              const estado = !ativo ? "neutro" : c.ok ? "ok" : "falta";
              return (
                <li key={c.texto} className="flex items-center gap-2 text-xs font-medium">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      estado === "ok"
                        ? "bg-success-bg text-success"
                        : estado === "falta"
                          ? "bg-danger-bg text-danger"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {estado === "ok" ? (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    ) : estado === "falta" ? (
                      <X className="h-3 w-3" strokeWidth={3} />
                    ) : (
                      <span className="h-1 w-1 rounded-full bg-current" />
                    )}
                  </span>
                  <span
                    className={
                      estado === "ok"
                        ? "text-success"
                        : estado === "falta"
                          ? "text-danger"
                          : "text-muted-foreground"
                    }
                  >
                    {t(c.texto)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <Label htmlFor="confirma">{t("Confirmar senha")}</Label>
          <Input
            id="confirma"
            type="password"
            autoComplete="new-password"
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
            required
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? t("Salvando…") : t("Criar senha e entrar")}
        </Button>
      </form>
    </Tela>
  );
}

// Casca fixa (sem rolagem), no conceito da tela de login: logo verde + conteúdo.
function Tela({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col justify-center overflow-hidden bg-background p-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <img src={logoUrl} alt="Check.AI" className="h-10 w-10 rounded-2xl shadow-sm" />
          <span className="text-xl font-bold tracking-tight">
            Check<span className="text-[#15803d]">.AI</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
