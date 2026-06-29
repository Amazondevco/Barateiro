import { Bell, ClipboardCheck, Home, Settings, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/app", icon: Home, match: (p: string) => p === "/app" || p.startsWith("/app/rede") },
  { to: "/app/avisos", icon: Bell, match: (p: string) => p.startsWith("/app/avisos") },
  { to: "/app/formularios", icon: ClipboardCheck, match: (p: string) => p.startsWith("/app/formularios") },
  { to: "/app/perfil", icon: User, match: (p: string) => p.startsWith("/app/perfil") },
  { to: "/app/config", icon: Settings, match: (p: string) => p.startsWith("/app/config") },
];

export function BottomNav() {
  const location = useLocation();
  let active = tabs.findIndex((t) => t.match(location.pathname));
  if (active < 0) active = 0;

  return (
    // Barra flutuante: não encosta nas bordas; cliques passam pelas laterais.
    <nav className="pointer-events-none fixed inset-x-0 bottom-6 z-30 px-5">
      <div className="pointer-events-auto mx-auto flex h-16 max-w-md items-center justify-between rounded-[32px] bg-card px-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.1)]">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const on = i === active;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-label={tab.to}
              className="relative flex flex-1 items-center justify-center"
            >
              <span
                className={`relative flex h-[50px] w-[50px] items-center justify-center transition-transform duration-300 ${
                  on ? "-translate-y-[22px]" : ""
                }`}
              >
                {on ? (
                  <span className="absolute h-14 w-14 rounded-full border-[6px] border-background bg-primary shadow-[0_6px_14px_-2px_rgba(0,0,0,0.3)]" />
                ) : null}
                <Icon
                  className={`relative h-6 w-6 transition-colors duration-300 ${
                    on ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                />
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
