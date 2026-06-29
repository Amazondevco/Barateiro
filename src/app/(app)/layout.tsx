// Shell do app do usuário final (PWA) — mobile-first, sem o chrome do dashboard.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
        {children}
      </div>
    </div>
  );
}
