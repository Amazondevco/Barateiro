import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { useNavigate } from "react-router-dom";
import { getRouteFromDeepLink } from "../lib/deep-links";

export function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const listener = CapacitorApp.addListener("appUrlOpen", (event) => {
      const route = getRouteFromDeepLink(event.url);

      if (route) {
        navigate(route);
      }
    });

    void CapacitorApp.getLaunchUrl().then((launchUrl) => {
      const route = launchUrl?.url ? getRouteFromDeepLink(launchUrl.url) : null;

      if (route) {
        navigate(route, { replace: true });
      }
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [navigate]);

  return null;
}
