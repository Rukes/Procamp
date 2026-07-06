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
import MyOrganizationPage from "./pages/MyOrganization";
import UserSettingsPage from "./pages/UserSettings";
import BlockingsPage from "./pages/Blockings";
import SystemPage from "./pages/System";
import LogsPage from "./pages/Logs";
import AllUsersPage from "./pages/AllUsers";
import HelpPage from "./pages/Help";
import AuthorPage from "./pages/Author";
import MotdPage from "./pages/Motd";
import CalendarPage from "./pages/Calendar";

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
          <Route path="my-organization" element={<MyOrganizationPage />} />
          <Route path="settings" element={<UserSettingsPage />} />
          <Route path="blockings" element={<BlockingsPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="all-users" element={<AllUsersPage />} />
          <Route path="system" element={<SystemPage />} />
          <Route path="author" element={<AuthorPage />} />
          <Route path="motd" element={<MotdPage />} />
          <Route path="calendar" element={<CalendarPage />} />
        </Route>
        <Route path="help" element={<Guard><HelpPage /></Guard>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </ToastProvider>
      </OrgProvider>
    </AuthProvider>
  );
}
