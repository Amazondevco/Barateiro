import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  ClipboardCheck,
  Loader2,
  PenLine,
  Trash2,
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
import { useNavigate, useParams } from "react-router-dom";
import { Geolocation } from "@capacitor/geolocation";
import { fetchFormDefinition } from "../lib/operator-api";
import type {
  FormDefinition,
  FormItem,
  FormResponseItemPayload,
  FormSection,
} from "../lib/operator-types";
import { enqueueFormResponse } from "../lib/queue-store";
import { compressPhoto, carimbarFoto, syncQueue, type CarimboArea } from "../lib/sync";
import { Button } from "../ui/button";
import { LoadingScreen } from "../ui/loading-screen";
import { SignaturePad } from "../ui/signature-pad";

const OPTIONS: Record<string, Array<[string, string]>> = {
  ok_nao: [
    ["ok", "OK"],
    ["nao", "NÃO"],
  ],
  sim_nao: [
    ["sim", "Sim"],
    ["nao", "Não"],
  ],
  abastecido_ruptura: [
    ["abastecido", "Abastecido"],
    ["ruptura", "Ruptura"],
  ],
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

// Distância em metros entre dois pontos (Haversine) — para o geofence.
function distanciaM(la1: number, lo1: number, la2: number, lo2: number) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(la2 - la1);
  const dLon = rad(lo2 - lo1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Captura a posição atual (GPS nativo via Capacitor). Retorna null se o usuário
// negar a permissão ou o GPS falhar.
async function pegarLocalizacao(): Promise<{ lat: number; lng: number } | null> {
  try {
    const perm = await Geolocation.checkPermissions();
    if (perm.location !== "granted") {
      const req = await Geolocation.requestPermissions();
      if (req.location !== "granted") return null;
    }
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}

export function FillFormPage() {
  const navigate = useNavigate();
  const { memberId = "", formId = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [assinaturaAberta, setAssinaturaAberta] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});
  // Validação por etapa: itemId → mensagem de erro (selo no campo).
  const [invalid, setInvalid] = useState<Record<string, string>>({});
  // Confirmação "fora do local" (geofence) em modal estilizado (não window.confirm).
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
  // Rascunho automático: salva cada mudança localmente e restaura ao reabrir.
  const draftKey = `checkai-draft:${memberId}:${formId}`;
  const draftFirst = useRef(true);

  function clearInvalid(id: string) {
    setInvalid((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchFormDefinition(memberId, formId);
        setForm(result.form);
        setSavedSignature(result.signature);
        // Assinatura começa vazia — anexada pelo bloco fixo na revisão (igual ao PWA).

        // Restaura rascunho salvo (se houver) — não perde o que já foi preenchido.
        try {
          const raw = localStorage.getItem(draftKey);
          if (raw) {
            const d = JSON.parse(raw) as {
              values?: Record<string, string>;
              notes?: Record<string, string>;
              photos?: Record<string, string>;
              stepIndex?: number;
              signature?: string | null;
            };
            if (d.values) setValues(d.values);
            if (d.notes) setNotes(d.notes);
            if (d.photos) setPhotos(d.photos);
            if (typeof d.stepIndex === "number") setStepIndex(d.stepIndex);
            if (d.signature) setSignature(d.signature);
          }
        } catch {
          /* rascunho corrompido — ignora */
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Falha ao carregar checklist.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [formId, memberId, draftKey]);

  // Salva o rascunho a cada mudança (debounce). Pula a 1ª execução para não
  // gravar o estado vazio inicial por cima de um rascunho existente.
  useEffect(() => {
    if (draftFirst.current) {
      draftFirst.current = false;
      return;
    }
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ values, notes, photos, stepIndex, signature }),
        );
      } catch {
        // Sem espaço (fotos grandes): salva ao menos respostas/observações.
        try {
          localStorage.setItem(
            draftKey,
            JSON.stringify({ values, notes, stepIndex, signature }),
          );
        } catch {
          /* ignora */
        }
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [values, notes, photos, stepIndex, signature, draftKey]);

  const steps = useMemo(() => {
    if (!form) return [] as FormSection[][];
    const pages: FormSection[][] = [[]];

    for (const section of form.sections) {
      const current = pages[pages.length - 1];
      if (section.quebraPagina && current.length > 0) {
        pages.push([section]);
      } else {
        current.push(section);
      }
    }

    return pages.filter((page) => page.length > 0);
  }, [form]);

  if (loading) {
    return <LoadingScreen label="Carregando checklist do operador…" />;
  }

  if (!form) {
    return (
      <div className="mx-auto w-full max-w-md p-4">
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error ?? "Checklist indisponível."}
        </p>
      </div>
    );
  }

  function labelFor(item: FormItem, value: string) {
    const pair = OPTIONS[item.tipo]?.find(([candidate]) => candidate === value);
    return pair?.[1] ?? (value || "N/A");
  }

  function validate() {
    for (const section of form.sections) {
      for (const item of section.items) {
        const value = values[item.id] ?? "";
        const nonConforming = ["nao", "ruptura"].includes(value);

        if (
          !value &&
          item.tipo !== "texto" &&
          item.tipo !== "numero" &&
          item.tipo !== "foto"
        ) {
          return `Preencha "${item.texto}".`;
        }

        if (
          item.obrigaObsQuandoNao &&
          nonConforming &&
          !(notes[item.id] ?? "").trim()
        ) {
          return `Adicione observação em "${item.texto}".`;
        }

        if (item.obrigaFotoQuandoNao && nonConforming && !photos[item.id]) {
          return `Adicione foto em "${item.texto}".`;
        }
      }
    }

    if (!signature) return "Adicione a assinatura antes de enviar.";
    return null;
  }

  // Erro de UM item (ou null). Espelha as regras do validate(): tipos de escolha
  // exigem valor; "Não/Ruptura" pode exigir observação e/ou foto.
  function itemErro(item: FormItem): string | null {
    const value = values[item.id] ?? "";
    const note = notes[item.id] ?? "";
    const photo = photos[item.id] ?? "";
    const nonConforming = ["nao", "ruptura"].includes(value);
    const exigeValor =
      item.tipo !== "texto" && item.tipo !== "numero" && item.tipo !== "foto";
    if (exigeValor && !value) return "Não preenchido";
    if (item.obrigaObsQuandoNao && nonConforming && !note.trim())
      return "Observação obrigatória";
    if (item.obrigaFotoQuandoNao && nonConforming && !photo)
      return "Foto obrigatória";
    return null;
  }

  // Valida só os itens das seções da etapa; retorna o mapa itemId → erro.
  function validateStep(sections: FormSection[]): Record<string, string> {
    const errs: Record<string, string> = {};
    for (const s of sections)
      for (const it of s.items) {
        const e = itemErro(it);
        if (e) errs[it.id] = e;
      }
    return errs;
  }

  // Tenta avançar/avançar-para-revisão validando a etapa atual. Bloqueia e
  // sinaliza (selo no campo + toast no topo) se faltar obrigatório.
  function tentarAvancar(acao: () => void) {
    const errs = validateStep(currentStep);
    if (Object.keys(errs).length > 0) {
      setInvalid(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setInvalid({});
    setError(null);
    acao();
    window.scrollTo({ top: 0 });
  }

  async function handleSubmit() {
    const pending = validate();
    if (pending) {
      setError(pending);
      return;
    }

    setSubmitting(true);
    setError(null);

    // Localização: se o formulário exige, captura o GPS. Se houver geofence e o
    // operador estiver FORA do raio, avisa — mas deixa enviar mesmo assim
    // (a presença fica "acusada" no servidor via presenca_ok=false).
    let lat: number | null = null;
    let lng: number | null = null;
    if (form.exigeLocalizacao) {
      const loc = await pegarLocalizacao();
      if (!loc) {
        setError(
          "Não foi possível obter a localização. Ative o GPS e a permissão de localização para enviar este checklist.",
        );
        setSubmitting(false);
        return;
      }
      lat = loc.lat;
      lng = loc.lng;

      if (
        form.geofenceRaioM != null &&
        form.unidadeLat != null &&
        form.unidadeLng != null
      ) {
        const dist = distanciaM(loc.lat, loc.lng, form.unidadeLat, form.unidadeLng);
        if (dist > form.geofenceRaioM) {
          const ok = await confirmarForaDoLocal(
            Math.round(dist),
            form.geofenceRaioM,
          );
          if (!ok) {
            setSubmitting(false);
            return;
          }
        }
      }
    }

    try {
      const payload: FormResponseItemPayload[] = form.sections.flatMap(
        (section) =>
          section.items.map((item) => ({
            itemId: item.id,
            valor: values[item.id] ?? "",
            observacao: (notes[item.id] ?? "").trim() || null,
            fotoDataUrl: photos[item.id] || undefined,
          })),
      );

      await enqueueFormResponse({
        memberId,
        formId,
        formName: form.nome,
        submittedAt: new Date().toISOString(),
        signature: signature!,
        items: payload,
        lat,
        lng,
      });

      // Enviado/enfileirado com sucesso → descarta o rascunho.
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* ignora */
      }

      if (typeof navigator === "undefined" || navigator.onLine) {
        await syncQueue();
      }

      navigate("/app/formularios");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Falha ao enviar o checklist.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const currentStep = steps[stepIndex] ?? [];
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
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
        className="sticky top-0 z-10 flex items-center gap-3 bg-background/95 px-4 py-3 backdrop-blur"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          onClick={() =>
            reviewing ? setReviewing(false) : navigate(`/app/rede/${memberId}`)
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold leading-tight">
            {form.nome}
          </p>
          <p className="truncate text-xs font-medium text-muted-foreground">
            {reviewing
              ? "Revisão final"
              : steps.length > 1
                ? `Etapa ${stepIndex + 1} de ${steps.length}`
                : form.descricao || "Checklist"}
          </p>
        </div>

        {/* Borda de baixo = trilho fininho; a parte laranja preenche conforme avança */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-border">
          {!reviewing && steps.length > 1 ? (
            <div
              className="h-full rounded-r-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          ) : null}
        </div>
      </header>

      <div className={`flex-1 space-y-5 p-4 ${reviewing ? "pb-52" : "pb-28"}`}>
        {reviewing ? (
          <>
            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary">Quase lá!</p>
                <p className="text-xs leading-snug text-primary/80">
                  Confira suas respostas abaixo antes de confirmar o envio
                  definitivo.
                </p>
              </div>
            </div>

            {form.sections.map((section) => {
              const Icon = secaoIcon(section.titulo ?? "");
              return (
              <div key={section.id} className="space-y-2">
                {section.titulo ? (
                  <div className="flex items-center gap-2.5 px-1">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {section.titulo}
                    </h2>
                  </div>
                ) : null}
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                  {section.items.map((item) => {
                    const value = values[item.id] ?? "";
                    const note = (notes[item.id] ?? "").trim();
                    const photo = photos[item.id] ?? "";
                    const nonConforming = ["nao", "ruptura"].includes(value);
                    const isNa = value === "na";
                    const badgeClass = nonConforming
                      ? "bg-danger-bg text-danger"
                      : isNa
                        ? "bg-muted text-muted-foreground"
                        : value
                          ? "bg-success-bg text-success"
                          : "bg-muted text-muted-foreground";
                    return (
                      <div key={item.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {item.texto}
                            </p>
                            {photo ? (
                              <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                                <Camera className="h-3 w-3" /> 1 foto
                              </span>
                            ) : null}
                          </div>
                          <span
                            className={`inline-flex min-w-[3rem] shrink-0 items-center justify-center rounded-lg px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
                          >
                            {item.tipo === "foto"
                              ? photo
                                ? "Foto"
                                : "—"
                              : labelFor(item, value)}
                          </span>
                        </div>
                        {note ? (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            Obs: {note}
                          </p>
                        ) : null}
                        {photo ? (
                          <img
                            src={photo}
                            alt=""
                            className="mt-2 h-20 w-20 rounded-xl border border-border object-cover"
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </>
        ) : (
          currentStep.map((section) => (
            <div key={section.id} className="space-y-3">
              {section.titulo ? (
                <h2 className="px-1 text-base font-bold text-foreground">
                  {section.titulo}
                </h2>
              ) : null}
              {section.items.map((item) => (
                <FormItemCard
                  key={item.id}
                  item={item}
                  permiteNa={section.permiteNa}
                  apenasCamera={form.fotoApenasCamera}
                  geo={{
                    lat: form.unidadeLat,
                    lng: form.unidadeLng,
                    raio: form.geofenceRaioM,
                  }}
                  erro={invalid[item.id]}
                  value={values[item.id] ?? ""}
                  note={notes[item.id] ?? ""}
                  photo={photos[item.id] ?? ""}
                  onValue={(next) => {
                    setValues((prev) => ({ ...prev, [item.id]: next }));
                    clearInvalid(item.id);
                  }}
                  onNote={(next) => {
                    setNotes((prev) => ({ ...prev, [item.id]: next }));
                    clearInvalid(item.id);
                  }}
                  onPhoto={(next) => {
                    setPhotos((prev) => ({ ...prev, [item.id]: next }));
                    clearInvalid(item.id);
                  }}
                />
              ))}
            </div>
          ))
        )}

        {error ? (
          <p className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>

      {/* Barra fixa: navegação / (na revisão) assinatura + confirmação */}
      <div
        className="sticky bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {reviewing ? (
          <div className="space-y-3 p-4">
            {/* Assinatura recolhível — fixa na base, igual ao mockup/PWA */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setAssinaturaAberta((v) => !v)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    signature
                      ? "border-success bg-success text-white"
                      : "border-border bg-card"
                  }`}
                >
                  {signature ? <Check className="h-4 w-4" /> : null}
                </span>
                <span className="flex-1 text-[15px] font-semibold text-foreground">
                  {signature ? "Assinatura anexada" : "Anexar minha assinatura"}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    assinaturaAberta ? "rotate-180" : ""
                  }`}
                />
              </button>
              {assinaturaAberta ? (
                <div className="border-t border-border p-4">
                  {savedSignature && !signature ? (
                    <Button
                      type="button"
                      className="mb-3 w-full"
                      onClick={() => setSignature(savedSignature)}
                    >
                      <PenLine className="h-4 w-4" /> Usar assinatura salva
                    </Button>
                  ) : null}
                  <SignaturePad value={signature} onChange={setSignature} />
                </div>
              ) : null}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setReviewing(false)}
                className="flex h-12 flex-none items-center justify-center gap-2 rounded-2xl bg-muted px-5 text-base font-semibold text-foreground transition-colors hover:bg-border"
              >
                <ArrowLeft className="h-4 w-4" /> Editar
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || !signature}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" /> Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 p-4">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStepIndex((prev) => Math.max(0, prev - 1));
                  window.scrollTo({ top: 0 });
                }}
                className="flex h-12 flex-none items-center justify-center gap-2 rounded-2xl bg-muted px-5 text-base font-semibold text-foreground transition-colors hover:bg-border"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
            ) : null}
            {isLastStep ? (
              <button
                type="button"
                onClick={() => tentarAvancar(() => setReviewing(true))}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <ClipboardCheck className="h-5 w-5" /> Revisar e enviar
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  tentarAvancar(() =>
                    setStepIndex((prev) => Math.min(steps.length - 1, prev + 1)),
                  )
                }
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Próxima <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type GeoCfg = { lat: number | null; lng: number | null; raio: number | null };

function FormItemCard({
  item,
  permiteNa,
  apenasCamera,
  geo,
  erro,
  value,
  note,
  photo,
  onValue,
  onNote,
  onPhoto,
}: {
  item: FormItem;
  permiteNa: boolean;
  apenasCamera: boolean;
  geo: GeoCfg;
  erro?: string;
  value: string;
  note: string;
  photo: string;
  onValue: (next: string) => void;
  onNote: (next: string) => void;
  onPhoto: (next: string) => void;
}) {
  const nonConforming = ["nao", "ruptura"].includes(value);
  const ehFoto = item.tipo === "foto";
  const showContextual =
    nonConforming && (item.obrigaObsQuandoNao || item.obrigaFotoQuandoNao);

  return (
    <div
      className={`rounded-2xl border bg-card p-5 ${
        erro ? "border-danger" : "border-border"
      }`}
    >
      {erro ? (
        <span
          role="alert"
          className="mb-2 inline-flex items-center gap-1 rounded-md bg-danger-bg px-2 py-0.5 text-[11px] font-semibold text-danger"
        >
          <AlertCircle aria-hidden="true" className="h-3 w-3" /> {erro}
        </span>
      ) : null}
      <p className="text-[15px] font-semibold leading-snug text-foreground">
        {item.texto}
      </p>
      {item.ajuda ? (
        <p className="mt-1 text-xs text-muted-foreground">{item.ajuda}</p>
      ) : null}

      {ehFoto ? (
        <div className="mt-4">
          <PhotoField
            value={photo}
            onChange={onPhoto}
            apenasCamera={apenasCamera}
            geo={geo}
          />
        </div>
      ) : (
        <div className="mt-4">
          <ItemInput
            item={item}
            value={value}
            permiteNa={permiteNa}
            onValue={onValue}
          />
        </div>
      )}

      {showContextual ? (
        <div className="mt-4 flex gap-3 rounded-xl bg-danger-bg/40 p-3">
          {item.obrigaFotoQuandoNao ? (
            <PhotoField
              value={photo}
              onChange={onPhoto}
              apenasCamera={apenasCamera}
              geo={geo}
            />
          ) : null}
          {item.obrigaObsQuandoNao ? (
            <input
              value={note}
              onChange={(event) => onNote(event.target.value)}
              placeholder="Adicionar observação..."
              aria-label="Observação"
              className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ItemInput({
  item,
  value,
  permiteNa,
  onValue,
}: {
  item: FormItem;
  value: string;
  permiteNa: boolean;
  onValue: (next: string) => void;
}) {
  const options = OPTIONS[item.tipo];

  if (item.tipo === "multipla_escolha") {
    return (
      <div
        role="radiogroup"
        aria-label={item.texto}
        className="flex flex-col gap-1.5"
      >
        {(item.opcoes ?? []).map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              type="radio"
              name={item.id}
              checked={value === option}
              onChange={() => onValue(option)}
              className="h-4 w-4 accent-primary"
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (options) {
    const segmentBase =
      "flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-medium transition-colors";
    const idle = "border-border bg-card text-muted-foreground hover:bg-muted";
    return (
      <div role="group" aria-label={item.texto} className="flex gap-2">
        {options.map(([candidate, label]) => {
          const selected = value === candidate;
          const negative = ["nao", "ruptura"].includes(candidate);
          const selectedClass = negative
            ? "border-danger bg-danger-bg text-danger font-semibold"
            : "border-success bg-success-bg text-success font-semibold";
          return (
            <button
              key={candidate}
              type="button"
              onClick={() => onValue(candidate)}
              aria-pressed={selected}
              className={`${segmentBase} ${selected ? selectedClass : idle}`}
            >
              {label}
            </button>
          );
        })}
        {permiteNa ? (
          <button
            type="button"
            onClick={() => onValue("na")}
            aria-pressed={value === "na"}
            className={`${segmentBase} ${
              value === "na"
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : idle
            }`}
          >
            N/A
          </button>
        ) : null}
      </div>
    );
  }

  if (item.tipo === "texto") {
    return (
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onValue(event.target.value)}
        placeholder="Resposta"
        aria-label={item.texto}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    );
  }

  const tipoInput = item.tipo === "numero" ? "number" : "text";
  return (
    <input
      type={tipoInput}
      value={value}
      onChange={(event) => onValue(event.target.value)}
      placeholder="Resposta"
      aria-label={item.texto}
      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

function PhotoField({
  value,
  onChange,
  apenasCamera,
  geo,
}: {
  value: string;
  onChange: (next: string) => void;
  apenasCamera: boolean;
  geo: GeoCfg;
}) {
  const [uploading, setUploading] = useState(false);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const comp = await compressPhoto(file);
      // Carimbo: data/hora + status da área (geofence), sempre.
      const quando = new Date();
      let area: CarimboArea = null;
      if (geo.lat != null && geo.lng != null && geo.raio != null) {
        const loc = await pegarLocalizacao();
        area = !loc
          ? "indisponivel"
          : distanciaM(loc.lat, loc.lng, geo.lat, geo.lng) <= geo.raio
            ? "dentro"
            : "fora";
      }
      onChange(await carimbarFoto(comp, { quando, area }));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="shrink-0">
      {value ? (
        <div className="relative h-10 w-10">
          <img
            src={value}
            alt="Foto anexada"
            className="h-10 w-10 rounded-lg border border-border object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remover foto"
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white shadow-sm"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <label
          aria-label="Adicionar foto"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-danger/30 bg-card text-danger shadow-sm transition-colors hover:bg-danger-bg"
        >
          {uploading ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Camera aria-hidden="true" className="h-4 w-4" />
          )}
          <input
            type="file"
            accept="image/*"
            {...(apenasCamera ? { capture: "environment" as const } : {})}
            onChange={onFile}
            aria-label="Adicionar foto"
            hidden
          />
        </label>
      )}
    </div>
  );
}
