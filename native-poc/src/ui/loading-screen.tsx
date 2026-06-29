import { Loader2 } from "lucide-react";

export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="screen centered">
      <div className="card status-card">
        <Loader2 className="spin" />
        <p>{label}</p>
      </div>
    </div>
  );
}
