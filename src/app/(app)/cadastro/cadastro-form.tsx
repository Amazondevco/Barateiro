"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Camera, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { TERMO_PRIVACIDADE, TERMO_VERSAO } from "@/lib/termo-privacidade";

// ---------- máscaras / validações ----------
const onlyDigits = (s: string) => s.replace(/\D/g, "");

function maskCPF(v: string) {
  return onlyDigits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function maskCelular(v: string) {
  return onlyDigits(v)
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}
function maskCEP(v: string) {
  return onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}
function cpfValido(cpf: string) {
  const c = onlyDigits(cpf);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += +c[i] * (10 - i);
  let d1 = (s * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== +c[9]) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += +c[i] * (11 - i);
  let d2 = (s * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === +c[10];
}

const PASSOS = ["Identificação", "Endereço", "Foto", "Termo"] as const;

export function CadastroForm() {
  const router = useRouter();
  const [passo, setPasso] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // identificação
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");

  // endereço (opcional)
  const [cep, setCep] = useState("");
  const [uf, setUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);

  // foto
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const inputCamera = useRef<HTMLInputElement>(null);
  const inputGaleria = useRef<HTMLInputElement>(null);

  // termo
  const [aceite, setAceite] = useState(false);

  async function buscarCep(valor: string) {
    const c = onlyDigits(valor);
    if (c.length !== 8) return;
    setBuscandoCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setUf(d.uf ?? "");
        setCidade(d.localidade ?? "");
        setBairro(d.bairro ?? "");
        setLogradouro(d.logradouro ?? "");
      }
    } catch {
      /* silencioso — usuário pode preencher à mão */
    } finally {
      setBuscandoCep(false);
    }
  }

  function onFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFoto(f);
    setFotoPreview(URL.createObjectURL(f));
  }

  // ---------- validação por passo ----------
  function validarPasso(): string | null {
    if (passo === 0) {
      if (!nome.trim()) return "Informe seu nome completo.";
      if (!cpfValido(cpf)) return "CPF inválido.";
      if (!/^\S+@\S+\.\S+$/.test(email)) return "E-mail inválido.";
      if (onlyDigits(celular).length < 10) return "Celular inválido.";
      if (senha.length < 6) return "A senha precisa ter ao menos 6 caracteres.";
      if (senha !== senha2) return "As senhas não conferem.";
    }
    if (passo === 2 && !foto) return "A foto de perfil é obrigatória.";
    if (passo === 3 && !aceite) return "É preciso aceitar o termo para continuar.";
    return null;
  }

  function avancar() {
    const e = validarPasso();
    if (e) return setErro(e);
    setErro(null);
    setPasso((p) => Math.min(p + 1, PASSOS.length - 1));
  }
  function voltar() {
    setErro(null);
    setPasso((p) => Math.max(p - 1, 0));
  }

  async function finalizar() {
    const e = validarPasso();
    if (e) return setErro(e);
    setErro(null);
    setEnviando(true);
    const supabase = createClient();
    try {
      // 1) sobe a foto
      let foto_url = "";
      if (foto) {
        const ext = foto.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage
          .from("identidade-fotos")
          .upload(path, foto, { upsert: false });
        if (up.error) throw up.error;
        foto_url = supabase.storage.from("identidade-fotos").getPublicUrl(path)
          .data.publicUrl;
      }

      // 2) cria a conta (e-mail de confirmação nativo do Supabase)
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          emailRedirectTo: `${location.origin}/cadastro/confirmado`,
          data: {
            tipo: "app",
            nome: nome.trim(),
            cpf: onlyDigits(cpf),
            celular: onlyDigits(celular),
            foto_url,
            cep: onlyDigits(cep),
            uf,
            cidade,
            bairro,
            logradouro,
            numero,
            complemento,
            termo_versao: TERMO_VERSAO,
          },
        },
      });
      if (error) throw error;
      router.push("/cadastro/confirme");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar conta.";
      setErro(
        /already registered|duplicate|unique/i.test(msg)
          ? "CPF ou e-mail já cadastrado."
          : msg,
      );
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col p-5">
      {/* cabeçalho */}
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Criar conta</p>
            <p className="text-xs text-muted-foreground">
              Passo {passo + 1} de {PASSOS.length} · {PASSOS[passo]}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {PASSOS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= passo ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {/* PASSO 1 — Identificação */}
        {passo === 0 && (
          <>
            <Campo label="Nome completo">
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" autoComplete="off" />
            </Campo>
            <Campo label="CPF">
              <Input value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" autoComplete="off" />
            </Campo>
            <Campo label="E-mail">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@email.com" autoComplete="off" />
            </Campo>
            <Campo label="Celular">
              <Input value={celular} onChange={(e) => setCelular(maskCelular(e.target.value))} placeholder="(00) 00000-0000" inputMode="numeric" autoComplete="off" />
            </Campo>
            <Campo label="Senha">
              <Input value={senha} onChange={(e) => setSenha(e.target.value)} type="password" placeholder="mín. 6 caracteres" autoComplete="new-password" />
            </Campo>
            <Campo label="Confirmar senha">
              <Input value={senha2} onChange={(e) => setSenha2(e.target.value)} type="password" placeholder="repita a senha" autoComplete="new-password" />
            </Campo>
          </>
        )}

        {/* PASSO 2 — Endereço (opcional) */}
        {passo === 1 && (
          <>
            <p className="text-xs text-muted-foreground">
              Endereço é opcional. O CEP preenche o resto automaticamente.
            </p>
            <Campo label="CEP">
              <div className="relative">
                <Input
                  value={cep}
                  onChange={(e) => {
                    const v = maskCEP(e.target.value);
                    setCep(v);
                    if (onlyDigits(v).length === 8) buscarCep(v);
                  }}
                  placeholder="00000-000"
                  inputMode="numeric"
                />
                {buscandoCep && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
            </Campo>
            <div className="grid grid-cols-[1fr_80px] gap-3">
              <Campo label="Cidade">
                <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
              </Campo>
              <Campo label="UF">
                <Input value={uf} onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))} />
              </Campo>
            </div>
            <Campo label="Bairro">
              <Input value={bairro} onChange={(e) => setBairro(e.target.value)} />
            </Campo>
            <Campo label="Rua / Avenida">
              <Input value={logradouro} onChange={(e) => setLogradouro(e.target.value)} />
            </Campo>
            <div className="grid grid-cols-[100px_1fr] gap-3">
              <Campo label="Número">
                <Input value={numero} onChange={(e) => setNumero(e.target.value)} inputMode="numeric" />
              </Campo>
              <Campo label="Complemento">
                <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="apto, bloco…" />
              </Campo>
            </div>
          </>
        )}

        {/* PASSO 3 — Foto (obrigatória) */}
        {passo === 2 && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted/30">
              {fotoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoPreview} alt="Prévia" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* inputs ocultos: câmera e galeria */}
            <input
              ref={inputCamera}
              type="file"
              accept="image/*"
              capture="user"
              onChange={onFoto}
              className="hidden"
            />
            <input
              ref={inputGaleria}
              type="file"
              accept="image/*"
              onChange={onFoto}
              className="hidden"
            />

            <div className="flex w-full gap-2">
              <Button
                type="button"
                onClick={() => inputCamera.current?.click()}
                className="flex-1"
              >
                <Camera className="h-4 w-4" /> Tirar foto
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => inputGaleria.current?.click()}
                className="flex-1"
              >
                <ImageIcon className="h-4 w-4" /> Galeria
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {fotoPreview ? "Foto adicionada" : "Foto obrigatória"}
            </p>
          </div>
        )}

        {/* PASSO 4 — Termo */}
        {passo === 3 && (
          <>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {TERMO_PRIVACIDADE}
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={aceite}
                onChange={(e) => setAceite(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>
                Li e aceito o{" "}
                <Link href="/termo" className="text-primary underline" target="_blank">
                  Termo de Privacidade
                </Link>
                .
              </span>
            </label>
          </>
        )}
      </div>

      {erro && (
        <p className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>
      )}

      {/* navegação */}
      <div className="mt-4 flex gap-2">
        {passo > 0 && (
          <Button variant="outline" onClick={voltar} disabled={enviando} className="flex-1">
            Voltar
          </Button>
        )}
        {passo < PASSOS.length - 1 ? (
          <Button onClick={avancar} className="flex-1">
            Continuar
          </Button>
        ) : (
          <Button onClick={finalizar} disabled={enviando} className="flex-1">
            {enviando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Criando…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Criar conta
              </>
            )}
          </Button>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
