import { PageTitle } from "@/components/page-title";

export function PageHeader({
  title,
  subtitle,
  action,
  crumb,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  crumb?: string;
}) {
  return (
    <>
      {/* Título e breadcrumb são exibidos no topbar */}
      <PageTitle title={title} crumb={crumb} />
      {(subtitle || action) && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
    </>
  );
}
