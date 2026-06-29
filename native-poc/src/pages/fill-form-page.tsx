import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ClipboardCheck,
  Loader2,
  PenLine,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
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
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchFormDefinition(memberId, formId);
        setForm(result.form);
        setSavedSignature(result.signature);
        setSignature(result.signature);
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
          className="text-muted-foreground hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">
            {form.nome}
          </p>
          <p className="truncate text-xs text-muted-foreground">
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
        <div className="flex gap-1 px-4 pt-3">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full ${index <= stepIndex ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      ) : null}

      <div className="flex-1 space-y-5 p-4">
        {reviewing ? (
          <>
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm text-primary">
              <ClipboardCheck className="h-4 w-4 shrink-0" /> Confira tudo antes
              de confirmar o envio.
            </div>

            {form.sections.map((section) => (
              <div key={section.id} className="space-y-2">
                {section.titulo ? (
                  <h2 className="text-sm font-semibold">{section.titulo}</h2>
                ) : null}
                <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                  {section.items.map((item) => {
                    const value = values[item.id] ?? "";
                    const note = (notes[item.id] ?? "").trim();
                    const photo = photos[item.id] ?? "";
                    const nonConforming = ["nao", "ruptura"].includes(value);
                    return (
                      <div key={item.id} className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm">{item.texto}</p>
                          <span
                            className={`shrink-0 text-sm font-semibold ${
                              nonConforming
                                ? "text-danger"
                                : value
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {item.tipo === "foto"
                              ? photo
                                ? "Foto"
                                : "—"
                              : labelFor(item, value)}
                          </span>
                        </div>
                        {note ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Obs: {note}
                          </p>
                        ) : null}
                        {photo ? (
                          <img
                            src={photo}
                            alt=""
                            className="mt-2 h-20 w-20 rounded-lg border border-border object-cover"
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Assinatura */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <PenLine className="h-4 w-4" /> Assinatura
              </p>
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
          </>
        ) : (
          currentStep.map((section) => (
            <div key={section.id} className="space-y-3">
              {section.titulo ? (
                <h2 className="text-sm font-semibold text-foreground">
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
          <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>

      {/* Barra fixa: navegação / confirmação */}
      <div className="sticky bottom-0 flex gap-2 border-t border-border bg-background p-4">
        {reviewing ? (
          <>
            <Button
              variant="outline"
              onClick={() => setReviewing(false)}
              className="flex-none"
            >
              <ArrowLeft className="h-4 w-4" /> Editar
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={submitting}
              size="lg"
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Confirmar e enviar
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {stepIndex > 0 ? (
              <Button
                variant="outline"
                onClick={() => {
                  setError(null);
                  setStepIndex((prev) => Math.max(0, prev - 1));
                  window.scrollTo({ top: 0 });
                }}
                className="flex-none"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            ) : null}
            {isLastStep ? (
              <Button onClick={() => setReviewing(true)} size="lg" className="flex-1">
                <ClipboardCheck className="h-4 w-4" /> Revisar e enviar
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setError(null);
                  setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
                  window.scrollTo({ top: 0 });
                }}
                size="lg"
                className="flex-1"
              >
                Próxima <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </>
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

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-sm font-medium">{item.texto}</p>
      {item.ajuda ? (
        <p className="mb-2 text-xs text-muted-foreground">{item.ajuda}</p>
      ) : null}

      <ItemInput
        item={item}
        value={value}
        permiteNa={permiteNa}
        onValue={onValue}
      />

      {item.obrigaObsQuandoNao && nonConforming ? (
        <input
          value={note}
          onChange={(event) => onNote(event.target.value)}
          placeholder="Observação (obrigatória)"
          className="mt-2 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : null}

      {item.obrigaFotoQuandoNao && nonConforming ? (
        <PhotoField value={photo} onChange={onPhoto} />
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
    return (
      <div className="flex flex-wrap gap-2">
        {options.map(([candidate, label]) => (
          <button
            key={candidate}
            type="button"
            onClick={() => onValue(candidate)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              value === candidate
                ? "border-primary bg-primary/10 text-primary"
                : "border-input hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
        {permiteNa ? (
          <button
            type="button"
            onClick={() => onValue("na")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              value === "na"
                ? "border-primary bg-primary/10 text-primary"
                : "border-input hover:bg-muted"
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
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    <div className="mt-2">
      {value ? (
        <div className="flex items-center gap-2">
          <img
            src={value}
            alt=""
            className="h-16 w-16 rounded-lg border border-border object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex items-center gap-1 text-xs text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remover
          </button>
        </div>
      ) : (
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm hover:bg-muted">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" /> Tirar foto
            </>
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
