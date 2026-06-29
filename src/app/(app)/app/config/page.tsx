import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/lib/auth-actions";

export const metadata = { title: "Configurações — Check.AI" };

export default function ConfigPage() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-5">
      <h1 className="text-lg font-semibold">Configurações</h1>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <span className="text-sm">Tema</span>
        <ThemeToggle />
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger-bg px-4 py-3 text-sm font-medium text-danger"
        >
          <LogOut className="h-4 w-4" /> Sair da conta
        </button>
      </form>

      <p className="mt-2 text-center text-xs text-muted-foreground">Check.AI</p>
    </div>
  );
}
