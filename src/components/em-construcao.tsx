import { Construction } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export function EmConstrucao({
  title,
  subtitle,
  fase,
}: {
  title: string;
  subtitle?: string;
  fase?: string;
}) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Construction className="h-7 w-7" />
          </span>
          <p className="text-base font-semibold">Em construção</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Esta área será entregue {fase ? `na ${fase}` : "em breve"}.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
