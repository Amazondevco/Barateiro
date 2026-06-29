import { Bell, Home, Settings, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/app", icon: Home, match: (p: string) => p === "/app" || p.startsWith("/app/rede") },
  { to: "/app/avisos", icon: Bell, match: (p: string) => p.startsWith("/app/avisos") },
  { to: "/app/perfil", icon: User, match: (p: string) => p.startsWith("/app/perfil") },
  { to: "/app/config", icon: Settings, match: (p: string) => p.startsWith("/app/config") },
];

export function BottomNav() {
  const location = useLocation();
  let active = tabs.findIndex((t) => t.match(location.pathname));
  if (active < 0) active = 0;
  const n = tabs.length;

  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-card">
      <div className="relative mx-auto flex h-[60px] max-w-md items-center">
        {/* indicador deslizante: largura = 1 célula; pílula centralizada por flex */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ width: `${100 / n}%`, transform: `translateX(${active * 100}%)` }}
          aria-hidden
        >
          <div className="h-[40px] w-[44px] rounded-[15px] bg-primary shadow-sm" />
        </div>

        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const on = i === active;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className="relative z-10 flex h-full flex-1 items-center justify-center"
              aria-label={tab.to}
            >
              <Icon
                className={`h-[21px] w-[21px] transition-colors duration-300 ${
                  on ? "text-primary-foreground" : "text-muted-foreground"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
