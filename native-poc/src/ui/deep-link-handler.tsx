import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getRouteFromDeepLink,
  getPendingCadastro,
  setPendingCadastro,
} from "../lib/deep-links";

export function DeepLinkHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  // Cadastro pendente (guardado de forma durável) → garante que o app chegue na
  // tela de conclusão mesmo depois de um reload do webview (ex.: OTA no boot).
  // A tela de definir senha limpa o pendente ao concluir ou descartar o link.
  useEffect(() => {
    const pend = getPendingCadastro();
    if (pend && !location.pathname.startsWith("/definir-senha")) {
      navigate(pend, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const listener = CapacitorApp.addListener("appUrlOpen", (event) => {
      const route = getRouteFromDeepLink(event.url);
      if (route) {
        setPendingCadastro(route);
        navigate(route);
      }
    });

    void CapacitorApp.getLaunchUrl().then((launchUrl) => {
      const route = launchUrl?.url ? getRouteFromDeepLink(launchUrl.url) : null;
      if (route) {
        setPendingCadastro(route);
        navigate(route, { replace: true });
      }
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [navigate]);

  return null;
}
