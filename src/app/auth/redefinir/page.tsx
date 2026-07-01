"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { validarSenha } from "@/lib/senha";
import { SenhaCriterios } from "@/components/senha-criterios";
import { definirSenhaPorConvite } from "./actions";

// Tela de cadastro do responsável / redefinição de senha (alvo do link).
// IMPORTANTE: visitar o link NÃO estabelece sessão (senão abrir o link de outra
// pessoa derrubaria a sua conta). Lemos o token do # só para PRÉ-PREENCHER os
// dados (decodificando o JWT). A sessão é criada apenas ao ENVIAR a nova senha.
type Ctx = { email: string; nome: string };

function makeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { detectSessionInUrl: false, persistSession: true } },
  );
}

// Decodifica o payload do JWT sem validar (só pra pré-preencher). Não cria sessão.
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    const json = decodeURIComponent(
      escape(atob(part.replace(/-/g, "+").replace(/_/g, "/"))),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function RedefinirSenhaPage() {
  const router = useRouter();
  // Captura o # na primeira render, antes de qualquer coisa tocar nele.
  const hashRef = useRef<string | null>(null);
  if (hashRef.current === null && typeof window !== "undefined") {
    hashRef.current = window.location.hash;
  }
  const tokensRef = useRef<{ access_token: string; refresh_token: string } | null>(null);
  // Fluxo novo (Opção A): token_hash na query, consumido só no submit.
  const tokenHashRef = useRef<string | null>(null);
  // Fluxo atual: convite PRÓPRIO (não expira por tempo). Token no query,
  // consumido só no submit por um server action (admin API).
  const conviteRef = useRef<string | null>(null);

  const [ready, setReady] = useState(false);
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = (hashRef.current ?? "").replace(/^#/, "");
    const search = typeof window !== "undefined" ? window.location.search : "";
    const q = new URLSearchParams(search);
    const p = new URLSearchParams(hash);
    // remove o token da URL (hash e query) sem estabelecer sessão
    if (hash || search) window.history.replaceState(null, "", window.location.pathname);

    // Fluxo atual: convite próprio (não expira). Só é consumido no submit.
    const convite = q.get("convite");
    if (convite) {
      conviteRef.current = convite;
      setCtx({ email: q.get("email") ?? "", nome: q.get("nome") ?? "" });
      setReady(true);
      return;
    }

    // Fluxo novo (Opção A): token_hash na query. NÃO consome aqui — só no submit
    // (verifyOtp), de modo que prévias de link (WhatsApp/antivírus) não queimem.
    const token_hash = q.get("token_hash");
    if (token_hash) {
      tokenHashRef.current = token_hash;
      setCtx({ email: q.get("email") ?? "", nome: q.get("nome") ?? "" });
      setReady(true);
      return;
    }

    if (p.get("error_description")) {
      setReady(true);
      return;
    }
    const access_token = p.get("access_token");
    const refresh_token = p.get("refresh_token");
    if (!access_token || !refresh_token) {
      setReady(true); // sem token → link inválido (NÃO usa a sessão atual)
      return;
    }

    const payload = decodeJwt(access_token);
    const exp = typeof payload?.exp === "number" ? payload.exp : 0;
    if (!payload || (exp && exp * 1000 < Date.now())) {
      setReady(true); // expirado/ilegível
      return;
    }

    tokensRef.current = { access_token, refresh_token };
    const meta = (payload.user_metadata ?? {}) as { nome?: string };
    setCtx({
      email: (payload.email as string) ?? "",
      nome: meta.nome ?? "",
    });
    setReady(true);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const erroSenha = validarSenha(senha);
    if (erroSenha) return setError(erroSenha);
    if (senha !== confirma) return setError("As senhas não conferem.");
    if (!conviteRef.current && !tokenHashRef.current && !tokensRef.current) {
      return setError("Link inválido — peça um novo.");
    }

    setLoading(true);
    const supabase = makeClient();

    // Fluxo atual: convite próprio. Server action define a senha (admin API) e
    // marca o convite como usado; depois entramos com e-mail+senha.
    if (conviteRef.current) {
      const r = await definirSenhaPorConvite(conviteRef.current, senha);
      if (r.error || !r.ok) {
        setLoading(false);
        return setError(r.error ?? "Não foi possível concluir. Tente novamente.");
      }
      const login = await supabase.auth.signInWithPassword({
        email: r.email ?? ctx?.email ?? "",
        password: senha,
      });
      setLoading(false);
      if (login.error) {
        // Senha foi salva; só a sessão falhou → manda pro login.
        setError("Senha criada! Faça login para entrar.");
        setTimeout(() => router.replace("/login"), 1200);
        return;
      }
      setDone(true);
      setTimeout(() => router.replace("/"), 1200);
      return;
    }

    // Só AGORA consumimos o link e estabelecemos a sessão desta pessoa.
    if (tokenHashRef.current) {
      // Fluxo novo: verifyOtp consome o token de uso único neste momento.
      const v = await supabase.auth.verifyOtp({
        type: "recovery",
        token_hash: tokenHashRef.current,
      });
      if (v.error) {
        setLoading(false);
        return setError("O link pode ter expirado — peça um novo.");
      }
    } else if (tokensRef.current) {
      // Fluxo antigo (compat): tokens vindos do # do redirect do Supabase.
      const set = await supabase.auth.setSession(tokensRef.current);
      if (set.error) {
        setLoading(false);
        return setError("O link pode ter expirado — peça um novo.");
      }
    }
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) {
      return setError("Não foi possível salvar. O link pode ter expirado — peça um novo.");
    }
    setDone(true);
    setTimeout(() => router.replace("/"), 1200);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Brand />
        </div>
        <Card>
          <CardContent>
            {done ? (
              <div className="space-y-3 text-center">
                <h2 className="text-lg font-semibold">Senha definida!</h2>
                <p className="text-sm text-muted-foreground">Entrando…</p>
              </div>
            ) : !ready ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : !ctx ? (
              <div className="space-y-3 text-center">
                <h2 className="text-lg font-semibold">Link inválido ou expirado</h2>
                <p className="text-sm text-muted-foreground">
                  Abra o link mais recente ou peça um novo ao administrador.
                </p>
                <a
                  href="/login"
                  className="inline-block text-sm font-medium text-primary hover:underline"
                >
                  Ir para o login
                </a>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Defina sua senha</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ctx.nome ? `Olá, ${ctx.nome}. ` : ""}Crie uma senha para acessar
                    sua conta.
                  </p>
                </div>

                <div>
                  <Label>Nome</Label>
                  <Input value={ctx.nome} readOnly disabled />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input value={ctx.email} readOnly disabled />
                </div>
                <div>
                  <Label htmlFor="senha">Crie uma senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                  <SenhaCriterios senha={senha} />
                </div>
                <div>
                  <Label htmlFor="confirma">Confirmar senha</Label>
                  <Input
                    id="confirma"
                    type="password"
                    autoComplete="new-password"
                    value={confirma}
                    onChange={(e) => setConfirma(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Salvando…" : "Criar senha e entrar"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
