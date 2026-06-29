import { useEffect, useRef } from "react";

export function SignaturePad({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const inkedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 148;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";

    if (value) {
      const image = new Image();
      image.onload = () => ctx.drawImage(image, 0, 0, width, height);
      image.src = value;
      inkedRef.current = true;
    } else {
      inkedRef.current = false;
    }
  }, [value]);

  function coords(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) * canvas.width) / rect.width,
      y: ((clientY - rect.top) * canvas.height) / rect.height,
    };
  }

  function start(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawingRef.current = true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const point = coords(clientX, clientY);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x + 0.1, point.y + 0.1);
    ctx.stroke();
    inkedRef.current = true;
    onChange(canvas.toDataURL("image/png"));
  }

  function draw(clientX: number, clientY: number) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const point = coords(clientX, clientY);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    onChange(canvas.toDataURL("image/png"));
  }

  function stop() {
    drawingRef.current = false;
  }

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        className="min-h-[148px] w-full touch-none rounded-xl border border-dashed border-border bg-white"
        onMouseDown={(event) => start(event.clientX, event.clientY)}
        onMouseMove={(event) => draw(event.clientX, event.clientY)}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (touch) start(touch.clientX, touch.clientY);
        }}
        onTouchMove={(event) => {
          const touch = event.touches[0];
          if (touch) draw(touch.clientX, touch.clientY);
        }}
        onTouchEnd={stop}
      />
      <button
        type="button"
        onClick={() => onChange(null)}
        className="self-start text-xs text-muted-foreground hover:text-foreground"
      >
        Limpar assinatura
      </button>
    </div>
  );
}
