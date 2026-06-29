"use client";

import { useEffect } from "react";

// Quando o link de convite/recuperação cai no login (fallback de Site URL do
// Supabase), o token vem no hash da URL. Aqui detectamos e mandamos para a tela
// de cadastro/definição de senha, preservando o hash (que estabelece a sessão lá).
export function InviteHashGuard() {
  useEffect(() => {
    const h = window.location.hash;
    if (h && /(access_token=|type=(invite|recovery|signup))/.test(h)) {
      window.location.replace("/auth/redefinir" + h);
    }
  }, []);
  return null;
}
