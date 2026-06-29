import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./bottom-nav";
import { NativeStatusBanner } from "./native-status-banner";

export function AppShell() {
  const location = useLocation();
  const compact =
    /\/formularios\/teste-offline$/.test(location.pathname) ||
    /\/rede\/[^/]+\/form\/[^/]+$/.test(location.pathname);

  return (
    <div className="app-shell flex min-h-screen flex-col bg-background">
      <NativeStatusBanner />
      <main className={`flex-1 ${compact ? "" : "pb-[110px]"}`}>
        <Outlet />
      </main>
      {!compact ? <BottomNav /> : null}
    </div>
  );
}
