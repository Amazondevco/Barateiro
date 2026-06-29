import { Capacitor } from "@capacitor/core";
import { PushNotifications, type Token } from "@capacitor/push-notifications";
import { supabase } from "./supabase";

// Push (FCM) — só roda em nativo. Registra o device token do usuário logado na
// tabela `device_tokens`; o painel resolve esses tokens ao enviar um comunicado.

let currentToken: string | null = null;
let listenersBound = false;

function isSupported() {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("PushNotifications");
}

async function saveToken(token: string) {
  currentToken = token;
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return; // sem sessão; salva no próximo login
  const { error } = await supabase
    .from("device_tokens")
    .upsert(
      { token, identidade_id: uid, platform: Capacitor.getPlatform() },
      { onConflict: "token" },
    );
  if (error) console.warn("[push] falha ao salvar token:", error.message);
}

async function bindListeners() {
  if (listenersBound) return;
  listenersBound = true;

  await PushNotifications.addListener("registration", (token: Token) => {
    void saveToken(token.value);
  });
  await PushNotifications.addListener("registrationError", (err) => {
    console.warn("[push] erro de registro:", JSON.stringify(err));
  });
}

// Pede permissão (Android 13+ / iOS) e registra no FCM/APNs.
// Idempotente: pode ser chamado a cada login.
export async function registerPush() {
  if (!isSupported()) return;
  try {
    await bindListeners();
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") return;
    await PushNotifications.register();
  } catch (e) {
    console.warn("[push] registerPush falhou:", e);
  }
}

// Remove o token deste device (best effort) — chamar no logout.
export async function unregisterPush() {
  if (!isSupported() || !currentToken) return;
  try {
    await supabase.from("device_tokens").delete().eq("token", currentToken);
  } catch (e) {
    console.warn("[push] unregisterPush falhou:", e);
  }
  currentToken = null;
}
