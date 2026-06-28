// Tipos compartilhados (espelham os enums/tabelas do schema).
// Futuro: substituir por tipos gerados via `supabase gen types`.

export type Papel = "super_admin" | "admin_supermercado" | "gerente";
export type UnidadeTipo = "loja" | "cd" | "escritorio" | "outro";
export type DeptoEscopo = "rede" | "unidade";
export type EntidadeStatus = "ativo" | "inativo";
export type ItemTipo = "ok_nao" | "sim_nao" | "abastecido_ruptura";
export type RespostaStatus = "no_prazo" | "fora_prazo";

export type Profile = {
  id: string;
  rede_id: string | null;
  nome: string;
  email: string;
  papel: Papel;
  avatar_url: string | null;
  status: EntidadeStatus;
};

export type Rede = {
  id: string;
  nome: string;
  cnpj: string | null;
  logo_url: string | null;
  cor_primaria: string | null;
  plano: string;
  modulos: string[];
  status: EntidadeStatus;
  contato_nome: string | null;
  contato_email: string | null;
  contato_fone: string | null;
  horario_limite: string;
  dias_frequencia: number[];
  janela_edicao_min: number;
  retencao_fotos_dias: number;
};

export type Unidade = {
  id: string;
  rede_id: string;
  nome: string;
  codigo: string | null;
  tipo: UnidadeTipo;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  status: EntidadeStatus;
};

export const PAPEL_LABEL: Record<Papel, string> = {
  super_admin: "Super Admin",
  admin_supermercado: "Admin",
  gerente: "Gerente",
};
