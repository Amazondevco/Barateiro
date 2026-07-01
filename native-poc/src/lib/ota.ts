import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { App } from "@capacitor/app";
import { Preferences } from "@capacitor/preferences";
import { isNativePlatform } from "./platform";
import { getPendingCadastro } from "./deep-links";

// OTA (atualização sem reinstalar) — modo manual, com ROLLBACK SEGURO.
// Checa na abertura E sempre que o app volta ao primeiro plano (resume).

const BASE = import.meta.env.VITE_SUPABASE_URL;
const VERSION_URL = `${BASE}/storage/v1/object/public/native-bundles/version.json`;
const APPLIED_KEY = "ota_applied_version";

export type OtaResult = "updated" | "uptodate" | "offline" | "error";

let rodando = false;
let resumeArmado = false;

export async function initOta(): Promise<void> {
  if (!isNativePlatform()) return;

  // ROLLBACK SEGURO: notifyAppReady marca o bundle que ESTÁ RODANDO como "bom".
  // Se um bundle aplicado antes tivesse quebrado (tela branca), o app nunca chega
  // aqui — e o Capgo reverte sozinho pro último bundle bom (ou o embarcado do APK)
  // no próximo start. Por isso NÃO resetamos mais pro embarcado no boot: se abriu
  // e chegou aqui, é confiável. Foi a falta desse "confirmar" que bricava antes.
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch {
    /* ignore */
  }

  // Checa agora (abertura) e a cada volta ao primeiro plano — sem precisar reabrir.
  void checkForUpdate();
  if (!resumeArmado) {
    resumeArmado = true;
    try {
      await App.addListener("resume", () => void checkForUpdate());
    } catch {
      /* ignore */
    }
  }
}

export async function checkForUpdate(): Promise<OtaResult> {
  if (!isNativePlatform()) return "error";
  // Não recarregar por cima de um cadastro em andamento (deep link do convite):
  // um reload do OTA jogaria o usuário fora da tela de conclusão. Adia até
  // concluir/descartar (quando o pendente é limpo).
  if (getPendingCadastro()) return "uptodate";
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
    // Marca ANTES de aplicar: se este bundle quebrar, o Capgo reverte no próximo
    // start e NÃO tentamos rebaixar o mesmo bundle ruim em loop. Para destravar,
    // basta publicar uma versão nova (SHA novo) — aí applied !== version de novo.
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
