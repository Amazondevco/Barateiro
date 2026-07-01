import { useEffect, useState } from "react";
import { ArrowLeft, Camera, PenLine } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchRespostaDetalhe,
  fetchFormDefinition,
  type RespostaDetalhe,
} from "../lib/operator-api";
import { getQueueItems } from "../lib/queue-store";
import { LoadingScreen } from "../ui/loading-screen";
import { useI18n } from "../lib/i18n/i18n";

const VALOR_LABEL: Record<string, string> = {
  ok: "OK",
  nao: "Não",
  sim: "Sim",
  abastecido: "Abastecido",
  ruptura: "Ruptura",
  na: "N/A",
};
function rotulo(valor: string) {
  if (!valor) return "—";
  return VALOR_LABEL[valor.toLowerCase()] ?? valor;
}
function tom(valor: string): "ok" | "nao" | "neutro" {
  const v = valor.toLowerCase();
  if (["sim", "ok", "abastecido"].includes(v)) return "ok";
  if (["nao", "ruptura"].includes(v)) return "nao";
  return "neutro";
}

// Monta o detalhe a partir de um envio PENDENTE (fila local) + definição do form.
async function detalhePendente(queueId: string): Promise<RespostaDetalhe | null> {
  const itens = await getQueueItems();
  const rec = itens.find((i) => i.id === queueId);
  if (!rec || rec.kind !== "form_response") return null;
  const def = await fetchFormDefinition(rec.payload.memberId, rec.payload.formId);
  const ans = new Map(rec.payload.items.map((i) => [i.itemId, i]));
  return {
    nome: rec.payload.formName,
    dataReferencia: rec.payload.submittedAt.slice(0, 10),
    enviadoEm: null,
    assinatura: rec.payload.signature ?? null,
    secoes: def.form.sections.map((s) => ({
      titulo: s.titulo,
      itens: s.items.map((it) => {
        const a = ans.get(it.id);
        return {
          texto: it.texto,
          tipo: it.tipo,
          valor: a?.valor ?? "",
          observacao: a?.observacao ?? null,
          fotoUrl: a?.fotoDataUrl ?? null,
        };
      }),
    })),
  };
}

export function RevisaoPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { origem = "", id = "" } = useParams();
  const [det, setDet] = useState<RespostaDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const d =
          origem === "pendente"
            ? await detalhePendente(id)
            : await fetchRespostaDetalhe(id);
        if (vivo) setDet(d);
      } catch (e) {
        if (vivo) setErro(e instanceof Error ? e.message : t("Falha ao carregar."));
      } finally {
        if (vivo) setLoading(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [origem, id]);

  if (loading) return <LoadingScreen label={t("Carregando revisão…")} />;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header
        className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
          aria-label={t("Voltar")}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold leading-tight">
            {det?.nome ?? t("Revisão")}
          </p>
          <p className="truncate text-xs font-medium text-muted-foreground">
            {t("Apenas leitura — o que você enviou")}
          </p>
        </div>
      </header>

      <div
        className="flex-1 space-y-5 p-4"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
      >
        {erro || !det ? (
          <p className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">
            {erro ?? t("Revisão indisponível.")}
          </p>
        ) : (
          <>
            {det.secoes.map((s, si) => (
              <div key={si} className="space-y-2">
                {s.titulo ? (
                  <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {s.titulo}
                  </h2>
                ) : null}
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                  {s.itens.map((it, ii) => {
                    const tomVal = tom(it.valor);
                    const badge =
                      tomVal === "ok"
                        ? "bg-success-bg text-success"
                        : tomVal === "nao"
                          ? "bg-danger-bg text-danger"
                          : "bg-muted text-muted-foreground";
                    return (
                      <div key={ii} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <p className="min-w-0 text-sm font-medium text-foreground">
                            {it.texto}
                          </p>
                          <span
                            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${badge}`}
                          >
                            {it.tipo === "foto" ? (it.fotoUrl ? t("Foto") : "—") : t(rotulo(it.valor))}
                          </span>
                        </div>
                        {it.observacao ? (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {t("Obs:")} {it.observacao}
                          </p>
                        ) : null}
                        {it.fotoUrl ? (
                          <div className="mt-2 inline-flex items-center gap-2">
                            <img
                              src={it.fotoUrl}
                              alt=""
                              className="h-20 w-20 rounded-xl border border-border object-cover"
                            />
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Camera className="h-3.5 w-3.5" /> {t("foto anexada")}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {det.assinatura ? (
              <div className="space-y-2">
                <p className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <PenLine className="h-3.5 w-3.5" /> {t("Assinatura")}
                </p>
                <img
                  src={det.assinatura}
                  alt={t("Assinatura")}
                  className="h-20 rounded-xl border border-border bg-white object-contain"
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
