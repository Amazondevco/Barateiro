// Endereço da rede. Guardado como JSON no campo `redes.endereco` (text) — sem
// migração; toda leitura/escrita passa por aqui. Valor legado (texto simples)
// cai em `logradouro`.

export type Endereco = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

const VAZIO: Endereco = {
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

export function parseEndereco(v?: string | null): Endereco {
  if (v && v.trimStart().startsWith("{")) {
    try {
      const o = JSON.parse(v) as Partial<Endereco>;
      return { ...VAZIO, ...o };
    } catch {
      /* corrompido → vazio */
    }
  }
  return v ? { ...VAZIO, logradouro: v } : { ...VAZIO };
}

// JSON com os campos preenchidos; null se tudo vazio (não ocupa a coluna à toa).
export function encodeEndereco(e: Endereco): string | null {
  const limpo = Object.fromEntries(
    Object.entries(e).map(([k, val]) => [k, val.trim()]),
  ) as Endereco;
  const algum = Object.values(limpo).some(Boolean);
  return algum ? JSON.stringify(limpo) : null;
}

// Uma linha legível (para exibir em telas/relatórios).
export function enderecoLinha(v?: string | null): string {
  const e = parseEndereco(v);
  const rua = [e.logradouro, e.numero].filter(Boolean).join(", ");
  const partes = [rua, e.complemento, e.bairro, [e.cidade, e.uf].filter(Boolean).join("/")]
    .map((p) => p.trim())
    .filter(Boolean);
  return partes.join(" · ");
}
