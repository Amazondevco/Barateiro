"use client";

import { useEffect, useState } from "react";

// Transição entre páginas do operador (web) = já está "dentro do app": mostra
// só a logo da rede pulsando (o carrossel de abertura é do cold start nativo).
const CHECKAI = "/icon-512.svg";

export default function AppLoading() {
  const [logo, setLogo] = useState<string>(CHECKAI);

  useEffect(() => {
    try {
      const l = localStorage.getItem("checkai-logo");
      if (l) setLogo(l);
    } catch {
      /* ignora */
    }
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="checkai-loader-hold flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          className="h-16 w-16 rounded-2xl object-contain"
        />
      </div>
    </div>
  );
}
