import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Store,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
import { useI18n } from "../lib/i18n/i18n";
import { fetchProfile, peekProfile } from "../lib/operator-api";
import type { ProfileData } from "../lib/operator-types";
import { LoadingScreen } from "../ui/loading-screen";

function fmtCpf(cpf: string | null | undefined) {
  const d = (cpf ?? "").replace(/\D/g, "");
  return d.length === 11
    ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    : "—";
}

export function ProfilePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const initial = user?.id ? peekProfile(user.id) : null;
  const [loading, setLoading] = useState(initial === null);
  const [profile, setProfile] = useState<ProfileData | null>(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;
    async function load() {
      try {
        // Cache-first: instantâneo se já houver cache; revalida em 2º plano.
        const data = await fetchProfile(user.id, (fresh) => {
          if (mounted) setProfile(fresh);
        });
        if (mounted) setProfile(data);
      } catch (loadError) {
        if (mounted)
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("Falha ao carregar o perfil."),
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (loading) {
    return <LoadingScreen label={t("Carregando perfil…")} />;
  }

  const iniciais =
    (profile?.nome ?? "")
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

  const linhas: [LucideIcon, string, string][] = [
    [Mail, t("E-mail"), profile?.email || "—"],
    [CreditCard, t("CPF"), fmtCpf(profile?.cpf)],
    [Phone, t("Celular"), profile?.telefone || "—"],
    [MapPin, t("Cidade"), profile?.cidade || "—"],
  ];

  const vinculo: [LucideIcon, string, string][] = [
    [Building2, t("Rede"), profile?.rede || "—"],
    [Store, t("Unidade"), profile?.unidade || "—"],
    [Briefcase, t("Cargo"), profile?.cargo || "—"],
  ];

  return (
    <div className="mx-auto w-full max-w-sm p-5">
      {error ? (
        <p className="mb-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="mb-8 mt-4 flex flex-col items-center gap-3">
        {profile?.fotoUrl ? (
          <img
            src={profile.fotoUrl}
            alt=""
            className="h-24 w-24 rounded-full border-4 border-card object-cover shadow-md"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary/10 text-2xl font-semibold text-primary shadow-md">
            {iniciais}
          </div>
        )}
        <div className="text-center">
          <p className="text-xl font-bold tracking-tight">
            {profile?.nome ?? t("Operador")}
          </p>
          {profile?.email && (
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              {profile.email}
            </p>
          )}
        </div>
      </div>

      <Section title={t("Dados Pessoais")} rows={linhas} />
      <Section title={t("Vínculo")} rows={vinculo} className="mt-6" />
    </div>
  );
}

function Section({
  title,
  rows,
  className = "",
}: {
  title: string;
  rows: [LucideIcon, string, string][];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {rows.map(([Icon, k, v]) => (
          <div key={k} className="flex items-center gap-3 px-4 py-3.5 text-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1 font-medium text-muted-foreground">{k}</span>
            <span className="truncate text-right font-semibold">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
