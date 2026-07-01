import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { Preferences } from "@capacitor/preferences";
import { isNativePlatform } from "./platform";

// OTA (atualização sem reinstalar) — modo manual.
// Checa na abertura E sempre que o app volta ao primeiro plano (resume), então
// não é preciso fechar/reabrir. Também dá pra forçar via pull-to-refresh.

const BASE = import.meta.env.VITE_SUPABASE_URL;
const VERSION_URL = `${BASE}/storage/v1/object/public/native-bundles/version.json`;
const APPLIED_KEY = "ota_applied_version";

export type OtaResult = "updated" | "uptodate" | "offline" | "error";

let rodando = false;

export async function initOta(): Promise<void> {
  if (!isNativePlatform()) return;
  // Confirma que ESTE bundle carregou bem (evita o Capgo reverter um bundle bom).
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch {
    /* ignore */
  }
  // SEGURANÇA: o auto-apply de OTA no boot estava bricando o app (aplicava um
  // bundle remoto que não montava). Agora o app SEMPRE abre pelo bundle embarcado
  // do APK (confiável). Se por acaso estiver rodando um bundle OTA aplicado antes,
  // volta pro embarcado. Só reseta quando NÃO é o embarcado (evita loop de reload).
  try {
    const cur = await CapacitorUpdater.current();
    const id = cur?.bundle?.id;
    if (id && id !== "builtin") {
      await CapacitorUpdater.reset(); // volta ao bundle embarcado
    }
  } catch {
    /* ignore */
  }
}

export async function checkForUpdate(): Promise<OtaResult> {
  if (!isNativePlatform()) return "error";
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  if (rodando) return "uptodate";
  rodando = true;
  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return "error";
    const { version, url } = (await res.json()) as { version?: string; url?: string };
    if (!version || !url) return "error";

    const applied = (await Preferences.get({ key: APPLIED_KEY })).value;
    if (applied === version) return "uptodate"; // já está nesta versão

    const bundle = await CapacitorUpdater.download({ url, version });
    await Preferences.set({ key: APPLIED_KEY, value: version });
    await CapacitorUpdater.set(bundle); // aplica e recarrega no novo bundle
    return "updated";
  } catch (e) {
    console.warn("[ota] falha ao atualizar:", e);
    return "error";
  } finally {
    rodando = false;
  }
}
