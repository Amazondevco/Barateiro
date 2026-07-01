// Config dos deep links (Android App Links / iOS Universal Links) do app nativo.
// Domínio: check-ai-br.vercel.app. Caminho tratado pelo app: /auth/redefinir*
// (concluir cadastro / definir senha).

export const ANDROID_PACKAGE = "ai.check.poc";

// SHA-256 do certificado da chave de assinatura FIXA do APK. É público (vai no
// assetlinks.json). Preenchido a partir da keystore estável usada no CI.
// Formato: "AA:BB:CC:...". Vazio = App Links ainda não verifica (fallback web).
export const ANDROID_SHA256 =
  "62:73:79:85:22:DE:76:6D:D4:23:4C:FC:01:9F:48:39:E2:4F:C8:C1:41:E1:B6:A4:AF:93:20:91:6A:91:18:4C";

// iOS: Team ID da conta Apple Developer + bundle id do app.
// appID = "<TEAM_ID>.<BUNDLE_ID>". Preencher o Team ID (10 caracteres).
export const IOS_TEAM_ID = "PENDENTE_TEAMID";
export const IOS_BUNDLE_ID = "ai.check.poc";
