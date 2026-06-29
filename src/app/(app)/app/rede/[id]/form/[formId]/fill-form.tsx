"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SignaturePad } from "../../../../signature-pad";

type Item = {
  id: string;
  texto: string;
  ordem: number;
  tipo: string;
  opcoes: string[] | null;
  ajuda: string | null;
  obriga_obs_quando_nao: boolean;
  obriga_foto_quando_nao: boolean;
};
type Secao = {
  id: string;
  titulo: string;
  ordem: number;
  permite_na: boolean;
  formulario_itens: Item[];
};
export type FormData = {
  id: string;
  nome: string;
  descricao: string | null;
  formulario_secoes: Secao[];
};

// pares de botões por tipo
const PARES: Record<string, [string, string][]> = {
  ok_nao: [["ok", "OK"], ["nao", "NÃO"]],
  sim_nao: [["sim", "Sim"], ["nao", "Não"]],
  abastecido_ruptura: [["abastecido", "Abastecido"], ["ruptura", "Ruptura"]],
};

export function FillForm({
  redeMembroId,
  form,
  assinatura,
}: {
  redeMembroId: string;
  form: FormData;
  assinatura: string | null;
}) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>({});
  const [obs, setObs] = useState<Record<string, string>>({});
  const [assinada, setAssinada] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function setVal(id: string, v: string) {
    setValores((p) => ({ ...p, [id]: v }));
  }

  async function enviar() {
    if (!assinada) return setErro("Assine para enviar o formulário.");
    setErro(null);
    setEnviando(true);
    const itens = form.formulario_secoes.flatMap((s) =>
      s.formulario_itens.map((it) => ({
        item_id: it.id,
        valor: valores[it.id] ?? "",
        observacao: obs[it.id] ?? "",
        foto_url: "",
      })),
    );
    const supabase = createClient();
    const { error } = await supabase.rpc("enviar_resposta", {
      p_formulario: form.id,
      p_itens: itens,
      p_assinatura: assinada,
    });
    if (error) {
      setErro(error.message);
      setEnviando(false);
      return;
    }
    router.push(`/app/rede/${redeMembroId}?enviado=1`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <Link
          href={`/app/rede/${redeMembroId}`}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{form.nome}</p>
          {form.descricao && (
            <p className="truncate text-xs text-muted-foreground">{form.descricao}</p>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-5 p-4">
        {form.formulario_secoes.map((s) => (
          <div key={s.id} className="space-y-3">
            {s.titulo && (
              <h2 className="text-sm font-semibold text-foreground">{s.titulo}</h2>
            )}
            {s.formulario_itens.map((it) => (
              <div key={it.id} className="rounded-lg border border-border bg-card p-3">
                <p className="mb-2 text-sm font-medium">{it.texto}</p>
                {it.ajuda && (
                  <p className="mb-2 text-xs text-muted-foreground">{it.ajuda}</p>
                )}
                <ItemInput
                  item={it}
                  valor={valores[it.id] ?? ""}
                  onValor={(v) => setVal(it.id, v)}
                  permiteNa={s.permite_na}
                />
                {/* observação quando "Não/Ruptura" e exigido */}
                {it.obriga_obs_quando_nao &&
                  ["nao", "ruptura"].includes(valores[it.id] ?? "") && (
                    <input
                      value={obs[it.id] ?? ""}
                      onChange={(e) => setObs((p) => ({ ...p, [it.id]: e.target.value }))}
                      placeholder="Observação (obrigatória)"
                      className="mt-2 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  )}
              </div>
            ))}
          </div>
        ))}

        {/* Assinatura — 1 toque */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <PenLine className="h-4 w-4" /> Assinatura
          </p>
          {assinada ? (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assinada} alt="Assinatura" className="h-20 rounded-lg border border-border bg-white object-contain" />
              <button
                type="button"
                onClick={() => setAssinada(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Refazer
              </button>
            </div>
          ) : assinatura ? (
            <Button onClick={() => setAssinada(assinatura)} className="w-full">
              <PenLine className="h-4 w-4" /> Assinar
            </Button>
          ) : (
            <SignaturePad label="Assine aqui" onChange={setAssinada} />
          )}
        </div>

        {erro && (
          <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background p-4">
        <Button onClick={enviar} disabled={enviando} size="lg" className="w-full">
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
            </>
          ) : (
            <>
              <Check className="h-4 w-4" /> Enviar formulário
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ItemInput({
  item,
  valor,
  onValor,
  permiteNa,
}: {
  item: Item;
  valor: string;
  onValor: (v: string) => void;
  permiteNa: boolean;
}) {
  const pares = PARES[item.tipo];
  if (pares) {
    return (
      <div className="flex flex-wrap gap-2">
        {pares.map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => onValor(v)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              valor === v
                ? "border-primary bg-primary/10 text-primary"
                : "border-input hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
        {permiteNa && (
          <button
            type="button"
            onClick={() => onValor("na")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              valor === "na" ? "border-primary bg-primary/10 text-primary" : "border-input hover:bg-muted"
            }`}
          >
            N/A
          </button>
        )}
      </div>
    );
  }

  if (item.tipo === "multipla_escolha") {
    return (
      <div className="flex flex-col gap-1.5">
        {(item.opcoes ?? []).map((op) => (
          <label key={op} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name={item.id}
              checked={valor === op}
              onChange={() => onValor(op)}
              className="h-4 w-4 accent-primary"
            />
            {op}
          </label>
        ))}
      </div>
    );
  }

  const tipoInput =
    item.tipo === "numero" ? "number" : item.tipo === "data" ? "date" : "text";
  return (
    <input
      type={tipoInput}
      value={valor}
      onChange={(e) => onValor(e.target.value)}
      placeholder="Resposta"
      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}
