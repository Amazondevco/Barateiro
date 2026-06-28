"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  ImageIcon,
  RotateCcw,
  Check,
  Sun,
  Moon,
  Eraser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { FormState } from "./actions";

const DEFAULT_COLOR = "#2563eb";
const SIDEBAR_DEFAULT = "#0f172a";
const PALETTE = [
  "#2563eb", "#1d4ed8", "#0ea5e9", "#06b6d4", "#14b8a6", "#16a34a",
  "#22c55e", "#84cc16", "#eab308", "#f59e0b", "#f97316", "#ef4444",
  "#dc2626", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6", "#6366f1",
  "#64748b", "#0f172a",
];
// Tons escuros e claros — a cor do texto se ajusta automaticamente
const SIDEBAR_PALETTE = [
  // escuros
  "#0f172a", "#1e293b", "#18181b", "#1c1917", "#0c4a6e", "#064e3b",
  "#1e1b4b", "#3b0764", "#172554", "#450a0a", "#334155",
  // claros
  "#ffffff", "#f1f5f9", "#e2e8f0", "#dbeafe", "#dcfce7", "#fef9c3",
  "#fee2e2", "#f3e8ff",
];

// true = cor clara → texto escuro
function isLight(hex: string): boolean {
  const m = hex.replace("#", "");
  if (m.length < 6) return false;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6;
}
// Temas prontos: aplicam cor primária + barra lateral de uma vez
const THEMES = [
  { nome: "Azul", primary: "#2563eb", sidebar: "#0f172a" },
  { nome: "Índigo", primary: "#6366f1", sidebar: "#1e1b4b" },
  { nome: "Esmeralda", primary: "#10b981", sidebar: "#064e3b" },
  { nome: "Vermelho", primary: "#dc2626", sidebar: "#1c1917" },
  { nome: "Roxo", primary: "#8b5cf6", sidebar: "#2e1065" },
  { nome: "Laranja", primary: "#f97316", sidebar: "#1c1917" },
  { nome: "Rosa", primary: "#ec4899", sidebar: "#172554" },
  { nome: "Grafite", primary: "#3b82f6", sidebar: "#18181b" },
];

// Remove o fundo (cor dos cantos), recorta margens, centraliza num quadrado e
// exporta 256px transparente (nítido p/ sidebar e favicon).
async function processLogo(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const w = bmp.width;
  const h = bmp.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bmp, 0, 0);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  // amostra a borda (cantos + meios das bordas) p/ estimar a cor do fundo
  const mx = w >> 1;
  const my = h >> 1;
  const edgePts = [
    0,
    (w - 1) * 4,
    (h - 1) * w * 4,
    ((h - 1) * w + (w - 1)) * 4,
    mx * 4,
    ((h - 1) * w + mx) * 4,
    my * w * 4,
    (my * w + (w - 1)) * 4,
  ];
  let ca = 0,
    br = 0,
    bg = 0,
    bb = 0;
  for (const i of edgePts) {
    ca += d[i + 3];
    br += d[i];
    bg += d[i + 1];
    bb += d[i + 2];
  }
  const n = edgePts.length;
  ca /= n;
  br /= n;
  bg /= n;
  bb /= n;

  // remove fundo sempre que a borda for opaca (imagem com fundo sólido)
  if (ca > 150) {
    const tol = 72;
    for (let i = 0; i < d.length; i += 4) {
      const dist = Math.sqrt(
        (d[i] - br) ** 2 + (d[i + 1] - bg) ** 2 + (d[i + 2] - bb) ** 2,
      );
      if (dist < tol) d[i + 3] = 0;
      else if (dist < tol * 1.6)
        d[i + 3] = Math.round((d[i + 3] * (dist - tol)) / (tol * 0.6));
    }
    ctx.putImageData(img, 0, 0);
  }

  // bounding box pelo alpha
  const d2 = ctx.getImageData(0, 0, w, h).data;
  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0,
    found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d2[(y * w + x) * 4 + 3] > 16) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) {
    minX = 0;
    minY = 0;
    maxX = w - 1;
    maxY = h - 1;
  }
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;

  const SIZE = 256;
  const out = document.createElement("canvas");
  out.width = SIZE;
  out.height = SIZE;
  const octx = out.getContext("2d");
  if (!octx) return file;
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";
  const scale = (SIZE * 0.9) / Math.max(cw, ch);
  const dw = cw * scale;
  const dh = ch * scale;
  // desenha do canvas JÁ com fundo removido
  octx.drawImage(
    canvas,
    minX,
    minY,
    cw,
    ch,
    (SIZE - dw) / 2,
    (SIZE - dh) / 2,
    dw,
    dh,
  );

  return await new Promise<Blob>((resolve) =>
    out.toBlob((b) => resolve(b ?? file), "image/png"),
  );
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Favicon = logo (transparente) sobre tile arredondado cinza claro.
async function makeFavicon(logoBlob: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(logoBlob);
  const SIZE = 256;
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext("2d");
  if (!ctx) return logoBlob;
  ctx.fillStyle = "#94a3b8"; // cinza mais escuro (visível na aba)
  roundRectPath(ctx, 0, 0, SIZE, SIZE, 52);
  ctx.fill();
  const pad = 40;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, pad, pad, SIZE - 2 * pad, SIZE - 2 * pad);
  return await new Promise<Blob>((res) =>
    c.toBlob((b) => res(b ?? logoBlob), "image/png"),
  );
}

export function AparenciaForm({
  action,
  redeId,
  nome,
  logoUrl,
  faviconUrl,
  bannerUrl,
  cor,
  corSidebar,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  redeId: string;
  nome: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  bannerUrl: string | null;
  cor: string | null;
  corSidebar: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [logo, setLogo] = useState(logoUrl ?? "");
  const [favicon, setFavicon] = useState(faviconUrl ?? "");
  const [banner, setBanner] = useState(bannerUrl ?? "");
  const [color, setColor] = useState(cor ?? DEFAULT_COLOR);
  const [sidebar, setSidebar] = useState(corSidebar ?? SIDEBAR_DEFAULT);
  const [preview, setPreview] = useState<"light" | "dark">("light");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Após salvar, atualiza os Server Components (sidebar inclusive) sem F5
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  async function upload(file: File, kind: "logo" | "banner") {
    setErr(null);
    setBusy(kind);
    try {
      const supabase = createClient();
      const pub = (p: string) =>
        supabase.storage.from("branding").getPublicUrl(p).data.publicUrl;

      if (kind === "logo") {
        const logoBlob = await processLogo(file); // remove fundo + quadra + 256
        const lp = `${redeId}/logo-${Date.now()}.png`;
        const { error: le } = await supabase.storage
          .from("branding")
          .upload(lp, logoBlob, { upsert: true, contentType: "image/png" });
        if (le) throw le;
        setLogo(pub(lp));
        // favicon = logo sobre tile cinza arredondado
        const favBlob = await makeFavicon(logoBlob);
        const fp = `${redeId}/favicon-${Date.now()}.png`;
        const { error: fe } = await supabase.storage
          .from("branding")
          .upload(fp, favBlob, { upsert: true, contentType: "image/png" });
        if (!fe) setFavicon(pub(fp));
      } else {
        const ext = (file.name.split(".").pop() || "png").toLowerCase();
        const bp = `${redeId}/banner-${Date.now()}.${ext}`;
        const { error: be } = await supabase.storage
          .from("branding")
          .upload(bp, file, { upsert: true });
        if (be) throw be;
        setBanner(pub(bp));
      }
    } catch {
      setErr("Falha no upload. Tente uma imagem menor (PNG/JPG).");
    } finally {
      setBusy(null);
    }
  }

  // Remove o fundo da logo no navegador: torna transparente a cor dos cantos.
  async function removeBackground() {
    if (!logo) return;
    setErr(null);
    setBusy("nobg");
    try {
      const res = await fetch(logo, { cache: "no-store" });
      const bmp = await createImageBitmap(await res.blob());
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error();
      ctx.drawImage(bmp, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = img.data;
      const w = canvas.width;
      const h = canvas.height;
      // cor de fundo = média dos 4 cantos
      const corners = [
        0,
        (w - 1) * 4,
        (h - 1) * w * 4,
        ((h - 1) * w + (w - 1)) * 4,
      ];
      let br = 0,
        bgc = 0,
        bb = 0;
      for (const i of corners) {
        br += d[i];
        bgc += d[i + 1];
        bb += d[i + 2];
      }
      br /= 4;
      bgc /= 4;
      bb /= 4;
      const tol = 60; // tolerância da cor de fundo
      for (let i = 0; i < d.length; i += 4) {
        const dr = d[i] - br;
        const dg = d[i + 1] - bgc;
        const db = d[i + 2] - bb;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < tol) d[i + 3] = 0;
        else if (dist < tol * 1.7)
          d[i + 3] = Math.round((255 * (dist - tol)) / (tol * 0.7));
      }
      ctx.putImageData(img, 0, 0);
      const keyed = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, "image/png"),
      );
      if (!keyed) throw new Error();
      // recorta + quadra o resultado (margens agora transparentes)
      const out = await processLogo(
        new File([keyed], "logo.png", { type: "image/png" }),
      );
      const supabase = createClient();
      const path = `${redeId}/logo-nobg-${Date.now()}.png`;
      const { error } = await supabase.storage
        .from("branding")
        .upload(path, out, { upsert: true, contentType: "image/png" });
      if (error) throw error;
      setLogo(supabase.storage.from("branding").getPublicUrl(path).data.publicUrl);
      const favBlob = await makeFavicon(out);
      const fp = `${redeId}/favicon-${Date.now()}.png`;
      const { error: fe } = await supabase.storage
        .from("branding")
        .upload(fp, favBlob, { upsert: true, contentType: "image/png" });
      if (!fe)
        setFavicon(
          supabase.storage.from("branding").getPublicUrl(fp).data.publicUrl,
        );
    } catch {
      setErr("Não consegui remover o fundo dessa imagem.");
    } finally {
      setBusy(null);
    }
  }

  function resetAll() {
    setLogo(logoUrl ?? "");
    setFavicon(faviconUrl ?? "");
    setBanner(bannerUrl ?? "");
    setColor(cor ?? DEFAULT_COLOR);
    setSidebar(corSidebar ?? SIDEBAR_DEFAULT);
    setErr(null);
  }

  return (
    <form action={formAction} className="max-w-3xl space-y-8 pb-4">
      <input type="hidden" name="logo_url" value={logo} />
      <input type="hidden" name="favicon_url" value={favicon} />
      <input type="hidden" name="banner_url" value={banner} />
      <input type="hidden" name="cor_primaria" value={color} />
      <input type="hidden" name="cor_sidebar" value={sidebar} />

      {/* BANNER */}
      <section>
        <h3 className="text-lg font-semibold">Banner</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Imagem de cabeçalho da rede. Prefira PNG transparente, em formato
          panorâmico. Aparece no topo do ambiente.
        </p>
        <div
          onClick={() => bannerInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) upload(f, "banner");
          }}
          className="mt-3 cursor-pointer rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary"
        >
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner}
              alt="Banner"
              className="mx-auto max-h-28 rounded-lg object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm">
                {busy === "banner"
                  ? "Enviando…"
                  : "Arraste o banner ou clique para selecionar"}
              </span>
            </div>
          )}
          <input
            ref={bannerInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f, "banner");
            }}
          />
        </div>
        {banner && (
          <button
            type="button"
            onClick={() => setBanner("")}
            className="mt-2 text-xs text-danger hover:underline"
          >
            Remover banner
          </button>
        )}
      </section>

      {/* ÍCONE / LOGO */}
      <section>
        <h3 className="text-lg font-semibold">Ícone / Logo</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pequeno ícone que representa a rede no menu e na aba do navegador.
        </p>
        <div className="mt-3 flex items-center gap-4">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={nome}
              className="h-14 w-14 rounded-xl border border-border object-contain"
            />
          ) : (
            <span
              className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{ background: color }}
            >
              {nome.charAt(0)}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => logoInput.current?.click()}
            disabled={!!busy}
          >
            <Upload className="h-4 w-4" />
            {busy === "logo" ? "Enviando…" : "Carregar imagem"}
          </Button>
          {logo && (
            <Button
              type="button"
              variant="outline"
              onClick={removeBackground}
              disabled={!!busy}
            >
              <Eraser className="h-4 w-4" />
              {busy === "nobg" ? "Removendo…" : "Remover fundo"}
            </Button>
          )}
          {logo && (
            <button
              type="button"
              onClick={() => setLogo("")}
              className="text-xs text-danger hover:underline"
            >
              Remover
            </button>
          )}
          <input
            ref={logoInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f, "logo");
            }}
          />
        </div>
      </section>

      {/* TEMA */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tema</h3>
          <button
            type="button"
            onClick={() => {
              setColor(DEFAULT_COLOR);
              setSidebar(SIDEBAR_DEFAULT);
            }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Redefinir para o padrão
          </button>
        </div>

        {/* Temas prontos */}
        <div>
          <p className="mb-2 text-sm font-medium">Temas prontos</p>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => {
              const active =
                color.toLowerCase() === t.primary.toLowerCase() &&
                sidebar.toLowerCase() === t.sidebar.toLowerCase();
              return (
                <button
                  key={t.nome}
                  type="button"
                  onClick={() => {
                    setColor(t.primary);
                    setSidebar(t.sidebar);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-1.5 pr-3 text-sm transition",
                    active
                      ? "border-primary ring-1 ring-primary"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-md"
                    style={{ background: t.sidebar }}
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: t.primary }}
                    />
                  </span>
                  {t.nome}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cor primária */}
        <div>
          <p className="mb-2 text-sm font-medium">Cor primária</p>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => {
              const selected = color.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={cn(
                    "relative h-9 w-9 rounded-full ring-offset-2 ring-offset-background transition",
                    selected && "ring-2 ring-foreground",
                  )}
                  style={{ background: c }}
                >
                  {selected && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                  )}
                </button>
              );
            })}
            <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-dashed border-border text-lg text-muted-foreground hover:border-primary hover:text-primary">
              +
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* Cor da barra lateral */}
        <div>
          <p className="mb-2 text-sm font-medium">Cor da barra lateral</p>
          <div className="flex flex-wrap gap-2">
            {SIDEBAR_PALETTE.map((c) => {
              const selected = sidebar.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSidebar(c)}
                  aria-label={c}
                  className={cn(
                    "relative h-9 w-9 rounded-lg ring-offset-2 ring-offset-background transition",
                    selected && "ring-2 ring-foreground",
                  )}
                  style={{ background: c }}
                >
                  {selected && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRÉVIA */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Prévia</h3>
          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setPreview("light")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md",
                preview === "light" ? "bg-muted" : "text-muted-foreground",
              )}
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreview("dark")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md",
                preview === "dark" ? "bg-muted" : "text-muted-foreground",
              )}
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className={preview === "dark" ? "dark" : ""}>
          <div className="mt-3 flex overflow-hidden rounded-xl border border-border">
            {/* Mini barra lateral */}
            <div
              className="flex w-40 shrink-0 flex-col gap-2 p-3"
              style={{ background: sidebar }}
            >
              <div className="flex items-center gap-2">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={nome}
                    className="h-7 w-7 rounded-md object-contain"
                  />
                ) : (
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white"
                    style={{ background: color }}
                  >
                    {nome.charAt(0)}
                  </span>
                )}
                <span
                  className={cn(
                    "truncate text-xs font-bold",
                    isLight(sidebar) ? "text-slate-900" : "text-white",
                  )}
                >
                  {nome}
                </span>
              </div>
              <span
                className="mt-1 rounded-md px-2 py-1 text-xs font-medium text-white"
                style={{ background: color }}
              >
                Visão geral
              </span>
              <span
                className={cn(
                  "rounded-md px-2 py-1 text-xs",
                  isLight(sidebar) ? "text-slate-600" : "text-slate-300",
                )}
              >
                Formulários
              </span>
              <span
                className={cn(
                  "rounded-md px-2 py-1 text-xs",
                  isLight(sidebar) ? "text-slate-600" : "text-slate-300",
                )}
              >
                Relatórios
              </span>
            </div>
            {/* Conteúdo */}
            <div
              className="flex flex-1 flex-col gap-3 bg-background p-4"
              style={{ ["--primary"]: color } as React.CSSProperties}
            >
              <div className="text-sm font-bold text-foreground">{nome}</div>
              <div className="flex gap-2">
                <span
                  className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-white"
                  style={{ background: color }}
                >
                  Botão primário
                </span>
                <span
                  className="inline-flex h-9 items-center rounded-lg border px-4 text-sm font-medium"
                  style={{ borderColor: color, color }}
                >
                  Outline
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {err && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {err}
        </p>
      )}
      {state.error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-success-bg px-3 py-2 text-sm text-success">
          Salvo e aplicado no ambiente.
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={resetAll}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || !!busy}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
