export type FormOption = [string, string];

export type FormItem = {
  id: string;
  texto: string;
  tipo: string;
  ordem: number;
  opcoes: string[] | null;
  ajuda: string | null;
  obrigaObsQuandoNao: boolean;
  obrigaFotoQuandoNao: boolean;
};

export type FormSection = {
  id: string;
  titulo: string | null;
  ordem: number;
  permiteNa: boolean;
  quebraPagina: boolean;
  items: FormItem[];
};

export type FormDefinition = {
  id: string;
  nome: string;
  descricao: string | null;
  sections: FormSection[];
  // Geofence: se o formulário exige localização, em qual raio (metros) e quais
  // são as coordenadas da unidade do operador para validar a presença.
  exigeLocalizacao: boolean;
  geofenceRaioM: number | null;
  unidadeLat: number | null;
  unidadeLng: number | null;
  // Quando true, os campos de foto só abrem a câmera (sem galeria).
  fotoApenasCamera: boolean;
};

export type ProfileData = {
  nome: string | null;
  email: string | null;
  fotoUrl: string | null;
  cpf: string | null;
  telefone: string | null;
  cidade: string | null;
  unidade: string | null;
  cargo: string | null;
  rede: string | null;
};

export type FormResponseItemPayload = {
  itemId: string;
  valor: string;
  observacao: string | null;
  fotoDataUrl?: string;
};

export type PocSubmissionPayload = {
  title: string;
  location: string;
  notes: string;
};

export type FormResponsePayload = {
  memberId: string;
  formId: string;
  formName: string;
  submittedAt: string;
  signature: string;
  items: FormResponseItemPayload[];
  // GPS capturado no envio (quando o formulário exige localização).
  lat?: number | null;
  lng?: number | null;
};

export type QueueRecord =
  | {
      id: string;
      kind: "poc_submission";
      title: string;
      subtitle: string | null;
      createdAt: string;
      status: "pending" | "synced" | "error";
      errorMessage: string | null;
      payload: PocSubmissionPayload;
    }
  | {
      id: string;
      kind: "form_response";
      title: string;
      subtitle: string | null;
      createdAt: string;
      status: "pending" | "synced" | "error";
      errorMessage: string | null;
      payload: FormResponsePayload;
    };
