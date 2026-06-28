// Executa um arquivo .sql no projeto via Supabase Management API.
// Uso: SBP_TOKEN=sbp_xxx node scripts/db-exec.mjs <ref> <arquivo.sql>
import { readFileSync } from "node:fs";

const token = process.env.SBP_TOKEN;
const [ref, file] = process.argv.slice(2);
if (!token || !ref || !file) {
  console.error("Uso: SBP_TOKEN=... node scripts/db-exec.mjs <ref> <arquivo.sql>");
  process.exit(1);
}

const query = readFileSync(file, "utf8");

const res = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  },
);

const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}`);
  console.error(text);
  process.exit(1);
}
console.log(`HTTP ${res.status} — OK`);
console.log(text.slice(0, 500));
