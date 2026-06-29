import { Loader2 } from "lucide-react";

export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p>{label}</p>
      </div>
    </div>
  );
}
