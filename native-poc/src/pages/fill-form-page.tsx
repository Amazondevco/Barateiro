import { useEffect, useMemo, useState } from "react";
import {
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
import { compressPhoto, syncQueue } from "../lib/sync";
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

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchFormDefinition(memberId, formId);
        setForm(result.form);
        setSavedSignature(result.signature);
        // Assinatura começa vazia — anexada pelo bloco fixo na revisão (igual ao PWA).
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Falha ao carregar formulário.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [formId, memberId]);

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
    return <LoadingScreen label="Carregando formulário do operador…" />;
  }

  if (!form) {
    return (
      <div className="mx-auto w-full max-w-md p-4">
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error ?? "Formulário indisponível."}
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
          "Não foi possível obter a localização. Ative o GPS e a permissão de localização para enviar este formulário.",
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
          const ok = window.confirm(
            `Você está FORA do local da unidade (a ~${Math.round(dist)} m, ` +
              `o limite é ${form.geofenceRaioM} m).\n\nO envio será marcado como fora do local. Enviar mesmo assim?`,
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

      if (typeof navigator === "undefined" || navigator.onLine) {
        await syncQueue();
      }

      navigate("/app/formularios");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Falha ao enviar o formulário.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const currentStep = steps[stepIndex] ?? [];
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
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
      </header>

      {/* Progresso das etapas */}
      {!reviewing && steps.length > 1 ? (
        <div className="flex gap-1 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full ${
                index < stepIndex
                  ? "bg-primary/50"
                  : index === stepIndex
                    ? "bg-primary"
                    : "bg-border"
              }`}
            />
          ))}
        </div>
      ) : null}

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
                  value={values[item.id] ?? ""}
                  note={notes[item.id] ?? ""}
                  photo={photos[item.id] ?? ""}
                  onValue={(next) =>
                    setValues((prev) => ({ ...prev, [item.id]: next }))
                  }
                  onNote={(next) =>
                    setNotes((prev) => ({ ...prev, [item.id]: next }))
                  }
                  onPhoto={(next) =>
                    setPhotos((prev) => ({ ...prev, [item.id]: next }))
                  }
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
      <div className="sticky bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
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
                className="flex h-14 flex-none items-center justify-center gap-2 rounded-2xl bg-muted px-5 text-base font-semibold text-foreground transition-colors hover:bg-border"
              >
                <ArrowLeft className="h-4 w-4" /> Editar
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || !signature}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
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
                className="flex h-14 flex-none items-center justify-center gap-2 rounded-2xl bg-muted px-5 text-base font-semibold text-foreground transition-colors hover:bg-border"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
            ) : null}
            {isLastStep ? (
              <button
                type="button"
                onClick={() => setReviewing(true)}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <ClipboardCheck className="h-5 w-5" /> Revisar e enviar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
                  window.scrollTo({ top: 0 });
                }}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
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

function FormItemCard({
  item,
  permiteNa,
  value,
  note,
  photo,
  onValue,
  onNote,
  onPhoto,
}: {
  item: FormItem;
  permiteNa: boolean;
  value: string;
  note: string;
  photo: string;
  onValue: (next: string) => void;
  onNote: (next: string) => void;
  onPhoto: (next: string) => void;
}) {
  const nonConforming = ["nao", "ruptura"].includes(value);
  const showContextual =
    nonConforming && (item.obrigaObsQuandoNao || item.obrigaFotoQuandoNao);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-[15px] font-semibold leading-snug text-foreground">
        {item.texto}
      </p>
      {item.ajuda ? (
        <p className="mt-1 text-xs text-muted-foreground">{item.ajuda}</p>
      ) : null}

      <div className="mt-4">
        <ItemInput
          item={item}
          value={value}
          permiteNa={permiteNa}
          onValue={onValue}
        />
      </div>

      {showContextual ? (
        <div className="mt-4 flex gap-3 rounded-xl bg-danger-bg/40 p-3">
          {item.obrigaFotoQuandoNao ? (
            <PhotoField value={photo} onChange={onPhoto} />
          ) : null}
          {item.obrigaObsQuandoNao ? (
            <input
              value={note}
              onChange={(event) => onNote(event.target.value)}
              placeholder="Adicionar observação..."
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
      <div className="flex flex-col gap-1.5">
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
      <div className="flex gap-2">
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
      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

function PhotoField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      onChange(await compressPhoto(file));
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
            alt=""
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
        <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-danger/30 bg-card text-danger shadow-sm transition-colors hover:bg-danger-bg">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFile}
            hidden
          />
        </label>
      )}
    </div>
  );
}
