// Cria o super_admin + semeia a rede Barateiro e 1 loja piloto.
// Uso: node scripts/setup-admin.mjs <email> <senha>
// Requer .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
import { readFileSync } from "node:fs";

// carrega .env.local
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const [email, senha] = process.argv.slice(2);

if (!email || !senha) {
  console.error("Uso: node scripts/setup-admin.mjs <email> <senha>");
  process.exit(1);
}

const h = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function main() {
  // 1) super_admin
  const u = await fetch(`${URL_}/auth/v1/admin/users`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome: "Super Admin", papel: "super_admin" },
    }),
  });
  const uj = await u.json();
  if (!u.ok) {
    console.error("Erro ao criar usuário:", uj);
  } else {
    console.log("✓ super_admin criado:", uj.email ?? email);
  }

  // 2) rede Barateiro (idempotente por nome)
  const existing = await fetch(
    `${URL_}/rest/v1/redes?nome=eq.Super%20Barateiro&select=id`,
    { headers: h },
  ).then((r) => r.json());

  let redeId = existing?.[0]?.id;
  if (!redeId) {
    const r = await fetch(`${URL_}/rest/v1/redes`, {
      method: "POST",
      headers: { ...h, Prefer: "return=representation" },
      body: JSON.stringify({
        nome: "Super Barateiro",
        cor_primaria: "#2563eb",
        plano: "free",
      }),
    });
    const rj = await r.json();
    if (!r.ok) return console.error("Erro ao criar rede:", rj);
    redeId = rj[0].id;
    console.log("✓ rede criada:", redeId);
  } else {
    console.log("• rede já existe:", redeId);
  }

  // 3) loja piloto
  const lojas = await fetch(
    `${URL_}/rest/v1/unidades?rede_id=eq.${redeId}&select=id`,
    { headers: h },
  ).then((r) => r.json());
  if (!lojas?.length) {
    const l = await fetch(`${URL_}/rest/v1/unidades`, {
      method: "POST",
      headers: { ...h, Prefer: "return=representation" },
      body: JSON.stringify({
        rede_id: redeId,
        nome: "Loja Piloto",
        codigo: "001",
        tipo: "loja",
      }),
    });
    const lj = await l.json();
    if (!l.ok) return console.error("Erro ao criar loja:", lj);
    console.log("✓ loja piloto criada:", lj[0].id);
  } else {
    console.log("• loja já existe");
  }

  console.log("\nPronto. Faça login em /login com:", email);
}

main();
