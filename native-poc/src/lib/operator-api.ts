import { supabase } from "./supabase";
import type { FormDefinition, ProfileData } from "./operator-types";

export type Membership = {
  id: string;
  redeId: string;
  status: string;
  redeNome: string;
  unidadeNome: string | null;
};

export type NetworkHomeData = {
  membership: {
    id: string;
    redeId: string;
    status: string;
    unidadeNome: string | null;
    unidadeTipo: string | null;
    cargoNome: string | null;
    unidadeId: string | null;
    departamentoId: string | null;
  };
  brand: {
    nome: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    primaryColor: string | null;
  };
  forms: Array<{
    id: string;
    nome: string;
    descricao: string | null;
    enviadoHoje: boolean;
  }>;
};

export async function fetchMemberships() {
  const { data, error } = await supabase
    .from("rede_membros")
    .select("id, rede_id, status, redes(nome), unidades(nome)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    redeId: String(row.rede_id),
    status: String(row.status),
    redeNome: typeof row.redes === "object" && row.redes && "nome" in row.redes ? String(row.redes.nome ?? "Minha rede") : "Minha rede",
    unidadeNome:
      typeof row.unidades === "object" && row.unidades && "nome" in row.unidades
        ? (row.unidades.nome as string | null)
        : null,
  })) satisfies Membership[];
}

export async function fetchNetworkHome(memberId: string, userId: string) {
  const [{ data: member, error: memberError }, { data: todayAnswers, error: answersError }] =
    await Promise.all([
      supabase
        .from("rede_membros")
        .select("id, rede_id, status, unidade_id, departamento_id, unidades(nome, tipo), cargos(nome)")
        .eq("id", memberId)
        .single(),
      supabase
        .from("respostas")
        .select("formulario_id")
        .eq("usuario_id", userId)
        .eq("data_referencia", new Date().toISOString().slice(0, 10)),
    ]);

  if (memberError) throw memberError;
  if (answersError) throw answersError;

  const { data: brand, error: brandError } = await supabase
    .from("redes")
    .select("nome, logo_url, banner_url, app_cor, cor_primaria")
    .eq("id", member.rede_id)
    .single();

  if (brandError) throw brandError;

  const { data: forms, error: formsError } = await supabase
    .from("formularios")
    .select(
      "id, nome, descricao, tipo_unidade, dias_semana, status, formulario_unidades(unidade_id), formulario_departamentos(departamento_id)",
    )
    .eq("rede_id", member.rede_id)
    .eq("status", "ativo")
    .order("nome");

  if (formsError) throw formsError;

  const sentToday = new Set((todayAnswers ?? []).map((row) => String(row.formulario_id)));
  const today = new Date().getDay() || 7;
  const unitType =
    typeof member.unidades === "object" && member.unidades && "tipo" in member.unidades
      ? (member.unidades.tipo as string | null)
      : null;

  const filteredForms = (forms ?? [])
    .filter((form) => {
      const weekdays = (form.dias_semana as number[] | null) ?? [];
      if (weekdays.length > 0 && !weekdays.includes(today)) return false;

      if (form.tipo_unidade && unitType && form.tipo_unidade !== unitType) return false;

      const allowedUnits = ((form.formulario_unidades as Array<{ unidade_id: string }> | null) ?? []).map(
        (row) => row.unidade_id,
      );
      if (allowedUnits.length > 0 && (!member.unidade_id || !allowedUnits.includes(member.unidade_id))) {
        return false;
      }

      const allowedDepartments = (
        (form.formulario_departamentos as Array<{ departamento_id: string }> | null) ?? []
      ).map((row) => row.departamento_id);
      if (
        allowedDepartments.length > 0 &&
        (!member.departamento_id || !allowedDepartments.includes(member.departamento_id))
      ) {
        return false;
      }

      return true;
    })
    .map((form) => ({
      id: String(form.id),
      nome: String(form.nome),
      descricao: (form.descricao as string | null) ?? null,
      enviadoHoje: sentToday.has(String(form.id)),
    }));

  return {
    membership: {
      id: String(member.id),
      redeId: String(member.rede_id),
      status: String(member.status),
      unidadeNome:
        typeof member.unidades === "object" && member.unidades && "nome" in member.unidades
          ? (member.unidades.nome as string | null)
          : null,
      unidadeTipo: unitType,
      cargoNome:
        typeof member.cargos === "object" && member.cargos && "nome" in member.cargos
          ? (member.cargos.nome as string | null)
          : null,
      unidadeId: (member.unidade_id as string | null) ?? null,
      departamentoId: (member.departamento_id as string | null) ?? null,
    },
    brand: {
      nome: String(brand.nome ?? "Minha rede"),
      logoUrl: (brand.logo_url as string | null) ?? null,
      bannerUrl: (brand.banner_url as string | null) ?? null,
      primaryColor: ((brand.app_cor as string | null) ?? (brand.cor_primaria as string | null)) ?? null,
    },
    forms: filteredForms,
  } satisfies NetworkHomeData;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("identidades")
    .select("nome, email, foto_url, cpf, celular, cidade")
    .eq("id", userId)
    .single();

  if (error) throw error;

  const { data: member } = await supabase
    .from("rede_membros")
    .select("redes(nome), unidades(nome), cargos(nome)")
    .eq("identidade_id", userId)
    .eq("status", "ativo")
    .limit(1)
    .maybeSingle();

  return {
    nome: (data.nome as string | null) ?? null,
    email: (data.email as string | null) ?? null,
    fotoUrl: (data.foto_url as string | null) ?? null,
    cpf: (data.cpf as string | null) ?? null,
    telefone: (data.celular as string | null) ?? null,
    cidade: (data.cidade as string | null) ?? null,
    unidade:
      typeof member?.unidades === "object" && member.unidades && "nome" in member.unidades
        ? (member.unidades.nome as string | null)
        : null,
    cargo:
      typeof member?.cargos === "object" && member.cargos && "nome" in member.cargos
        ? (member.cargos.nome as string | null)
        : null,
    rede:
      typeof member?.redes === "object" && member.redes && "nome" in member.redes
        ? (member.redes.nome as string | null)
        : null,
  } satisfies ProfileData;
}

export function applyPrimaryColor(color: string | null) {
  if (!color || typeof document === "undefined") return;
  // Cor da rede vale para barra, botões e banner (igual ao app PWA):
  // injeta --primary e o hover (escurece 15%).
  const root = document.documentElement.style;
  root.setProperty("--primary", color);
  root.setProperty("--primary-hover", `color-mix(in srgb, ${color} 85%, black)`);
}

export async function fetchFormDefinition(memberId: string, formId: string) {
  const [{ data: member, error: memberError }, { data: form, error: formError }] = await Promise.all([
    supabase.from("rede_membros").select("assinatura_svg").eq("id", memberId).maybeSingle(),
    supabase
      .from("formularios")
      .select(
        "id, nome, descricao, formulario_secoes(id, titulo, ordem, permite_na, quebra_pagina, formulario_itens(id, texto, tipo, ordem, opcoes, ajuda, obriga_obs_quando_nao, obriga_foto_quando_nao))",
      )
      .eq("id", formId)
      .single(),
  ]);

  if (memberError) throw memberError;
  if (formError) throw formError;

  const sections = ((form.formulario_secoes as Array<Record<string, unknown>> | null) ?? [])
    .sort((left, right) => Number(left.ordem) - Number(right.ordem))
    .map((section) => ({
      id: String(section.id),
      titulo: (section.titulo as string | null) ?? null,
      ordem: Number(section.ordem),
      permiteNa: Boolean(section.permite_na),
      quebraPagina: Boolean(section.quebra_pagina),
      items: ((section.formulario_itens as Array<Record<string, unknown>> | null) ?? [])
        .sort((left, right) => Number(left.ordem) - Number(right.ordem))
        .map((item) => ({
          id: String(item.id),
          texto: String(item.texto),
          tipo: String(item.tipo),
          ordem: Number(item.ordem),
          opcoes: (item.opcoes as string[] | null) ?? null,
          ajuda: (item.ajuda as string | null) ?? null,
          obrigaObsQuandoNao: Boolean(item.obriga_obs_quando_nao),
          obrigaFotoQuandoNao: Boolean(item.obriga_foto_quando_nao),
        })),
    }));

  return {
    form: {
      id: String(form.id),
      nome: String(form.nome),
      descricao: (form.descricao as string | null) ?? null,
      sections,
    } satisfies FormDefinition,
    signature: ((member as { assinatura_svg?: string | null } | null)?.assinatura_svg ?? null) as string | null,
  };
}
