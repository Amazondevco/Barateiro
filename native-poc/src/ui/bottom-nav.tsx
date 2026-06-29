import { Bell, ClipboardCheck, Home, Settings, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const tabs = [
  { to: "/app", label: "Início", icon: Home, match: (path: string) => path === "/app" || path.startsWith("/app/rede") },
  { to: "/app/avisos", label: "Avisos", icon: Bell, match: (path: string) => path.startsWith("/app/avisos") },
  { to: "/app/formularios", label: "Enviados", icon: ClipboardCheck, match: (path: string) => path.startsWith("/app/formularios") },
  { to: "/app/perfil", label: "Perfil", icon: User, match: (path: string) => path.startsWith("/app/perfil") },
  { to: "/app/config", label: "Config", icon: Settings, match: (path: string) => path.startsWith("/app/config") },
];

export function BottomNav() {
  const location = useLocation();
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.match(location.pathname)));

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-highlight" style={{ transform: `translateX(${activeIndex * 100}%)` }} />
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `bottom-nav-item ${isActive || tab.match(location.pathname) ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
