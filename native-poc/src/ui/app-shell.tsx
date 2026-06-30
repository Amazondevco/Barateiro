import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Geolocation } from "@capacitor/geolocation";
import { BottomNav } from "./bottom-nav";
import { NativeStatusBanner } from "./native-status-banner";
import { PullToRefresh } from "./pull-to-refresh";
import { isNativePlatform } from "../lib/platform";
import { checkForUpdate } from "../lib/ota";

// Pede a permissão de localização logo ao entrar (uma vez), para que o envio de
// checklist com geolocalização não falhe na hora por falta de permissão.
async function pedirPermissaoLocalizacao() {
  if (!isNativePlatform()) return;
  try {
    const p = await Geolocation.checkPermissions();
    if (p.location === "prompt" || p.location === "prompt-with-rationale") {
      await Geolocation.requestPermissions();
    }
  } catch {
    /* ignore */
  }
}

// Puxar pra baixo: checa atualização (OTA) e recarrega o app.
async function aoRecarregar() {
  const r = await checkForUpdate();
  if (r !== "updated") window.location.reload();
}

export function AppShell() {
  const location = useLocation();
  useEffect(() => {
    void pedirPermissaoLocalizacao();
  }, []);
  const compact =
    /\/formularios\/teste-offline$/.test(location.pathname) ||
    /\/rede\/[^/]+\/form\/[^/]+$/.test(location.pathname);
  // Home da rede (com o banner colorido) vai edge-to-edge no topo: o banner passa
  // por baixo da barra de status. O respiro do conteúdo é tratado no banner.
  const immersiveTop = /\/rede\/[^/]+$/.test(location.pathname);

  return (
    // Safe areas do Android/iOS (edge-to-edge): no topo, empurra o conteúdo das
    // telas normais para baixo da barra de status; nas telas com cabeçalho fixo
    // (formulário) o respiro do topo é tratado no próprio header.
    <div
      className="app-shell flex min-h-screen flex-col bg-background"
      style={{
        paddingTop:
          compact || immersiveTop ? undefined : "env(safe-area-inset-top)",
      }}
    >
      <NativeStatusBanner />
      <main
        className="flex-1"
        style={{
          paddingBottom: compact
            ? undefined
            : "calc(110px + env(safe-area-inset-bottom))",
        }}
      >
        <PullToRefresh onRefresh={aoRecarregar}>
          <Outlet />
        </PullToRefresh>
      </main>
      {!compact ? <BottomNav /> : null}
    </div>
  );
}
