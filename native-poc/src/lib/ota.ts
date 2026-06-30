import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { App } from "@capacitor/app";
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
  // Confirma que ESTE bundle carregou bem (senão o Capgo reverte no próximo start).
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch {
    /* ignore */
  }
  void checkForUpdate();
  // Re-checa quando o app volta ao primeiro plano → atualização "automática".
  try {
    await App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void checkForUpdate();
    });
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
