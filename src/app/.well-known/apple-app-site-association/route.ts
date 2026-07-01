import { IOS_TEAM_ID, IOS_BUNDLE_ID } from "@/lib/deep-links";

// iOS Universal Links — associa o domínio ao app. Servido (sem extensão, como
// application/json) em https://check-ai-br.vercel.app/.well-known/apple-app-site-association
export const dynamic = "force-static";

export function GET() {
  const body = {
    applinks: {
      details: [
        {
          appIDs: [`${IOS_TEAM_ID}.${IOS_BUNDLE_ID}`],
          components: [
            {
              "/": "/auth/redefinir*",
              comment: "Concluir cadastro / definir senha no app",
            },
          ],
        },
      ],
    },
  };
  return Response.json(body, {
    headers: { "content-type": "application/json" },
  });
}
