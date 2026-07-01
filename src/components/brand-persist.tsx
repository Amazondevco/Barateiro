"use client";

import { useEffect } from "react";

// Persiste a logo da rede no cliente para a tela de carregamento (loading.tsx)
// poder mostrá-la no último quadro do carrossel. Espelha o app nativo.
export function BrandPersist({ logo }: { logo: string | null }) {
  useEffect(() => {
    try {
      if (logo) localStorage.setItem("checkai-logo", logo);
      else localStorage.removeItem("checkai-logo");
    } catch {
      /* ignora */
    }
  }, [logo]);
  return null;
}
