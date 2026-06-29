// Teste do caminho servidor → FCM (HTTP v1), sem app.
//
// Uso:
//   FCM_SERVICE_ACCOUNT="$(cat service-account.json)" node scripts/fcm-test.mjs [TOKEN_DO_DEVICE]
//
// Sem TOKEN: só faz o OAuth (prova que a service account autentica no FCM).
// Com TOKEN: envia uma notificação de teste para aquele device.
//   - token real  → 200 e a notificação aparece no aparelho.
//   - token falso → o OAuth passa (200) e o FCM responde erro estruturado
//                   (UNREGISTERED/INVALID_ARGUMENT) — prova auth + endpoint + projeto.
import { createSign } from "node:crypto";

const raw = process.env.FCM_SERVICE_ACCOUNT;
if (!raw) {
  console.error("Defina FCM_SERVICE_ACCOUNT (JSON da service account).");
  process.exit(1);
}
const sa = JSON.parse(raw);
sa.private_key = sa.private_key.replace(/\\n/g, "\n");
const targetToken = process.argv[2];

const b64url = (input) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const now = Math.floor(Date.now() / 1000);
const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
const claim = b64url(
  JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }),
);
const signature = createSign("RSA-SHA256").update(`${header}.${claim}`).sign(sa.private_key);
const jwt = `${header}.${claim}.${b64url(signature)}`;

const oauthRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  }),
});
if (!oauthRes.ok) {
  console.error(`❌ OAuth FALHOU: ${oauthRes.status}`);
  console.error(await oauthRes.text());
  process.exit(1);
}
const { access_token } = await oauthRes.json();
console.log(`✅ OAuth OK — service account autentica no FCM (projeto ${sa.project_id}).`);

if (!targetToken) {
  console.log("ℹ️  Sem token de device — passe um token como argumento para enviar de verdade.");
  process.exit(0);
}

const sendRes = await fetch(
  `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token: targetToken,
        notification: { title: "Teste Check.AI", body: "Push funcionando 🎉" },
        data: { tipo: "comunicado" },
        android: { priority: "HIGH", notification: { channel_id: "comunicados" } },
      },
    }),
  },
);
const body = await sendRes.text();
if (sendRes.ok) {
  console.log("✅ FCM aceitou — notificação enviada. Confira o aparelho.");
  console.log(body);
} else {
  console.log(`⚠️  FCM respondeu ${sendRes.status} (auth OK; problema no token/payload):`);
  console.log(body);
}
