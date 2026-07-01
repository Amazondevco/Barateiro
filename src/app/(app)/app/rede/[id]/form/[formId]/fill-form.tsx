"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Loader2,
  PenLine,
  Camera,
  Trash2,
  ClipboardCheck,
  ChevronDown,
  ShoppingBasket,
  Snowflake,
  Apple,
  Beef,
  Croissant,
  Wine,
  Fish,
  Milk,
  Package,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { enqueueSubmission } from "@/lib/offline-db";
import { sincronizar, pendingCount, comprimirFoto } from "@/lib/offline-sync";
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
  quebra_pagina: boolean;
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

// Ícone da seção a partir do título (texto livre). Sem match → ícone padrão.
function secaoIcon(titulo: string): LucideIcon {
  const t = titulo.toLowerCase();
  if (/(frio|latic|resfri|congel)/.test(t)) return Snowflake;
  if (/(mercearia|seco)/.test(t)) return ShoppingBasket;
  if (/(horti|fruta|verdura|flv|legume)/.test(t)) return Apple;
  if (/(açougue|acougue|carne)/.test(t)) return Beef;
  if (/(padaria|pão|pães|confeit)/.test(t)) return Croissant;
  if (/(bebida|adega|vinho)/.test(t)) return Wine;
  if (/(peixe|pescado|frutos do mar)/.test(t)) return Fish;
  if (/(leite|iogurte)/.test(t)) return Milk;
  return Package;
}

// label legível de um valor (para a revisão)
function rotuloValor(item: Item, valor: string): string {
  if (!valor) return "—";
  if (valor === "na") return "N/A";
  const par = PARES[item.tipo]?.find(([v]) => v === valor);
  if (par) return par[1];
  return valor;
}

// GPS do navegador (null se indisponível/negado) e distância em metros (Haversine).
function pegarLocalizacao(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((res) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(
      (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => res(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}
function distanciaM(la1: number, lo1: number, la2: number, lo2: number): number {
  const R = 6371000;
  const r = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(r(la2 - la1) / 2) ** 2 +
    Math.cos(r(la1)) * Math.cos(r(la2)) * Math.sin(r(lo2 - lo1) / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function FillForm({
  redeMembroId,
  form,
  assinatura,
  exigeLocalizacao = false,
  geofence = null,
}: {
  redeMembroId: string;
  form: FormData;
  assinatura: string | null;
  exigeLocalizacao?: boolean;
  geofence?: { raio: number; uniLat: number | null; uniLng: number | null } | null;
}) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>({});
  const [obs, setObs] = useState<Record<string, string>>({});
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [assinada, setAssinada] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState(0);
  const [revisando, setRevisando] = useState(false);
  const [assinaturaAberta, setAssinaturaAberta] = useState(false);
  // Validação por etapa: itemId → erro (selo no campo).
  const [invalido, setInvalido] = useState<Record<string, string>>({});
  // Confirmação "fora do local" (geofence) em modal estilizado.
  const [geoModal, setGeoModal] = useState<{ dist: number; limite: number } | null>(
    null,
  );
  const geoResolver = useRef<((ok: boolean) => void) | null>(null);

  function confirmarForaDoLocal(dist: number, limite: number) {
    return new Promise<boolean>((resolve) => {
      geoResolver.current = resolve;
      setGeoModal({ dist, limite });
    });
  }
  function responderGeo(ok: boolean) {
    setGeoModal(null);
    const r = geoResolver.current;
    geoResolver.current = null;
    r?.(ok);
  }
  // Rascunho automático: salva cada mudança e restaura ao reabrir.
  const draftKey = `checkai-draft:${redeMembroId}:${form.id}`;
  const draftFirst = useRef(true);

  // Restaura rascunho salvo (client-only, após hidratação).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw) as {
          valores?: Record<string, string>;
          obs?: Record<string, string>;
          fotos?: Record<string, string>;
          etapa?: number;
          assinada?: string | null;
        };
        if (d.valores) setValores(d.valores);
        if (d.obs) setObs(d.obs);
        if (d.fotos) setFotos(d.fotos);
        if (typeof d.etapa === "number") setEtapa(d.etapa);
        if (d.assinada) setAssinada(d.assinada);
      }
    } catch {
      /* rascunho corrompido — ignora */
    }
  }, [draftKey]);

  // Salva a cada mudança (debounce); pula a 1ª execução p/ não gravar vazio.
  useEffect(() => {
    if (draftFirst.current) {
      draftFirst.current = false;
      return;
    }
    const h = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ valores, obs, fotos, etapa, assinada }),
        );
      } catch {
        try {
          localStorage.setItem(
            draftKey,
            JSON.stringify({ valores, obs, etapa, assinada }),
          );
        } catch {
          /* ignora */
        }
      }
    }, 400);
    return () => clearTimeout(h);
  }, [valores, obs, fotos, etapa, assinada, draftKey]);

  function setVal(id: string, v: string) {
    setValores((p) => ({ ...p, [id]: v }));
    limparInvalido(id);
  }

  function limparInvalido(id: string) {
    setInvalido((prev) => {
      if (!prev[id]) return prev;
      const n = { ...prev };
      delete n[id];
      return n;
    });
  }

  // Agrupa seções em etapas (páginas) pela quebra de página — igual à prévia.
  const etapas = useMemo(() => {
    const out: Secao[][] = [];
    form.formulario_secoes.forEach((sec, i) => {
      if (i === 0 || sec.quebra_pagina) out.push([sec]);
      else out[out.length - 1].push(sec);
    });
    return out;
  }, [form.formulario_secoes]);

  const total = etapas.length;
  const idx = Math.min(etapa, Math.max(0, total - 1));
  const ultima = idx >= total - 1;

  // Erro de UM item (ou null): tipos de escolha exigem valor; "Não/Ruptura"
  // pode exigir observação e/ou foto.
  function itemErro(it: Item): string | null {
    const v = valores[it.id] ?? "";
    const ob = obs[it.id] ?? "";
    const fo = fotos[it.id] ?? "";
    const naoConforme = ["nao", "ruptura"].includes(v);
    const exigeValor =
      it.tipo !== "texto" &&
      it.tipo !== "numero" &&
      it.tipo !== "data" &&
      it.tipo !== "foto";
    if (exigeValor && !v) return "Não preenchido";
    if (it.obriga_obs_quando_nao && naoConforme && !ob.trim())
      return "Observação obrigatória";
    if (it.obriga_foto_quando_nao && naoConforme && !fo)
      return "Foto obrigatória";
    return null;
  }

  function validarSecoes(secoes: Secao[]): Record<string, string> {
    const errs: Record<string, string> = {};
    for (const s of secoes)
      for (const it of s.formulario_itens) {
        const e = itemErro(it);
        if (e) errs[it.id] = e;
      }
    return errs;
  }

  // Avança/revisa validando a etapa atual; bloqueia e sinaliza (selo no campo +
  // toast no topo) se faltar obrigatório.
  function tentarAvancar(acao: () => void) {
    const errs = validarSecoes(etapas[idx] ?? []);
    if (Object.keys(errs).length > 0) {
      setInvalido(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setInvalido({});
    setErro(null);
    acao();
    window.scrollTo({ top: 0 });
  }

  async function enviar() {
    // Segurança: revalida tudo antes de enviar (além do bloqueio por etapa).
    const errs = validarSecoes(form.formulario_secoes);
    if (Object.keys(errs).length > 0) {
      setInvalido(errs);
      return setErro("Há campos obrigatórios não preenchidos.");
    }
    if (!assinada) return setErro("Assine para enviar o checklist.");
    setErro(null);
    setEnviando(true);

    // Localização: captura o GPS quando o formulário exige.
    let lat: number | null = null;
    let lng: number | null = null;
    if (exigeLocalizacao) {
      const pos = await pegarLocalizacao();
      if (pos) {
        lat = pos.lat;
        lng = pos.lng;
        if (
          geofence?.raio &&
          geofence.uniLat != null &&
          geofence.uniLng != null
        ) {
          const d = distanciaM(pos.lat, pos.lng, geofence.uniLat, geofence.uniLng);
          if (d > geofence.raio) {
            const ok = await confirmarForaDoLocal(Math.round(d), geofence.raio);
            if (!ok) return setEnviando(false);
          }
        }
      }
    }

    const itens = form.formulario_secoes.flatMap((s) =>
      s.formulario_itens.map((it) => ({
        item_id: it.id,
        valor: valores[it.id] ?? "",
        observacao: obs[it.id] ?? "",
        fotoDataUrl: fotos[it.id] || undefined,
      })),
    );
    try {
      // Entra na fila local → funciona offline. A sincronização envia agora
      // (se online) ou quando a conexão voltar.
      await enqueueSubmission({
        membroId: redeMembroId,
        formId: form.id,
        formNome: form.nome,
        itens,
        assinatura: assinada,
        criadoEm: new Date().toISOString(),
        tentativas: 0,
        lat,
        lng,
      });
      // Enfileirado com sucesso → descarta o rascunho.
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* ignora */
      }
      await sincronizar();
      const restante = await pendingCount();
      router.push(
        `/app/rede/${redeMembroId}?${restante > 0 ? "pendente" : "enviado"}=1`,
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar o envio.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Confirmação "fora do local" (geofence) — modal com a cara do app */}
      {geoModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-warning-bg text-warning">
                <MapPin className="h-7 w-7" />
              </span>
              <h2 className="text-base font-bold text-foreground">
                Fora do local da unidade
              </h2>
              <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
                Você está a ~{geoModal.dist} m da unidade (o limite é{" "}
                {geoModal.limite} m). O envio será marcado como{" "}
                <strong className="font-semibold text-foreground">
                  fora do local
                </strong>
                . Enviar mesmo assim?
              </p>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => responderGeo(false)}
                className="h-12 flex-1 rounded-xl bg-muted text-sm font-semibold text-foreground transition-colors hover:bg-border"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => responderGeo(true)}
                className="h-12 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Enviar assim mesmo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cabeçalho — a barra de progresso É a borda de baixo (linha única e sutil) */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 bg-card/95 p-4 backdrop-blur"
        style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}
      >
        <button
          onClick={() =>
            revisando
              ? setRevisando(false)
              : router.push(`/app/rede/${redeMembroId}`)
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold leading-tight text-foreground">
            {form.nome}
          </h1>
          <p className="truncate text-[13px] font-medium text-muted-foreground">
            {revisando
              ? "Revisão final"
              : total > 1
                ? `Etapa ${idx + 1} de ${total}`
                : form.descricao || "Checklist"}
          </p>
        </div>

        {/* Borda de baixo = trilho fininho; a parte laranja preenche conforme avança */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-border">
          {!revisando && total > 1 ? (
            <div
              className="h-full rounded-r-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${((idx + 1) / total) * 100}%` }}
            />
          ) : null}
        </div>
      </header>

      <div className={`flex-1 space-y-4 p-5 ${revisando ? "pb-[200px]" : "pb-[120px]"}`}>
        {revisando ? (
          <RevisaoBody form={form} valores={valores} obs={obs} fotos={fotos} />
        ) : (
          etapas[idx]?.map((s) => (
            <div key={s.id} className="space-y-4">
              {s.titulo && (
                <h2 className="mt-2 text-lg font-bold text-foreground">{s.titulo}</h2>
              )}
              {s.formulario_itens.map((it) => (
                <div
                  key={it.id}
                  className={`rounded-2xl border bg-card p-5 shadow-sm ${
                    invalido[it.id] ? "border-danger" : "border-border"
                  }`}
                >
                  {invalido[it.id] ? (
                    <span className="mb-2 inline-flex items-center gap-1 rounded-md bg-danger-bg px-2 py-0.5 text-[11px] font-semibold text-danger">
                      <AlertCircle className="h-3 w-3" /> {invalido[it.id]}
                    </span>
                  ) : null}
                  <p className="text-[15px] font-semibold leading-snug text-foreground">
                    {it.texto}
                  </p>
                  {it.ajuda && (
                    <p className="mt-1 text-xs text-muted-foreground">{it.ajuda}</p>
                  )}
                  <ItemInput
                    item={it}
                    valor={valores[it.id] ?? ""}
                    onValor={(v) => setVal(it.id, v)}
                    permiteNa={s.permite_na}
                  />
                  {(() => {
                    const naoConforme = ["nao", "ruptura"].includes(
                      valores[it.id] ?? "",
                    );
                    const mostraObs = it.obriga_obs_quando_nao && naoConforme;
                    const mostraFoto =
                      it.tipo === "foto" ||
                      (it.obriga_foto_quando_nao && naoConforme);
                    if (!mostraObs && !mostraFoto) return null;
                    // Expansão contextual: foto + observação quando "Não".
                    const contextual = naoConforme && (mostraObs || mostraFoto);
                    return (
                      <div
                        className={`mt-4 flex flex-col gap-3 ${
                          contextual
                            ? "rounded-xl border border-danger/20 bg-danger-bg/40 p-3"
                            : ""
                        }`}
                      >
                        {mostraFoto && (
                          <FotoCampo
                            value={fotos[it.id] ?? ""}
                            onChange={(url) => {
                              setFotos((p) => ({ ...p, [it.id]: url }));
                              limparInvalido(it.id);
                            }}
                            danger={contextual}
                          />
                        )}
                        {mostraObs && (
                          <input
                            value={obs[it.id] ?? ""}
                            onChange={(e) => {
                              setObs((p) => ({ ...p, [it.id]: e.target.value }));
                              limparInvalido(it.id);
                            }}
                            placeholder="Adicionar observação…"
                            aria-label="Observação"
                            className="h-9 w-full rounded-lg border border-danger/20 bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          ))
        )}

        {erro && (
          <p className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>
        )}
      </div>

      {/* rodapé fixo: navegação por etapas / (na revisão) assinatura + confirmação */}
      <div
        className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {revisando ? (
          <div className="space-y-3 p-5 pb-8">
            {/* Assinatura recolhível — fixa na base, igual ao mockup */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setAssinaturaAberta((v) => !v)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    assinada
                      ? "border-success bg-success text-white"
                      : "border-input bg-card"
                  }`}
                >
                  {assinada && <Check className="h-4 w-4" />}
                </span>
                <span className="flex-1 text-[15px] font-semibold text-foreground">
                  {assinada ? "Assinatura anexada" : "Anexar minha assinatura"}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    assinaturaAberta ? "rotate-180" : ""
                  }`}
                />
              </button>
              {assinaturaAberta && (
                <div className="border-t border-border p-4">
                  {assinada ? (
                    <div className="flex flex-col items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={assinada}
                        alt="Assinatura"
                        className="h-20 rounded-xl border border-border bg-white object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setAssinada(null)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Refazer
                      </button>
                    </div>
                  ) : assinatura ? (
                    <Button
                      onClick={() => setAssinada(assinatura)}
                      className="w-full"
                    >
                      <PenLine className="h-4 w-4" /> Usar assinatura salva
                    </Button>
                  ) : (
                    <SignaturePad label="Assine aqui" onChange={setAssinada} />
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setRevisando(false)}
                className="h-12 flex-none rounded-2xl px-5"
              >
                <ArrowLeft className="h-4 w-4" /> Editar
              </Button>
              <Button
                onClick={enviar}
                disabled={enviando || !assinada}
                className="h-12 flex-1 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-sm"
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" /> Confirmar
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 p-5 pb-8">
            {idx > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  setErro(null);
                  setEtapa(idx - 1);
                  window.scrollTo({ top: 0 });
                }}
                className="h-12 flex-none rounded-2xl px-5"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            )}
            {ultima ? (
              <Button
                onClick={() => tentarAvancar(() => setRevisando(true))}
                className="h-12 flex-1 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-sm"
              >
                <ClipboardCheck className="h-5 w-5" /> Revisar e enviar
              </Button>
            ) : (
              <Button
                onClick={() => tentarAvancar(() => setEtapa(idx + 1))}
                className="h-12 flex-1 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-sm"
              >
                Próxima <ArrowRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Revisão final: todos os campos preenchidos, observações e fotos (somente leitura).
function RevisaoBody({
  form,
  valores,
  obs,
  fotos,
}: {
  form: FormData;
  valores: Record<string, string>;
  obs: Record<string, string>;
  fotos: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      {/* banner "Quase lá!" */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ClipboardCheck className="h-4 w-4" />
        </span>
        <div>
          <h3 className="mb-0.5 text-sm font-bold text-foreground">Quase lá!</h3>
          <p className="text-[13px] leading-snug text-muted-foreground">
            Confira suas respostas abaixo antes de confirmar o envio definitivo.
          </p>
        </div>
      </div>

      {form.formulario_secoes.map((s) => {
        const Icon = secaoIcon(s.titulo ?? "");
        return (
        <div key={s.id} className="space-y-3">
          {s.titulo && (
            <div className="flex items-center gap-2.5 px-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <h2 className="text-[15px] font-bold uppercase tracking-wide text-foreground">
                {s.titulo}
              </h2>
            </div>
          )}
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {s.formulario_itens.map((it) => {
              const v = valores[it.id] ?? "";
              const ob = (obs[it.id] ?? "").trim();
              const fo = fotos[it.id] ?? "";
              const naoConforme = ["nao", "ruptura"].includes(v);
              const conforme = ["sim", "ok", "abastecido"].includes(v);
              const ehFoto = it.tipo === "foto";
              const badgeClasse = naoConforme
                ? "bg-danger-bg text-danger"
                : conforme
                  ? "bg-success-bg text-success"
                  : "bg-muted text-muted-foreground";
              return (
                <div key={it.id} className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {it.texto}
                    </p>
                    {fo && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                        <Camera className="h-3 w-3" /> 1 foto anexada
                      </span>
                    )}
                    {ob && (
                      <p className="mt-1 text-xs text-muted-foreground">Obs: {ob}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center justify-center rounded-lg px-2.5 py-1 text-xs font-semibold ${badgeClasse}`}
                  >
                    {ehFoto ? (fo ? "Foto" : "—") : rotuloValor(it, v)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        );
      })}
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
      <div role="group" aria-label={item.texto} className="mt-4 flex gap-2">
        {pares.map(([v, label]) => {
          const selecionado = valor === v;
          // Conforme → verde; não-conforme → vermelho.
          const conforme = ["sim", "ok", "abastecido"].includes(v);
          const selClasse = conforme
            ? "border-success bg-success-bg text-success"
            : "border-danger bg-danger-bg text-danger";
          return (
            <button
              key={v}
              type="button"
              onClick={() => onValor(v)}
              aria-pressed={selecionado}
              className={`flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                selecionado
                  ? `${selClasse} font-semibold`
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {selecionado &&
                (conforme ? (
                  <Check aria-hidden="true" className="mr-1.5 h-4 w-4 opacity-70" />
                ) : (
                  <X aria-hidden="true" className="mr-1.5 h-4 w-4 opacity-70" />
                ))}
              {label}
            </button>
          );
        })}
        {permiteNa && (
          <button
            type="button"
            onClick={() => onValor("na")}
            aria-pressed={valor === "na"}
            className={`flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
              valor === "na"
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
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
      <div
        role="radiogroup"
        aria-label={item.texto}
        className="mt-4 flex flex-col gap-1.5"
      >
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

  // foto é renderizada pelo FotoCampo (fora do ItemInput)
  if (item.tipo === "foto") return null;

  const tipoInput =
    item.tipo === "numero" ? "number" : item.tipo === "data" ? "date" : "text";
  return (
    <input
      type={tipoInput}
      value={valor}
      onChange={(e) => onValor(e.target.value)}
      placeholder="Resposta"
      aria-label={item.texto}
      className="mt-4 h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

function FotoCampo({
  value,
  onChange,
  danger = false,
}: {
  value: string;
  onChange: (url: string) => void;
  danger?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [subindo, setSubindo] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSubindo(true);
    try {
      // Guarda a foto localmente (comprimida). O upload acontece na
      // sincronização → tirar foto funciona mesmo offline.
      onChange(await comprimirFoto(f));
    } catch {
      /* ignore */
    } finally {
      setSubindo(false);
    }
  }

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
      {value ? (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Foto anexada" className="h-16 w-16 rounded-xl border border-border object-cover" />
          <button type="button" onClick={() => onChange("")} className="flex items-center gap-1 text-xs text-danger">
            <Trash2 className="h-3.5 w-3.5" /> Remover
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={subindo}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
            danger
              ? "border-danger/20 bg-card text-danger hover:bg-danger-bg/60"
              : "border-input text-foreground hover:bg-muted"
          }`}
        >
          {subindo ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" /> Tirar foto
            </>
          )}
        </button>
      )}
    </div>
  );
}
