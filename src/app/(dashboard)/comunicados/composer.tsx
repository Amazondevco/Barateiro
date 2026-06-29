"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  getRedeAlvos,
  enviarComunicado,
  type AlvoTipo,
  type RedeAlvos,
} from "@/lib/comunicado-actions";

const ALVOS: { v: AlvoTipo; label: string; lista?: keyof RedeAlvos }[] = [
  { v: "todos", label: "Todos da rede" },
  { v: "usuario", label: "Usuário(s)", lista: "usuarios" },
  { v: "unidade", label: "Unidade(s)", lista: "unidades" },
  { v: "departamento", label: "Departamento(s)", lista: "departamentos" },
  { v: "cargo", label: "Cargo(s)", lista: "cargos" },
];

export function ComunicadoComposer({
  isSuper,
  redes,
  redeFixa,
}: {
  isSuper: boolean;
  redes: { id: string; nome: string }[];
  redeFixa: { id: string; nome: string } | null;
}) {
  const [redeId, setRedeId] = useState(redeFixa?.id ?? "");
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [alvoTipo, setAlvoTipo] = useState<AlvoTipo>("todos");
  const [alvoIds, setAlvoIds] = useState<string[]>([]);
  const [alvos, setAlvos] = useState<RedeAlvos | null>(null);
  const [loadingAlvos, setLoadingAlvos] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    setAlvoIds([]);
    if (!redeId) {
      setAlvos(null);
      return;
    }
    setLoadingAlvos(true);
    getRedeAlvos(redeId)
      .then(setAlvos)
      .finally(() => setLoadingAlvos(false));
  }, [redeId]);

  const listaKey = ALVOS.find((a) => a.v === alvoTipo)?.lista;
  const itens = listaKey && alvos ? alvos[listaKey] : [];

  function toggle(id: string) {
    setAlvoIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await enviarComunicado({
        redeId: redeId || null,
        titulo,
        corpo,
        alvoTipo,
        alvoIds,
      });
      if (r.error) {
        setMsg({ ok: false, text: r.error });
        return;
      }
      setMsg({ ok: true, text: "Comunicado enviado." });
      setTitulo("");
      setCorpo("");
      setAlvoTipo("todos");
      setAlvoIds([]);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-border bg-card p-4"
    >
      {isSuper && (
        <div>
          <Label htmlFor="rede">Rede</Label>
          <select
            id="rede"
            value={redeId}
            onChange={(e) => setRedeId(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          >
            <option value="">Selecione a rede…</option>
            {redes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex.: Manutenção no sistema amanhã"
          maxLength={120}
          required
        />
      </div>

      <div>
        <Label htmlFor="corpo">Mensagem</Label>
        <textarea
          id="corpo"
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          rows={4}
          placeholder="Escreva o comunicado…"
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        />
      </div>

      <div>
        <Label htmlFor="alvo">Enviar para</Label>
        <select
          id="alvo"
          value={alvoTipo}
          onChange={(e) => {
            setAlvoTipo(e.target.value as AlvoTipo);
            setAlvoIds([]);
          }}
          className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {ALVOS.map((a) => (
            <option key={a.v} value={a.v}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {alvoTipo !== "todos" && (
        <div>
          <Label>Destinatários</Label>
          {!redeId ? (
            <p className="text-sm text-muted-foreground">Selecione uma rede.</p>
          ) : loadingAlvos ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </p>
          ) : itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum item disponível nesta rede.
            </p>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {itens.map((it) => (
                <label
                  key={it.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={alvoIds.includes(it.id)}
                    onChange={() => toggle(it.id)}
                  />
                  {it.nome}
                </label>
              ))}
            </div>
          )}
          {alvoIds.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {alvoIds.length} selecionado(s)
            </p>
          )}
        </div>
      )}

      {msg && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            msg.ok
              ? "bg-success-bg text-success"
              : "bg-danger-bg text-danger"
          }`}
        >
          {msg.text}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Enviar comunicado
      </Button>
    </form>
  );
}
