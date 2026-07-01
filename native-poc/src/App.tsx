import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/auth-context";
import { AppShell } from "./ui/app-shell";
import { LoginPage } from "./pages/login-page";
import { DefinirSenhaPage } from "./pages/definir-senha-page";
import { MembershipsPage } from "./pages/memberships-page";
import { NetworkHomePage } from "./pages/network-home-page";
import { NoticesPage } from "./pages/notices-page";
import { FormsPage } from "./pages/forms-page";
import { FillFormPage } from "./pages/fill-form-page";
import { RevisaoPage } from "./pages/revisao-page";
import { ProfilePage } from "./pages/profile-page";
import { ReportsPage } from "./pages/reports-page";
import { ConfigPage } from "./pages/config-page";
import { LoadingScreen } from "./ui/loading-screen";
import { DeepLinkHandler } from "./ui/deep-link-handler";
import { BiometricGate } from "./ui/biometric-gate";

export default function App() {
  return (
    <AuthProvider>
      <DeepLinkHandler />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/definir-senha" element={<DefinirSenhaPage />} />
        <Route
          path="/app/*"
          element={
            <RequireAuth>
              <BiometricGate>
                <AppShell />
              </BiometricGate>
            </RequireAuth>
          }
        >
          <Route index element={<MembershipsPage />} />
          <Route path="rede/:memberId" element={<NetworkHomePage />} />
          <Route path="rede/:memberId/form/:formId" element={<FillFormPage />} />
          <Route path="revisao/:origem/:id" element={<RevisaoPage />} />
          <Route path="avisos" element={<NoticesPage />} />
          <Route path="formularios" element={<FormsPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="config" element={<ConfigPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </AuthProvider>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen label="Restaurando sessão do operador…" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
