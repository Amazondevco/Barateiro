import { PageTitle } from "@/components/page-title";

export function PageHeader({
  title,
  subtitle: _subtitle,
  action,
  crumb,
}: {
  title: string;
  subtitle?: string; // aceito por compatibilidade, mas não exibido
  action?: React.ReactNode;
  crumb?: string;
}) {
  return (
    <>
      {/* Título e breadcrumb são exibidos no topbar */}
      <PageTitle title={title} crumb={crumb} />
      {action && <div className="mb-6 flex justify-end">{action}</div>}
    </>
  );
}
