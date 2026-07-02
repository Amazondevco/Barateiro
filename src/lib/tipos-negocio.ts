// Tipos de negócio (segmentos) da rede-cliente. O sistema é genérico para
// qualquer empresa que use checklists. Cada tipo tem um `descritor` — a frase
// que os prompts de IA usam como contexto do ramo (geração de checklist e
// relatórios). `usaGondola` marca ramos com abastecimento de gôndola/estoque
// (onde faz sentido o tipo de item "abastecido/ruptura").

export type TipoNegocio = {
  slug: string;
  label: string;
  descritor: string;
  usaGondola?: boolean;
};

export const TIPOS_NEGOCIO: TipoNegocio[] = [
  { slug: "seguranca", label: "Segurança patrimonial", descritor: "uma empresa de segurança patrimonial e vigilância (rondas, postos de serviço, controle de acesso, equipamentos)" },
  { slug: "transporte", label: "Transporte / Logística", descritor: "uma empresa de transporte e logística (coletas, entregas, rotas, expedição, conferência de carga)" },
  { slug: "frota", label: "Frota / Veículos", descritor: "gestão de frota de veículos (inspeção veicular, saída e retorno, manutenção, documentação)" },
  { slug: "industria", label: "Indústria / Manufatura", descritor: "uma indústria/manufatura (linha de produção, máquinas, segurança do trabalho, qualidade)" },
  { slug: "supermercado", label: "Supermercado / Varejo alimentar", descritor: "um supermercado / varejo alimentar (gôndolas, abastecimento, validade, temperatura, hortifrúti, açougue, padaria)", usaGondola: true },
  { slug: "varejo", label: "Varejo (lojas)", descritor: "um varejo em geral (loja, vitrine, estoque, atendimento, PDV)", usaGondola: true },
  { slug: "restaurante", label: "Restaurante / Food service", descritor: "um restaurante / food service (cozinha, boas práticas de manipulação, salão, estoque)" },
  { slug: "hotelaria", label: "Hotelaria", descritor: "um hotel / hotelaria (quartos, limpeza, recepção, áreas comuns, manutenção)" },
  { slug: "saude", label: "Saúde / Clínicas", descritor: "uma unidade de saúde (clínica/hospital: higienização, equipamentos, insumos, protocolos)" },
  { slug: "farmacia", label: "Farmácia / Drogaria", descritor: "uma farmácia / drogaria (validade, temperatura, controlados, gôndola, atendimento)", usaGondola: true },
  { slug: "construcao", label: "Construção civil / Obras", descritor: "uma obra / construção civil (frente de trabalho, EPIs, segurança, equipamentos)" },
  { slug: "facilities", label: "Facilities / Limpeza", descritor: "uma empresa de facilities / limpeza e conservação (rotinas de limpeza, insumos, áreas)" },
  { slug: "condominios", label: "Condomínios / Portaria", descritor: "um condomínio / portaria (ronda, controle de acesso, áreas comuns, equipamentos)" },
  { slug: "educacao", label: "Educação / Escolas", descritor: "uma escola / instituição de ensino (salas, limpeza, segurança, refeitório, equipamentos)" },
  { slug: "agro", label: "Agronegócio / Fazendas", descritor: "um agronegócio / fazenda (lavoura, currais, máquinas agrícolas, armazenagem, insumos)" },
  { slug: "postos", label: "Postos de combustível", descritor: "um posto de combustível (bombas, tanques, loja de conveniência, segurança, meio ambiente)", usaGondola: true },
  { slug: "academias", label: "Academias / Fitness", descritor: "uma academia / centro fitness (equipamentos, limpeza, vestiários, atendimento)" },
  { slug: "eventos", label: "Eventos", descritor: "uma operação de eventos (montagem, segurança, equipamentos, staff, abertura e fechamento)" },
  { slug: "manutencao-predial", label: "Manutenção predial", descritor: "manutenção predial (elétrica, hidráulica, elevadores, climatização, preventivas)" },
  { slug: "frigorifico", label: "Frigorífico / Alimentos", descritor: "um frigorífico / processamento de alimentos (temperatura, higiene, câmaras frias, rastreabilidade)" },
  { slug: "distribuidora", label: "Distribuidora / Atacado", descritor: "uma distribuidora / atacado (armazém, separação, expedição, estoque, validade)", usaGondola: true },
  { slug: "energia", label: "Óleo & gás / Energia", descritor: "uma operação de óleo & gás / energia (operação de campo, segurança, equipamentos, meio ambiente)" },
  { slug: "mineracao", label: "Mineração", descritor: "uma mineradora (frente de lavra, equipamentos pesados, segurança, meio ambiente)" },
  { slug: "automotivo", label: "Automotivo / Oficinas", descritor: "uma oficina / operação automotiva (recepção do veículo, serviços, peças, entrega, qualidade)" },
  { slug: "petshop", label: "Petshop / Veterinária", descritor: "um petshop / clínica veterinária (banho e tosa, loja, clínica, higiene, estoque)", usaGondola: true },
  { slug: "estetica", label: "Estética / Salão", descritor: "um salão / clínica de estética (higienização, equipamentos, atendimento, insumos)" },
  { slug: "telecom", label: "Telecom", descritor: "uma operação de telecom (instalações, sites/torres, equipamentos de rede, atendimento em campo)" },
  { slug: "financeiro", label: "Bancário / Financeiro", descritor: "uma agência bancária / financeira (autoatendimento, segurança, atendimento, conformidade)" },
  { slug: "laboratorio", label: "Laboratório", descritor: "um laboratório (coleta, equipamentos, insumos, biossegurança, qualidade)" },
  { slug: "outro", label: "Outro", descritor: "operações gerais da empresa" },
];

// ── Setor público ────────────────────────────────────────────────────────────
// Quando o segmento é público, o `tipo_negocio` guarda um JSON com órgão + área
// (texto já resolvido — rótulo conhecido ou o que o usuário digitou em "Outro").
// Toda a interpretação fica aqui: nada mais no app lê `tipo_negocio` cru.
export type OpcaoSimples = { slug: string; label: string };

export const ORGAOS_PUBLICOS: OpcaoSimples[] = [
  { slug: "secretaria", label: "Secretaria" },
  { slug: "prefeitura", label: "Prefeitura" },
  { slug: "camara", label: "Câmara Municipal" },
  { slug: "autarquia", label: "Autarquia" },
  { slug: "fundacao", label: "Fundação pública" },
  { slug: "empresa-publica", label: "Empresa pública" },
  { slug: "estadual", label: "Órgão estadual" },
  { slug: "federal", label: "Órgão federal" },
  { slug: "outro", label: "Outro" },
];

export const AREAS_PUBLICAS: OpcaoSimples[] = [
  { slug: "educacao", label: "Educação" },
  { slug: "saude", label: "Saúde" },
  { slug: "assistencia", label: "Assistência Social" },
  { slug: "turismo", label: "Turismo" },
  { slug: "cultura", label: "Cultura" },
  { slug: "esporte", label: "Esporte / Lazer" },
  { slug: "juventude", label: "Juventude" },
  { slug: "meio-ambiente", label: "Meio Ambiente" },
  { slug: "seguranca", label: "Segurança Pública" },
  { slug: "obras", label: "Obras / Infraestrutura" },
  { slug: "administracao", label: "Administração" },
  { slug: "fazenda", label: "Fazenda / Finanças" },
  { slug: "transporte", label: "Transporte / Mobilidade" },
  { slug: "agricultura", label: "Agricultura / Abastecimento" },
  { slug: "habitacao", label: "Habitação" },
  { slug: "comunicacao", label: "Comunicação" },
  { slug: "outro", label: "Outro" },
];

// Área para órgãos que NÃO são Secretaria (Prefeitura, Câmara, Autarquia…):
// setores administrativos, não temáticos.
export const AREAS_ADMIN: OpcaoSimples[] = [
  { slug: "gabinete", label: "Gabinete" },
  { slug: "administracao", label: "Administração" },
  { slug: "juridico", label: "Jurídico" },
  { slug: "financeiro", label: "Financeiro" },
  { slug: "rh", label: "Recursos Humanos" },
  { slug: "ti", label: "Tecnologia da Informação" },
  { slug: "compras", label: "Compras / Licitação" },
  { slug: "obras", label: "Obras / Infraestrutura" },
  { slug: "atendimento", label: "Atendimento ao público" },
  { slug: "outro", label: "Outro" },
];

// Departamentos (só Secretaria) — múltipla escolha. Lista aberta a mais itens.
export const DEPARTAMENTOS_PUBLICOS: string[] = [
  "Frota",
  "Limpeza",
  "Portaria",
  "Manutenção",
  "Segurança / Vigilância",
  "Almoxarifado",
  "Transporte",
  "Zeladoria",
  "Cozinha / Merenda",
  "Jardinagem",
  "TI",
  "Recursos Humanos",
  "Administrativo",
];

export type Segmento =
  | { publico: false; ramo: string } // privado: slug conhecido ou texto livre
  | { publico: true; orgao: string; area: string; deptos: string[] };

export function encodePublico(
  orgao: string,
  area: string,
  deptos: string[] = [],
): string {
  const o: { seg: "pub"; orgao: string; area: string; deptos?: string[] } = {
    seg: "pub",
    orgao: orgao.trim(),
    area: area.trim(),
  };
  const d = deptos.map((x) => x.trim()).filter(Boolean);
  if (d.length) o.deptos = d;
  return JSON.stringify(o);
}

export function parseSegmento(v?: string | null): Segmento {
  if (v && v.trimStart().startsWith("{")) {
    try {
      const o = JSON.parse(v) as {
        seg?: string;
        orgao?: string;
        area?: string;
        deptos?: unknown;
      };
      if (o?.seg === "pub") {
        return {
          publico: true,
          orgao: o.orgao ?? "",
          area: o.area ?? "",
          deptos: Array.isArray(o.deptos) ? o.deptos.map(String) : [],
        };
      }
    } catch {
      /* valor legado/corrompido → trata como privado */
    }
  }
  return { publico: false, ramo: v ?? "" };
}

// "Secretaria de Educação" quando faz sentido; senão junta com "·".
function rotuloPublico(orgao: string, area: string): string {
  if (orgao && area) {
    return orgao === "Secretaria" ? `Secretaria de ${area}` : `${orgao} · ${area}`;
  }
  return orgao || area || "Órgão público";
}

const MAP: Record<string, TipoNegocio> = Object.fromEntries(
  TIPOS_NEGOCIO.map((t) => [t.slug, t]),
);

const OUTRO = MAP["outro"];

export function tipoNegocio(slug?: string | null): TipoNegocio {
  return (slug && MAP[slug]) || OUTRO;
}

// Rótulo do tipo (para exibir a tag). Público mostra "órgão · área"; ramo livre
// ("Outro" digitado) mostra o próprio texto. Nulo se não houver.
export function labelNegocio(v?: string | null): string | null {
  if (!v) return null;
  const s = parseSegmento(v);
  if (s.publico) return rotuloPublico(s.orgao, s.area);
  return MAP[s.ramo]?.label ?? s.ramo ?? null;
}

// Descritor para os prompts de IA. Público → contexto de órgão público; ramo
// livre usa o texto; cai no genérico se vazio/desconhecido.
export function descritorNegocio(v?: string | null): string {
  const s = parseSegmento(v);
  if (s.publico) {
    const dep = s.deptos.length ? ` (departamentos: ${s.deptos.join(", ")})` : "";
    return `um órgão público (setor público) — ${rotuloPublico(s.orgao, s.area)}${dep}`;
  }
  if (s.ramo && MAP[s.ramo]) return MAP[s.ramo].descritor;
  const livre = s.ramo?.trim();
  if (livre) return `uma empresa do ramo "${livre}"`;
  return OUTRO.descritor;
}

export function usaGondola(v?: string | null): boolean {
  const s = parseSegmento(v);
  if (s.publico) return false;
  return Boolean(tipoNegocio(s.ramo).usaGondola);
}
