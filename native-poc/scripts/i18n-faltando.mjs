#!/usr/bin/env node
// Varre o código por textos em t("…") e lista os que ainda NÃO têm tradução em
// en.ts / es.ts. Assim, a cada atualização, é só rodar `node scripts/i18n-faltando.mjs`
// para saber o que falta traduzir (nada de novo passa sem tradução).
// As traduções ficam EMBUTIDAS no bundle (offline/privadas) — nada é enviado pra fora.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

function arquivos(dir) {
  const out = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...arquivos(p));
    else if (/\.(tsx?|jsx?)$/.test(nome) && !p.includes("/i18n/")) out.push(p);
  }
  return out;
}

// captura t("...") e t('...') e t(`...`) — só strings literais simples
const RE = /\bt\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;

const usados = new Set();
for (const f of arquivos(raiz)) {
  const src = readFileSync(f, "utf8");
  let m;
  while ((m = RE.exec(src))) {
    const s = m[2].replace(/\\"/g, '"').replace(/\\'/g, "'");
    if (s.trim()) usados.add(s);
  }
}

// Lê as CHAVES do dicionário (chave = string PT). Pega chaves com e sem aspas
// (ex.: `Conta:` e `"Minhas informações":`) no início de cada linha.
function dic(nome) {
  const src = readFileSync(join(raiz, "lib", "i18n", `${nome}.ts`), "utf8");
  const chaves = new Set();
  const re = /^\s*(?:"((?:\\.|[^"\\])+)"|'((?:\\.|[^'\\])+)'|([\p{L}\p{N}_$]+))\s*:/gmu;
  let m;
  while ((m = re.exec(src))) {
    const k = (m[1] ?? m[2] ?? m[3]).replace(/\\"/g, '"').replace(/\\'/g, "'");
    chaves.add(k);
  }
  return Object.fromEntries([...chaves].map((k) => [k, true]));
}

const en = dic("en");
const es = dic("es");

const faltamEn = [...usados].filter((s) => !(s in en));
const faltamEs = [...usados].filter((s) => !(s in es));

console.log(`Textos t("…") no código: ${usados.size}`);
console.log(`\nFaltam em INGLÊS (${faltamEn.length}):`);
faltamEn.forEach((s) => console.log(`  • ${s}`));
console.log(`\nFaltam em ESPANHOL (${faltamEs.length}):`);
faltamEs.forEach((s) => console.log(`  • ${s}`));

if (faltamEn.length || faltamEs.length) process.exitCode = 1;
