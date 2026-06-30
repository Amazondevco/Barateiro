"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  Building2,
  Store,
  Users,
  UserCircle,
  ClipboardList,
  FolderTree,
  CornerDownLeft,
  type LucideIcon,
} from "lucide-react";

type Hit = { id: string; title: string; subtitle?: string; href: string };
type Group = { key: string; label: string; hits: Hit[] };

const ICONES: Record<string, LucideIcon> = {
  clientes: Building2,
  usuarios: UserCircle,
  equipe: Users,
  formularios: ClipboardList,
  unidades: Store,
  departamentos: FolderTree,
};

export function TopbarSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1); // índice na lista achatada
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [expandido, setExpandido] = useState(false); // só a lupa até passar o mouse/clicar

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recolhe a barra se estiver vazia, sem foco e sem o painel aberto.
  function talvezRecolher() {
    const focado = document.activeElement === inputRef.current;
    if (!focado && !q.trim() && !open) setExpandido(false);
  }

  // lista achatada de hits (p/ navegação por teclado)
  const flat = groups.flatMap((g) => g.hits);

  // posiciona o dropdown ancorado ao campo
  function updateRect() {
    if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect());
  }
  useEffect(() => {
    if (!open) return;
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open]);

  // busca com debounce
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/busca?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        });
        const data = (await r.json()) as { groups: Group[] };
        setGroups(data.groups ?? []);
        setActive(-1);
      } catch {
        /* abortado */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  // fecha ao clicar fora
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function irParaBusca() {
    if (q.trim().length < 1) return;
    setOpen(false);
    router.push(`/busca?q=${encodeURIComponent(q.trim())}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && flat[active]) {
        const h = flat[active];
        setOpen(false);
        router.push(h.href);
      } else {
        irParaBusca();
      }
    }
  }

  const term = q.trim();
  const showPanel = open && term.length >= 2;

  return (
    <div
      ref={wrapRef}
      className="relative hidden md:block"
      onMouseEnter={() => setExpandido(true)}
      onMouseLeave={talvezRecolher}
    >
      {/* Lupa fixa (sobreposta) + input que cresce suavemente para a esquerda */}
      <span className="pointer-events-none absolute left-0 top-0 flex h-9 w-9 items-center justify-center text-foreground/70">
        <Search className="h-[18px] w-[18px]" />
      </span>
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => {
          setExpandido(true);
          setOpen(true);
        }}
        onBlur={talvezRecolher}
        onKeyDown={onKeyDown}
        placeholder="Buscar em tudo…"
        aria-label="Buscar"
        className={`h-9 rounded-lg border bg-foreground/5 pl-9 pr-3 text-sm text-foreground outline-none transition-[width,background-color,border-color] duration-300 ease-out placeholder:text-muted-foreground ${
          expandido
            ? "w-72 cursor-text border-foreground/25 bg-foreground/10"
            : "w-9 cursor-pointer border-transparent bg-transparent"
        }`}
      />

      {showPanel &&
        rect &&
        createPortal(
          <div
            className="fixed z-50 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-xl"
            style={{
              top: rect.bottom + 6,
              left: Math.max(8, rect.right - 384),
              width: 384,
            }}
          >
            <div className="max-h-[70vh] overflow-y-auto py-1.5">
              {loading && groups.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
                </div>
              ) : groups.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">
                  Nada encontrado para “{term}”.
                </div>
              ) : (
                groups.map((g) => {
                  const Icon = ICONES[g.key] ?? Search;
                  return (
                    <div key={g.key} className="mb-1">
                      <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" /> {g.label}
                      </p>
                      {g.hits.map((h) => {
                        const idx = flat.findIndex(
                          (x) => x === h || (x.id === h.id && x.href === h.href),
                        );
                        const on = idx === active;
                        return (
                          <button
                            key={g.key + h.id}
                            onMouseEnter={() => setActive(idx)}
                            onClick={() => {
                              setOpen(false);
                              router.push(h.href);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                              on ? "bg-primary/10" : "hover:bg-muted/60"
                            }`}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">
                                {h.title}
                              </span>
                              {h.subtitle && (
                                <span className="block truncate text-xs text-muted-foreground">
                                  {h.subtitle}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}

              <button
                onClick={irParaBusca}
                className="mt-1 flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-muted/60"
              >
                <Search className="h-4 w-4" />
                Ver todos os resultados para “{term}”
                <CornerDownLeft className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
