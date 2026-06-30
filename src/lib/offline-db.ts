// Fila local (IndexedDB) para envios de formulário feitos offline.
// Cada envio guarda os itens + fotos (dataURL) e a assinatura; a sincronização
// (offline-sync) sobe as fotos e chama a RPC quando há conexão.

const DB = "checkai-offline";
const VER = 1;
const OUTBOX = "outbox";

export type OutboxItem = {
  item_id: string;
  valor: string;
  observacao: string;
  fotoDataUrl?: string;
};

export type OutboxSubmission = {
  id?: number;
  membroId: string;
  formId: string;
  formNome: string;
  itens: OutboxItem[];
  assinatura: string;
  criadoEm: string;
  tentativas: number;
  erro?: string;
  lat?: number | null;
  lng?: number | null;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OUTBOX)) {
        db.createObjectStore(OUTBOX, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueSubmission(
  sub: Omit<OutboxSubmission, "id">,
): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = db.transaction(OUTBOX, "readwrite").objectStore(OUTBOX).add(sub);
    r.onsuccess = () => resolve(r.result as number);
    r.onerror = () => reject(r.error);
  });
}

export async function listOutbox(): Promise<OutboxSubmission[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = db.transaction(OUTBOX, "readonly").objectStore(OUTBOX).getAll();
    r.onsuccess = () =>
      resolve(
        (r.result as OutboxSubmission[]).sort(
          (a, b) => (a.id ?? 0) - (b.id ?? 0),
        ),
      );
    r.onerror = () => reject(r.error);
  });
}

export async function deleteOutbox(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = db.transaction(OUTBOX, "readwrite").objectStore(OUTBOX).delete(id);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

export async function updateOutbox(
  id: number,
  patch: Partial<OutboxSubmission>,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = db.transaction(OUTBOX, "readwrite").objectStore(OUTBOX);
    const g = store.get(id);
    g.onsuccess = () => {
      const cur = g.result as OutboxSubmission | undefined;
      if (!cur) return resolve();
      const p = store.put({ ...cur, ...patch, id });
      p.onsuccess = () => resolve();
      p.onerror = () => reject(p.error);
    };
    g.onerror = () => reject(g.error);
  });
}
