type ClassValue = string | number | false | null | undefined;

/** cn mínimo (sem dependência): junta classes truthy. */
export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ");
}

/** true se a cor (hex) for clara → usar texto escuro por cima (igual ao PWA). */
export function isLightHex(hex: string): boolean {
  const m = hex.replace("#", "");
  if (m.length < 6) return false;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6;
}
