import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Link público ESTÁVEL (não muda entre versões). O CID do APK no GitHub é
// versionado (check-ai-vX.Y.Z.apk) e quebra o link; por isso servimos do bucket.
const APK_URL =
  "https://vwmtimbztdvwwbtihhoa.supabase.co/storage/v1/object/public/native-bundles/check-ai.apk";

type ApkInstallerCardProps = {
  apkUrl: string | null;
  apkVersion: string | null;
};

export function ApkInstallerCard({ apkUrl }: ApkInstallerCardProps) {
  const url = apkUrl ?? APK_URL;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Baixar aplicativo (Android)</CardTitle>
      </CardHeader>
      <CardContent>
        <a
          href={url}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          <Download className="h-4 w-4" />
          Baixar app
        </a>
      </CardContent>
    </Card>
  );
}
