import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { isNativePlatform } from "./platform";
import type {
  FormResponsePayload,
  PocSubmissionPayload,
  QueueRecord,
} from "./operator-types";

const WEB_KEY = "checkai-native-operator-queue";
const DB_NAME = "checkai_native_operator";
const TABLE = "operator_queue";

let sqliteConnection: SQLiteConnection | null = null;
let database: SQLiteDBConnection | null = null;

function createId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toStoredRecord(row: Record<string, unknown>): QueueRecord {
  return {
    id: String(row.id),
    kind: row.kind as QueueRecord["kind"],
    title: String(row.title),
    subtitle: row.subtitle ? String(row.subtitle) : null,
    payload: JSON.parse(String(row.payload)) as QueueRecord["payload"],
    createdAt: String(row.created_at),
    status: row.status as QueueRecord["status"],
    errorMessage: row.error_message ? String(row.error_message) : null,
  } as QueueRecord;
}

async function getDb() {
  if (!isNativePlatform()) return null;

  if (!sqliteConnection) {
    sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  }

  if (database) return database;

  await sqliteConnection.checkConnectionsConsistency();
  database = await sqliteConnection.createConnection(DB_NAME, false, "no-encryption", 1, false);
  await database.open();
  await database.execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT
    );
  `);

  return database;
}

function readWebQueue() {
  const raw = window.localStorage.getItem(WEB_KEY);
  if (!raw) return [] as QueueRecord[];

  try {
    return JSON.parse(raw) as QueueRecord[];
  } catch {
    return [];
  }
}

function writeWebQueue(items: QueueRecord[]) {
  window.localStorage.setItem(WEB_KEY, JSON.stringify(items));
}

async function persistRecord(record: QueueRecord) {
  const db = await getDb();
  if (db) {
    await db.run(
      `INSERT INTO ${TABLE} (id, kind, title, subtitle, payload, created_at, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.kind,
        record.title,
        record.subtitle,
        JSON.stringify(record.payload),
        record.createdAt,
        record.status,
        record.errorMessage,
      ],
    );
    return;
  }

  const items = readWebQueue();
  items.unshift(record);
  writeWebQueue(items);
}

export async function initializeQueueStore() {
  await getDb();
}

export async function enqueuePocSubmission(payload: PocSubmissionPayload) {
  const record: QueueRecord = {
    id: createId(),
    kind: "poc_submission",
    title: payload.title,
    subtitle: payload.location,
    payload,
    createdAt: new Date().toISOString(),
    status: "pending",
    errorMessage: null,
  };
  await persistRecord(record);
  return record;
}

export async function enqueueFormResponse(payload: FormResponsePayload) {
  const record: QueueRecord = {
    id: createId(),
    kind: "form_response",
    title: payload.formName,
    subtitle: `Membro ${payload.memberId.slice(0, 8)}`,
    payload,
    createdAt: payload.submittedAt,
    status: "pending",
    errorMessage: null,
  };
  await persistRecord(record);
  return record;
}

export async function getQueueItems() {
  const db = await getDb();
  if (db) {
    const result = await db.query(
      `SELECT id, kind, title, subtitle, payload, created_at, status, error_message
       FROM ${TABLE}
       ORDER BY created_at DESC`,
    );
    return (result.values ?? []).map((row) => toStoredRecord(row));
  }

  return readWebQueue();
}

export async function markQueueItemStatus(
  id: string,
  status: QueueRecord["status"],
  errorMessage: string | null,
) {
  const db = await getDb();
  if (db) {
    await db.run(`UPDATE ${TABLE} SET status = ?, error_message = ? WHERE id = ?`, [
      status,
      errorMessage,
      id,
    ]);
    return;
  }

  const items = readWebQueue().map((item) =>
    item.id === id ? { ...item, status, errorMessage } : item,
  );
  writeWebQueue(items);
}

export async function removeQueueItem(id: string) {
  const db = await getDb();
  if (db) {
    await db.run(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    return;
  }

  writeWebQueue(readWebQueue().filter((item) => item.id !== id));
}
