"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Check,
  Search,
  Upload,
  Loader2,
  Image as ImageIcon,
  X,
  Building2,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  TIPOS_NEGOCIO,
  ORGAOS_PUBLICOS,
  AREAS_PUBLICAS,
  parseSegmento,
  encodePublico,
  type OpcaoSimples,
} from "@/lib/tipos-negocio";

// Normaliza para busca sem acento/caixa ("seguranca" acha "Segurança").
const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// ── Combobox buscável (valor = slug) ────────────────────────────────────────
function ComboSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: OpcaoSimples[];
  value: string;
  onChange: (slug: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const labelSel = value
    ? (options.find((o) => o.slug === value)?.label ?? placeholder)
    : placeholder;

  const filtrados = useMemo(() => {
    const nq = norm(q.trim());
    if (!nq) return options;
    return options.filter((o) => norm(o.label).includes(nq));
  }, [q, options]);

  function updateRect() {
    if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect());
  }

  useEffect(() => {
    if (!open) return;
    updateRect();
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !popRef.current?.contains(t)) {
        setOpen(false);
      }
    }
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    document.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  function escolher(s: string) {
    onChange(s);
    setOpen(false);
    setQ("");
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-card px-3 text-sm transition-colors hover:bg-muted"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {labelSel}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open &&
        rect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-50 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
            style={{ top: rect.bottom + 4, left: rect.left, width: rect.width }}
          >
            <div className="border-b border-border p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar…"
                  className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="max-h-56 overflow-auto p-1">
              {filtrados.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Nada encontrado.
                </p>
              ) : (
                filtrados.map((o) => (
                  <button
                    key={o.slug}
                    type="button"
                    onClick={() => escolher(o.slug)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                      value === o.slug && "font-medium text-primary",
                    )}
                  >
                    {o.label}
                    {value === o.slug && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

// Combobox + campo livre que aparece ao escolher "Outro".
function CampoComOutro({
  label,
  options,
  slug,
  setSlug,
  outro,
  setOutro,
  placeholder,
  outroPlaceholder,
}: {
  label: string;
  options: OpcaoSimples[];
  slug: string;
  setSlug: (s: string) => void;
  outro: string;
  setOutro: (s: string) => void;
  placeholder: string;
  outroPlaceholder: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <ComboSelect
        options={options}
        value={slug}
        onChange={setSlug}
        placeholder={placeholder}
      />
      {slug === "outro" && (
        <Input
          autoFocus
          value={outro}
          onChange={(e) => setOutro(e.target.value)}
          placeholder={outroPlaceholder}
          className="mt-2"
        />
      )}
    </div>
  );
}

// Reverte um texto salvo (rótulo conhecido ou livre) para slug + texto de "Outro".
function reverter(options: OpcaoSimples[], texto: string): {
  slug: string;
  outro: string;
} {
  const t = texto.trim();
  if (!t) return { slug: "", outro: "" };
  const achado = options.find((o) => o.slug !== "outro" && o.label === t);
  if (achado) return { slug: achado.slug, outro: "" };
  return { slug: "outro", outro: t };
}

function SegBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Building2;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-input bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

// ── Campo principal: Segmento (privado/público) + os campos de cada caso ─────
export function SegmentoNegocioField({
  defaultValue,
}: {
  defaultValue?: string | null;
}) {
  const parsed = parseSegmento(defaultValue);
  const [seg, setSeg] = useState<"privado" | "publico">(
    parsed.publico ? "publico" : "privado",
  );

  // Privado: slug conhecido ou texto livre (mesma lógica de antes).
  const ramoInicial = parsed.publico ? "" : parsed.ramo;
  const ramoConhecido = TIPOS_NEGOCIO.some((t) => t.slug === ramoInicial);
  const [privSlug, setPrivSlug] = useState(
    ramoConhecido ? ramoInicial : ramoInicial ? "outro" : "",
  );
  const [privOutro, setPrivOutro] = useState(
    ramoConhecido || !ramoInicial ? "" : ramoInicial,
  );

  // Público: órgão + área (reverte o texto salvo para preencher os campos).
  const orgIni = reverter(ORGAOS_PUBLICOS, parsed.publico ? parsed.orgao : "");
  const areaIni = reverter(AREAS_PUBLICAS, parsed.publico ? parsed.area : "");
  const [orgSlug, setOrgSlug] = useState(orgIni.slug);
  const [orgOutro, setOrgOutro] = useState(orgIni.outro);
  const [areaSlug, setAreaSlug] = useState(areaIni.slug);
  const [areaOutro, setAreaOutro] = useState(areaIni.outro);

  const textoDe = (opts: OpcaoSimples[], slug: string, outro: string) =>
    slug === "outro"
      ? outro.trim()
      : (opts.find((o) => o.slug === slug)?.label ?? "");

  const orgText = textoDe(ORGAOS_PUBLICOS, orgSlug, orgOutro);
  const areaText = textoDe(AREAS_PUBLICAS, areaSlug, areaOutro);

  // Valor submetido no campo oculto `tipo_negocio`.
  const valor =
    seg === "publico"
      ? orgText || areaText
        ? encodePublico(orgText, areaText)
        : ""
      : privSlug === "outro"
        ? privOutro.trim()
        : privSlug;

  return (
    <div className="space-y-3">
      <input type="hidden" name="tipo_negocio" value={valor} />

      <div>
        <Label>Segmento *</Label>
        <div className="flex gap-2">
          <SegBtn
            active={seg === "privado"}
            onClick={() => setSeg("privado")}
            icon={Building2}
            label="Privado"
          />
          <SegBtn
            active={seg === "publico"}
            onClick={() => setSeg("publico")}
            icon={Landmark}
            label="Público"
          />
        </div>
      </div>

      {seg === "privado" ? (
        <div>
          <Label>Tipo de negócio *</Label>
          <ComboSelect
            options={TIPOS_NEGOCIO}
            value={privSlug}
            onChange={setPrivSlug}
            placeholder="Selecione o tipo de negócio"
          />
          {privSlug === "outro" && (
            <Input
              autoFocus
              value={privOutro}
              onChange={(e) => setPrivOutro(e.target.value)}
              placeholder="Descreva o ramo do negócio"
              className="mt-2"
            />
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Personaliza os checklists e relatórios gerados por IA para o ramo.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoComOutro
            label="Tipo do órgão *"
            options={ORGAOS_PUBLICOS}
            slug={orgSlug}
            setSlug={setOrgSlug}
            outro={orgOutro}
            setOutro={setOrgOutro}
            placeholder="Selecione o tipo do órgão"
            outroPlaceholder="Qual o tipo do órgão?"
          />
          <CampoComOutro
            label="Área *"
            options={AREAS_PUBLICAS}
            slug={areaSlug}
            setSlug={setAreaSlug}
            outro={areaOutro}
            setOutro={setAreaOutro}
            placeholder="Selecione a área"
            outroPlaceholder="Qual a área?"
          />
          <p className="mt-1 text-xs text-muted-foreground sm:col-span-2">
            Personaliza os checklists e relatórios gerados por IA para o órgão
            público.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Logo: upload de imagem (PNG/JPG até 20 MB) para o bucket público branding ─
const MAX_LOGO = 20 * 1024 * 1024; // 20 MB

export function LogoUploader({ defaultUrl }: { defaultUrl?: string | null }) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [subindo, setSubindo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite reenviar o mesmo arquivo
    if (!file) return;
    setErro(null);
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      setErro("Envie um arquivo PNG ou JPG.");
      return;
    }
    if (file.size > MAX_LOGO) {
      setErro("Imagem muito grande (máximo 20 MB).");
      return;
    }
    setSubindo(true);
    try {
      const supabase = createClient();
      const ext = file.type === "image/png" ? "png" : "jpg";
      const path = `logos/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("branding")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) {
        setErro(error.message);
        return;
      }
      const { data } = supabase.storage.from("branding").getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch {
      setErro("Falha ao enviar a imagem. Tente de novo.");
    } finally {
      setSubindo(false);
    }
  }

  return (
    <div>
      <Label>Logo</Label>
      <input type="hidden" name="logo_url" value={url} />
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-input bg-muted">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col items-start gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={subindo}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm transition-colors hover:bg-muted disabled:opacity-50"
          >
            {subindo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {subindo ? "Enviando…" : url ? "Trocar imagem" : "Enviar imagem"}
          </button>
          {url && !subindo && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-danger"
            >
              <X className="h-3 w-3" /> Remover
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          hidden
          onChange={onFile}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">PNG ou JPG, até 20 MB.</p>
      {erro && <p className="mt-1 text-xs text-danger">{erro}</p>}
    </div>
  );
}
