import { useEffect, useState } from "react";
import { Building2, Mail, MapPin, Phone, User } from "lucide-react";
import { useAuth } from "../context/auth-context";
import { fetchProfile } from "../lib/operator-api";
import type { ProfileData } from "../lib/operator-types";
import { LoadingScreen } from "../ui/loading-screen";

export function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      try {
        setProfile(await fetchProfile(user.id));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Falha ao carregar o perfil.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [user?.id]);

  if (loading) {
    return <LoadingScreen label="Carregando perfil…" />;
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Perfil</p>
        <h1>{profile?.nome ?? "Operador"}</h1>
        <p className="hero-copy">Consulta de identidade e vínculo feita 100% no cliente.</p>
      </header>

      {error ? <p className="banner danger inline-banner">{error}</p> : null}

      <section className="card stack-sm">
        <ProfileRow icon={<Mail size={16} />} label="E-mail" value={profile?.email} />
        <ProfileRow icon={<Phone size={16} />} label="Telefone" value={profile?.telefone} />
        <ProfileRow icon={<MapPin size={16} />} label="Cidade" value={profile?.cidade} />
        <ProfileRow icon={<Building2 size={16} />} label="Rede" value={profile?.rede} />
        <ProfileRow icon={<User size={16} />} label="Cargo" value={profile?.cargo} />
        <ProfileRow icon={<Building2 size={16} />} label="Unidade" value={profile?.unidade} />
      </section>
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="profile-row">
      <span className="profile-icon">{icon}</span>
      <div>
        <p className="summary-label">{label}</p>
        <strong>{value || "Não informado"}</strong>
      </div>
    </div>
  );
}
