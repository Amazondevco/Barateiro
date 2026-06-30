import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { Preferences } from "@capacitor/preferences";
import { isNativePlatform } from "./platform";

// OTA (atualização sem reinstalar) — modo manual.
// O bundle web é hospedado num bucket público do Supabase; um version.json diz
// qual é a versão atual + a URL do zip. Na abertura, se houver versão nova,
// baixa e aplica (recarrega no novo bundle). notifyAppReady evita rollback.

const BASE = import.meta.env.VITE_SUPABASE_URL;
const VERSION_URL = `${BASE}/storage/v1/object/public/native-bundles/version.json`;
const APPLIED_KEY = "ota_applied_version";

export async function initOta(): Promise<void> {
  if (!isNativePlatform()) return;
  // Confirma que ESTE bundle carregou bem (senão o Capgo reverte no próximo start).
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch {
    /* ignore */
  }
  // Checagem em segundo plano (não bloqueia a UI).
  void checkForUpdate();
}

async function checkForUpdate(): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const { version, url } = (await res.json()) as { version?: string; url?: string };
    if (!version || !url) return;

    const applied = (await Preferences.get({ key: APPLIED_KEY })).value;
    if (applied === version) return; // já está nesta versão

    const bundle = await CapacitorUpdater.download({ url, version });
    await Preferences.set({ key: APPLIED_KEY, value: version });
    // Aplica e recarrega no novo bundle (rápido; o usuário vê o splash de novo).
    await CapacitorUpdater.set(bundle);
  } catch (e) {
    console.warn("[ota] falha ao atualizar:", e);
  }
}
