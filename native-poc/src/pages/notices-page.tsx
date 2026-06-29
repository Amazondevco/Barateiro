import { Mail } from "lucide-react";

export function NoticesPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Mail className="h-7 w-7" />
      </div>
      <p className="font-medium">Sem avisos por enquanto</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Comunicados e mensagens da sua rede vão aparecer aqui.
      </p>
    </div>
  );
}
