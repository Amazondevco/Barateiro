import { ANDROID_PACKAGE, ANDROID_SHA256 } from "@/lib/deep-links";

// Android App Links — verificação do domínio para abrir o app nativo direto.
// Servido em https://check-ai-br.vercel.app/.well-known/assetlinks.json
export const dynamic = "force-static";

export function GET() {
  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: [ANDROID_SHA256],
      },
    },
  ];
  return Response.json(body, {
    headers: { "content-type": "application/json" },
  });
}
