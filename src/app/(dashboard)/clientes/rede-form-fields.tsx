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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { TIPOS_NEGOCIO } from "@/lib/tipos-negocio";

// Normaliza para busca sem acento/caixa ("seguranca" acha "Segurança").
const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// ── Tipo de negócio: dropdown buscável + "Outro" com campo livre ────────────
export function TipoNegocioField({
  defaultValue,
}: {
  defaultValue?: string | null;
}) {
  const inicial = defaultValue ?? "";
  const conhecido = TIPOS_NEGOCIO.some((t) => t.slug === inicial);
  // Se o valor salvo não é um slug conhecido, é um ramo livre → "outro" + texto.
  const [slug, setSlug] = useState(
    conhecido ? inicial : inicial ? "outro" : "",
  );
  const [outro, setOutro] = useState(conhecido || !inicial ? "" : inicial);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const isOutro = slug === "outro";
  // Valor submetido: em "Outro" com texto, guarda o texto; senão o slug.
  const valor = isOutro ? outro.trim() || "outro" : slug;

  const labelSel = slug
    ? (TIPOS_NEGOCIO.find((t) => t.slug === slug)?.label ?? "Outro")
    : "Selecione o tipo de negócio";

  const filtrados = useMemo(() => {
    const nq = norm(q.trim());
    if (!nq) return TIPOS_NEGOCIO;
    return TIPOS_NEGOCIO.filter((t) => norm(t.label).includes(nq));
  }, [q]);

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
    setSlug(s);
    setOpen(false);
    setQ("");
  }

  return (
    <div>
      <input type="hidden" name="tipo_negocio" value={valor} />
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-card px-3 text-sm transition-colors hover:bg-muted"
        >
          <span className={slug ? "text-foreground" : "text-muted-foreground"}>
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
                    placeholder="Buscar ramo…"
                    className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-auto p-1">
                {filtrados.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    Nenhum ramo encontrado.
                  </p>
                ) : (
                  filtrados.map((t) => (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => escolher(t.slug)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                        slug === t.slug && "font-medium text-primary",
                      )}
                    >
                      {t.label}
                      {slug === t.slug && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </div>,
            document.body,
          )}
      </div>

      {isOutro && (
        <Input
          autoFocus
          value={outro}
          onChange={(e) => setOutro(e.target.value)}
          placeholder="Descreva o ramo do negócio"
          className="mt-2"
        />
      )}

      <p className="mt-1 text-xs text-muted-foreground">
        Personaliza os checklists e relatórios gerados por IA para o ramo.
      </p>
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
