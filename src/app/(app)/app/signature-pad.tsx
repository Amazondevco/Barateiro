"use client";

import { useRef } from "react";
import { Eraser } from "lucide-react";

// Canvas de assinatura — eventos de MOUSE + TOUCH (suporte universal).
// Sempre branco com tinta escura. Dimensiona no 1º traço.
export function SignaturePad({
  onChange,
  label,
}: {
  onChange: (dataUrl: string | null) => void;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const inked = useRef(false);
  const sized = useRef(false);

  function setup() {
    const c = ref.current!;
    if (!sized.current) {
      c.width = c.clientWidth || 300;
      c.height = c.clientHeight || 128;
      const g0 = c.getContext("2d")!;
      g0.fillStyle = "#ffffff";
      g0.fillRect(0, 0, c.width, c.height);
      sized.current = true;
    }
    const g = c.getContext("2d")!;
    g.lineWidth = 2.6;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = "#111827";
    return g;
  }
  function coords(clientX: number, clientY: number) {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (c.width / r.width),
      y: (clientY - r.top) * (c.height / r.height),
    };
  }
  function start(clientX: number, clientY: number) {
    const g = setup();
    drawing.current = true;
    const p = coords(clientX, clientY);
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(p.x + 0.1, p.y + 0.1);
    g.stroke();
    inked.current = true;
  }
  function drawTo(clientX: number, clientY: number) {
    if (!drawing.current) return;
    const g = ref.current!.getContext("2d")!;
    const p = coords(clientX, clientY);
    g.lineTo(p.x, p.y);
    g.stroke();
  }
  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(inked.current ? ref.current!.toDataURL("image/png") : null);
  }
  function clear() {
    const c = ref.current!;
    const g = c.getContext("2d")!;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, c.width, c.height);
    inked.current = false;
    onChange(null);
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Eraser className="h-3.5 w-3.5" /> Limpar
        </button>
      </div>
      <canvas
        ref={ref}
        onMouseDown={(e) => start(e.clientX, e.clientY)}
        onMouseMove={(e) => drawTo(e.clientX, e.clientY)}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={(e) => {
          e.preventDefault();
          const t = e.touches[0];
          start(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const t = e.touches[0];
          drawTo(t.clientX, t.clientY);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          end();
        }}
        className="h-32 w-full cursor-crosshair rounded-lg border border-input"
        style={{ touchAction: "none", backgroundColor: "#ffffff" }}
      />
    </div>
  );
}
