import { redirect } from "next/navigation";
import {
  Palette,
  LayoutTemplate,
  ToggleRight,
  Bell,
  Rocket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSessionProfile } from "@/lib/auth";

export const metadata = { title: "Aplicativos — Barateiro" };

const AREAS: {
  icon: LucideIcon;
  titulo: string;
  desc: string;
  pronto?: boolean;
}[] = [
  {
    icon: Palette,
    titulo: "Identidade do app",
    desc: "Nome, logo e cores que o gerente vê no aplicativo.",
    pronto: true,
  },
  {
    icon: LayoutTemplate,
    titulo: "Tela inicial",
    desc: "Defina o que aparece na home: checklists do dia, atalhos e avisos.",
  },
  {
    icon: ToggleRight,
    titulo: "Funcionalidades",
    desc: "Ative ou desative recursos como foto obrigatória, geolocalização e assinatura.",
  },
  {
    icon: Bell,
    titulo: "Notificações",
    desc: "Lembretes de envio do checklist e alertas de pendências.",
  },
  {
    icon: Rocket,
    titulo: "Publicação",
    desc: "Gere o link/instalação do app para os gerentes da rede.",
  },
];

export default async function AplicativosPage() {
  const profile = await getSessionProfile();
  // Página da rede: apenas o admin do supermercado decide como é o app.
  if (profile?.papel !== "admin_supermercado") redirect("/");

  return (
    <div className="space-y-4">
      <PageHeader title="Aplicativos" crumb="Aplicativos" />

      <p className="max-w-2xl text-sm text-muted-foreground">
        Configure como o aplicativo dos gerentes da sua rede vai funcionar — da
        aparência às funcionalidades e à publicação.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((a) => {
          const Icon = a.icon;
          return (
            <Card key={a.titulo} className="h-full">
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <Badge tone={a.pronto ? "success" : "neutral"}>
                    {a.pronto ? "Disponível" : "Em breve"}
                  </Badge>
                </div>
                <div>
                  <p className="font-semibold">{a.titulo}</p>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
