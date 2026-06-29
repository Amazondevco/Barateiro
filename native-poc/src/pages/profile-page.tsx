import { useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";
import { fetchProfile } from "../lib/operator-api";
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
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
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
              : "Falha ao carregar o perfil.",
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
    return <LoadingScreen label="Carregando perfil…" />;
  }

  const iniciais =
    (profile?.nome ?? "")
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

  const linhas: [string, string][] = [
    ["E-mail", profile?.email || "—"],
    ["CPF", fmtCpf(profile?.cpf)],
    ["Celular", profile?.telefone || "—"],
    ["Cidade", profile?.cidade || "—"],
  ];

  const vinculo: [string, string][] = [
    ["Rede", profile?.rede || "—"],
    ["Unidade", profile?.unidade || "—"],
    ["Cargo", profile?.cargo || "—"],
  ];

  return (
    <div className="flex flex-1 flex-col items-center p-5">
      {error ? (
        <p className="mb-4 w-full max-w-sm rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col items-center gap-3 py-4">
        {profile?.fotoUrl ? (
          <img
            src={profile.fotoUrl}
            alt=""
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
            {iniciais}
          </div>
        )}
        <p className="text-lg font-semibold">{profile?.nome ?? "Operador"}</p>
      </div>

      <div className="w-full max-w-sm divide-y divide-border rounded-xl border border-border bg-card">
        {linhas.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span className="shrink-0 text-muted-foreground">{k}</span>
            <span className="truncate text-right font-medium">{v}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 mb-2 w-full max-w-sm px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Vínculo
      </p>
      <div className="w-full max-w-sm divide-y divide-border rounded-xl border border-border bg-card">
        {vinculo.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span className="shrink-0 text-muted-foreground">{k}</span>
            <span className="truncate text-right font-medium">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
