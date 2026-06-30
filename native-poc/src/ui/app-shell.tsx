import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./bottom-nav";
import { NativeStatusBanner } from "./native-status-banner";
import { PullToRefresh } from "./pull-to-refresh";
import { checkForUpdate } from "../lib/ota";

// Puxar pra baixo: checa atualização (OTA) e recarrega o app.
async function aoRecarregar() {
  const r = await checkForUpdate();
  if (r !== "updated") window.location.reload();
}

export function AppShell() {
  const location = useLocation();
  const compact =
    /\/formularios\/teste-offline$/.test(location.pathname) ||
    /\/rede\/[^/]+\/form\/[^/]+$/.test(location.pathname);

  return (
    <div className="app-shell flex min-h-screen flex-col bg-background">
      <NativeStatusBanner />
      <main className={`flex-1 ${compact ? "" : "pb-[110px]"}`}>
        <PullToRefresh onRefresh={aoRecarregar}>
          <Outlet />
        </PullToRefresh>
      </main>
      {!compact ? <BottomNav /> : null}
    </div>
  );
}
