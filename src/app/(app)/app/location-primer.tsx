"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Solicita a permissão de localização ao ENTRAR no app (uma vez), para que o
// envio de checklist com geolocalização não falhe na hora por falta de permissão.
// Só dispara o prompt se ainda estiver "prompt" (não decidido) — se já foi
// concedida/negada, não incomoda. NÃO dispara no console do admin (/app/admin):
// é monitoramento/gestão, não preenche checklist.
export function LocationPrimer() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/app/admin")) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    let cancelado = false;

    (async () => {
      try {
        const perms = (navigator as Navigator & { permissions?: Permissions })
          .permissions;
        if (perms?.query) {
          const st = await perms.query({
            name: "geolocation" as PermissionName,
          });
          if (st.state !== "prompt") return; // já concedida ou negada
        }
        if (cancelado) return;
        navigator.geolocation.getCurrentPosition(
          () => {},
          () => {},
          { timeout: 8000, maximumAge: 600000 },
        );
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [pathname]);

  return null;
}
