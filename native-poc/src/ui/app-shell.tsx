import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./bottom-nav";

export function AppShell() {
  const location = useLocation();
  const compact =
    /\/formularios\/teste-offline$/.test(location.pathname) ||
    /\/rede\/[^/]+\/form\/[^/]+$/.test(location.pathname);

  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>
      {!compact ? <BottomNav /> : null}
    </div>
  );
}
