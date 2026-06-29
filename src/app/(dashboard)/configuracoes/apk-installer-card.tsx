import Link from "next/link";
import {
  AlertCircle,
  Download,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ApkInstallerCardProps = {
  apkUrl: string | null;
  apkVersion: string | null;
};

const primaryLinkClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

const outlineLinkClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input bg-card px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

export function ApkInstallerCard({
  apkUrl,
  apkVersion,
}: ApkInstallerCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Instalador Android (APK)</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Distribuição do app nativo de testes para Android a partir da aba
              de aplicativo do Super Admin.
            </p>
          </div>

          <Badge tone={apkUrl ? "success" : "warning"}>
            {apkUrl ? "URL pronta" : "Aguardando URL"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              {apkUrl ? (
                <Smartphone className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium">
                {apkUrl
                  ? "APK Android disponível para instalação"
                  : "Workflow pronto para gerar o APK Android"}
              </p>
              <p className="text-sm text-muted-foreground">
                {apkUrl
                  ? "O botão abaixo usa /api/android-apk e pode continuar igual mesmo se a origem do binário mudar."
                  : "Se a URL ainda não estiver configurada, rode o workflow do GitHub Actions e publique o binário gerado."}
              </p>
              {apkVersion ? (
                <p className="text-xs text-muted-foreground">
                  Versão exibida: <span className="font-medium">{apkVersion}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-sm font-medium">Como testar agora</p>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Rode o workflow <strong>Build APK Android (POC)</strong> no GitHub Actions.</li>
            <li>2. Baixe o artefato <strong>check-ai-apk</strong> ou publique a URL em <code>ANDROID_APK_URL</code>.</li>
            <li>3. Instale o APK em um celular Android com fontes desconhecidas liberadas.</li>
          </ol>
        </div>

        <div className="rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning">
          iPhone (iOS) não instala APK. Para iPhone, o caminho é TestFlight ou
          App Store com conta Apple Developer.
        </div>

        {apkUrl ? (
          <>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                URL atual do APK
              </p>
              <code className="block break-all text-sm text-primary">
                {apkUrl}
              </code>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/api/android-apk" className={primaryLinkClass}>
                <Download className="h-4 w-4" />
                Baixar APK
              </Link>
              <Link
                href={apkUrl}
                target="_blank"
                rel="noreferrer"
                className={outlineLinkClass}
              >
                <ExternalLink className="h-4 w-4" />
                Abrir origem
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Link
              href="https://github.com/Amazondevco/Barateiro/actions/workflows/android-apk.yml"
              target="_blank"
              rel="noreferrer"
              className={outlineLinkClass}
            >
              <ExternalLink className="h-4 w-4" />
              Abrir workflow
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
