"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

export type RosterState = { error?: string; ok?: boolean };

export async function addRosterPessoa(
  _prev: RosterState,
  formData: FormData,
): Promise<RosterState> {
  const caller = await getSessionProfile();
  if (caller?.papel !== "admin_supermercado" || !caller.rede_id) {
    return { error: "Sem permissão." };
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").replace(/\D/g, "");
  const cargo_id = String(formData.get("cargo_id") ?? "").trim() || null;
  const unidade_id = String(formData.get("unidade_id") ?? "").trim() || null;
  const departamento_id =
    String(formData.get("departamento_id") ?? "").trim() || null;

  if (!nome) return { error: "Informe o nome." };
  if (cpf.length !== 11) return { error: "CPF inválido (11 dígitos)." };

  const supabase = await createClient();
  const { error } = await supabase.from("rede_roster").insert({
    rede_id: caller.rede_id,
    cpf,
    nome,
    cargo_id,
    unidade_id,
    departamento_id,
    created_by: caller.id,
  });

  if (error) {
    return {
      error: /duplicate|unique/i.test(error.message)
        ? "Este CPF já está na equipe."
        : error.message,
    };
  }

  revalidatePath("/configuracoes");
  return { ok: true };
}

// Uma linha do roster é "fixa/padrão" (gerenciada pela Check.AI) quando não tem
// criador (semeada na criação da rede) ou foi criada por um super_admin. Essas
// não podem ser editadas nem apagadas pelo admin da rede.
async function rosterProtegido(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  redeId: string,
): Promise<{ existe: boolean; protegido: boolean }> {
  const { data: row } = await supabase
    .from("rede_roster")
    .select("created_by, rede_id")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.rede_id !== redeId) return { existe: false, protegido: true };
  if (!row.created_by) return { existe: true, protegido: true };
  const { data: criador } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", row.created_by)
    .maybeSingle();
  return { existe: true, protegido: criador?.papel === "super_admin" };
}

export async function updateRosterPessoa(
  id: string,
  _prev: RosterState,
  formData: FormData,
): Promise<RosterState> {
  const caller = await getSessionProfile();
  if (caller?.papel !== "admin_supermercado" || !caller.rede_id) {
    return { error: "Sem permissão." };
  }

  const supabase = await createClient();
  const { existe, protegido } = await rosterProtegido(supabase, id, caller.rede_id);
  if (!existe) return { error: "Pessoa não encontrada." };
  if (protegido) return { error: "Este cadastro é padrão da Check.AI e não pode ser editado." };

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Informe o nome." };

  const cargo_id = String(formData.get("cargo_id") ?? "").trim() || null;
  const unidade_id = String(formData.get("unidade_id") ?? "").trim() || null;
  const departamento_id =
    String(formData.get("departamento_id") ?? "").trim() || null;

  const { data: rosterRow, error } = await supabase
    .from("rede_roster")
    .update({ nome, cargo_id, unidade_id, departamento_id })
    .eq("id", id)
    .eq("rede_id", caller.rede_id)
    .select("cpf")
    .maybeSingle();

  if (error) return { error: error.message };

  // Sincroniza o VÍNCULO REAL (rede_membros) — é o que o app lê para decidir
  // quais checklists a pessoa vê. Sem isso, mexer no roster não muda nada para
  // quem já está cadastrado. Espelha unidade, departamento e cargo (permissão).
  if (rosterRow?.cpf) {
    const admin = createAdminClient();
    const { data: ident } = await admin
      .from("identidades")
      .select("id")
      .eq("cpf", rosterRow.cpf)
      .maybeSingle();
    if (ident?.id) {
      await admin
        .from("rede_membros")
        .update({ unidade_id, departamento_id, cargo_id })
        .eq("identidade_id", ident.id)
        .eq("rede_id", caller.rede_id);
    }
  }

  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function removeRosterPessoa(id: string): Promise<RosterState> {
  const caller = await getSessionProfile();
  if (caller?.papel !== "admin_supermercado" || !caller.rede_id) {
    return { error: "Sem permissão." };
  }
  const supabase = await createClient();
  const { existe, protegido } = await rosterProtegido(supabase, id, caller.rede_id);
  if (!existe) return { error: "Pessoa não encontrada." };
  if (protegido) return { error: "Este cadastro é padrão da Check.AI e não pode ser removido." };

  await supabase
    .from("rede_roster")
    .delete()
    .eq("id", id)
    .eq("rede_id", caller.rede_id);
  revalidatePath("/configuracoes");
  return { ok: true };
}

export type ImportState = {
  ok?: boolean;
  inseridos?: number;
  erros?: string[];
  error?: string;
};

// ---- Extração de texto de arquivos (PDF / Word / Excel / CSV) ----
async function extractText(file: File): Promise<{ texto: string; precisaIA: boolean }> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".pdf")) {
    // @ts-expect-error pdf-parse não tem tipos para este subpath
    const pdfMod = await import("pdf-parse/lib/pdf-parse.js");
    const pdf = pdfMod.default as (b: Buffer) => Promise<{ text: string }>;
    const data = await pdf(buf);
    return { texto: data.text ?? "", precisaIA: true };
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ buffer: buf });
    return { texto: r.value ?? "", precisaIA: true };
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buf, { type: "buffer" });
    const texto = wb.SheetNames.map((n) => XLSX.utils.sheet_to_csv(wb.Sheets[n])).join("\n");
    return { texto, precisaIA: false }; // planilha já é tabular
  }
  return { texto: buf.toString("utf8"), precisaIA: false };
}

// ---- IA: extrai pessoas de texto não-estruturado (PDF/Word) → linhas CSV ----
async function estruturarComIA(textoBruto: string): Promise<string[]> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return [];
  const SYSTEM = `Você extrai uma lista de funcionários de um documento.
Responda APENAS JSON válido: {"pessoas":[{"nome":string,"cpf":string,"cargo":string,"unidade":string,"departamento":string}]}.
- cpf: apenas os 11 dígitos (sem pontos/traços); se não houver, "".
- Não invente pessoas nem dados. Mantenha os nomes de cargo/unidade/departamento exatamente como aparecem.
- Ignore cabeçalhos, totais e linhas que não sejam pessoas.`;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        max_tokens: 6000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: textoBruto.slice(0, 30000) },
        ],
      }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { pessoas?: Record<string, string>[] };
    return (parsed.pessoas ?? []).map(
      (p) =>
        `${p.nome ?? ""};${p.cpf ?? ""};${p.cargo ?? ""};${p.unidade ?? ""};${p.departamento ?? ""}`,
    );
  } catch {
    return [];
  }
}

// Importa equipe: arquivo (Excel/PDF/Word) OU lista colada (CSV).
// Casa cargo/unidade/departamento por NOME (case-insensitive).
export async function importarRoster(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const caller = await getSessionProfile();
  if (caller?.papel !== "admin_supermercado" || !caller.rede_id) {
    return { error: "Sem permissão." };
  }

  // 1) obter as linhas (de arquivo ou texto colado)
  let linhas: string[] = [];
  const file = formData.get("file");
  const texto = String(formData.get("lista") ?? "").trim();

  if (file instanceof File && file.size > 0) {
    if (file.size > 12 * 1024 * 1024) return { error: "Arquivo muito grande (máx. 12MB)." };
    let extra;
    try {
      extra = await extractText(file);
    } catch {
      return { error: "Não consegui ler o arquivo. Use Excel, PDF, Word ou CSV." };
    }
    if (extra.precisaIA) {
      linhas = await estruturarComIA(extra.texto);
      if (linhas.length === 0)
        return { error: "A IA não encontrou pessoas no documento (pode ser imagem escaneada)." };
    } else {
      linhas = extra.texto.split(/\r?\n/);
    }
  } else if (texto) {
    linhas = texto.split(/\r?\n/);
  } else {
    return { error: "Envie um arquivo ou cole a lista." };
  }

  // 2) carregar mapas de nome → id da rede
  const supabase = await createClient();
  const [{ data: cargos }, { data: unidades }, { data: deptos }] = await Promise.all([
    supabase.from("cargos").select("id,nome").eq("rede_id", caller.rede_id),
    supabase.from("unidades").select("id,nome").eq("rede_id", caller.rede_id),
    supabase.from("departamentos").select("id,nome").eq("rede_id", caller.rede_id),
  ]);
  const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase();
  const cargoMap = new Map((cargos ?? []).map((c) => [norm(c.nome), c.id]));
  const uniMap = new Map((unidades ?? []).map((u) => [norm(u.nome), u.id]));
  const depMap = new Map((deptos ?? []).map((d) => [norm(d.nome), d.id]));

  // 3) montar linhas válidas
  const rows: Record<string, unknown>[] = [];
  const erros: string[] = [];
  for (const linha of linhas.map((l) => l.trim()).filter(Boolean)) {
    const cols = linha.split(/[;,\t]/).map((c) => c.trim());
    const [nome, cpfRaw, cargoNome, uniNome, depNome] = cols;
    if (norm(nome) === "nome" && norm(cpfRaw) === "cpf") continue; // cabeçalho
    const cpf = (cpfRaw ?? "").replace(/\D/g, "");
    if (!nome || cpf.length !== 11) {
      erros.push(`"${linha}" — nome ou CPF inválido`);
      continue;
    }
    rows.push({
      rede_id: caller.rede_id,
      cpf,
      nome,
      cargo_id: cargoMap.get(norm(cargoNome)) ?? null,
      unidade_id: uniMap.get(norm(uniNome)) ?? null,
      departamento_id: depMap.get(norm(depNome)) ?? null,
      created_by: caller.id,
    });
  }

  if (rows.length === 0) return { error: "Nenhuma pessoa válida encontrada.", erros };

  const { error } = await supabase
    .from("rede_roster")
    .upsert(rows, { onConflict: "rede_id,cpf", ignoreDuplicates: true });
  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  return { ok: true, inseridos: rows.length, erros };
}
