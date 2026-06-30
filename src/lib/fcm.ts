import "server-only";
import { createSign } from "node:crypto";

// Envio de push via FCM HTTP v1. A credencial (service account JSON) vem da env
// FCM_SERVICE_ACCOUNT — nunca do git. Se não estiver definida, o envio é um
// no-op silencioso (o comunicado continua chegando pela inbox/Avisos do app).

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.FCM_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    if (!sa.project_id || !sa.client_email || !sa.private_key) return null;
    // Vercel guarda \n escapado; normaliza a chave PEM.
    sa.private_key = sa.private_key.replace(/\\n/g, "\n");
    return sa;
  } catch {
    return null;
  }
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

let cachedToken: { value: string; exp: number } | null = null;

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.value;

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signature = createSign("RSA-SHA256")
    .update(`${header}.${claim}`)
    .sign(sa.private_key);
  const jwt = `${header}.${claim}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`OAuth FCM falhou: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, exp: now + json.expires_in };
  return json.access_token;
}

// Dispara uma notificação para uma lista de device tokens.
// Retorna quantos foram aceitos e os tokens inválidos (a remover do banco).
export async function sendPush(
  tokens: string[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
    color?: string;
  },
): Promise<{ sent: number; invalid: string[] }> {
  if (tokens.length === 0) return { sent: 0, invalid: [] };
  const sa = loadServiceAccount();
  if (!sa) {
    console.warn(
      `[fcm] FCM_SERVICE_ACCOUNT ausente/inválido — ${tokens.length} push NÃO enviados. ` +
        "Configure a service account do Firebase em produção (Vercel).",
    );
    return { sent: 0, invalid: [] };
  }

  const accessToken = await getAccessToken(sa);
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

  let sent = 0;
  const invalid: string[] = [];

  // FCM v1 envia uma mensagem por token. Paraleliza em lotes pequenos.
  const BATCH = 20;
  for (let i = 0; i < tokens.length; i += BATCH) {
    const slice = tokens.slice(i, i + BATCH);
    await Promise.all(
      slice.map(async (token) => {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title: notification.title, body: notification.body },
              data: notification.data,
              android: {
                priority: "HIGH",
                notification: {
                  channel_id: "comunicados",
                  icon: "ic_stat_notify",
                  ...(notification.color ? { color: notification.color } : {}),
                  ...(notification.imageUrl ? { image: notification.imageUrl } : {}),
                },
              },
            },
          }),
        });
        if (res.ok) {
          sent++;
        } else if (res.status === 404 || res.status === 400) {
          // UNREGISTERED / token inválido → marca pra limpeza.
          invalid.push(token);
        } else {
          // 401/403/5xx → credencial errada, projeto errado, etc. Loga pra diagnose.
          const txt = await res.text().catch(() => "");
          console.error(`[fcm] envio falhou (${res.status}): ${txt.slice(0, 200)}`);
        }
      }),
    );
  }

  return { sent, invalid };
}
