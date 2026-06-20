import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { OrgProvider } from "./contexts/OrgContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import CampsPage from "./pages/Camps";
import CampDetailPage from "./pages/CampDetail";
import ReservationsPage from "./pages/Reservations";
import ReservationDetailPage from "./pages/ReservationDetail";
import ReservationNewPage from "./pages/ReservationNew";
import UsersPage from "./pages/Users";
import LanguagesPage from "./pages/Languages";
import SystemSettingsPage from "./pages/SystemSettings";
import OrganizationsPage from "./pages/Organizations";
import OrganizationDetailPage from "./pages/OrganizationDetail";

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Načítám…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <OrgProvider>
      <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Guard><Layout /></Guard>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="camps" element={<CampsPage />} />
          <Route path="camps/:id" element={<CampDetailPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="reservations/new" element={<ReservationNewPage />} />
          <Route path="reservations/:id" element={<ReservationDetailPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="languages" element={<LanguagesPage />} />
          <Route path="system-settings" element={<SystemSettingsPage />} />
          <Route path="organizations" element={<OrganizationsPage />} />
          <Route path="organizations/:id" element={<OrganizationDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </ToastProvider>
      </OrgProvider>
    </AuthProvider>
  );
}
