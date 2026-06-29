import { Capacitor } from "@capacitor/core";
import { PushNotifications, type Token, type PushNotificationSchema } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { supabase } from "./supabase";

// Push (FCM) — só roda em nativo. Registra o device token do usuário logado na
// tabela `device_tokens`; o painel resolve esses tokens ao enviar um comunicado.
//
// Comportamento:
// - App em segundo plano/fechado: o Android mostra a notificação na bandeja
//   (canal de alta prioridade => heads-up no topo).
// - App em primeiro plano: o sistema NÃO mostra sozinho, então exibimos uma
//   notificação local na hora (mesmo canal => heads-up no topo).
// - Toque na notificação: abre a aba Avisos.

const CHANNEL_ID = "comunicados";
const AVISOS_HASH = "#/app/avisos";

let currentToken: string | null = null;
let listenersBound = false;

function isSupported() {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("PushNotifications");
}

function goToAvisos() {
  window.location.hash = AVISOS_HASH;
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

// Exibe um heads-up local (usado quando o push chega com o app em primeiro plano).
async function showForeground(notif: PushNotificationSchema) {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() % 2147483647),
          title: notif.title ?? "Check.AI",
          body: notif.body ?? "",
          channelId: CHANNEL_ID,
          extra: notif.data,
        },
      ],
    });
  } catch (e) {
    console.warn("[push] falha ao exibir heads-up:", e);
  }
}

async function bindListeners() {
  if (listenersBound) return;
  listenersBound = true;

  // Canal de alta prioridade (heads-up + som). O servidor envia channel_id =
  // "comunicados", e os heads-up locais usam o mesmo canal.
  if (Capacitor.getPlatform() === "android") {
    try {
      await PushNotifications.createChannel({
        id: CHANNEL_ID,
        name: "Comunicados",
        description: "Avisos e comunicados da sua rede",
        importance: 5,
        visibility: 1,
      });
    } catch (e) {
      console.warn("[push] falha ao criar canal:", e);
    }
  }

  await PushNotifications.addListener("registration", (token: Token) => {
    void saveToken(token.value);
  });
  await PushNotifications.addListener("registrationError", (err) => {
    console.warn("[push] erro de registro:", JSON.stringify(err));
  });

  // App em primeiro plano: exibe heads-up local (o sistema não mostra sozinho).
  await PushNotifications.addListener("pushNotificationReceived", (notif) => {
    void showForeground(notif);
  });
  // Toque na notificação da bandeja (push em background).
  await PushNotifications.addListener("pushNotificationActionPerformed", () => {
    goToAvisos();
  });
  // Toque no heads-up local (push em foreground).
  await LocalNotifications.addListener("localNotificationActionPerformed", () => {
    goToAvisos();
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
