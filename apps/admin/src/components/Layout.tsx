import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useOrg } from "../contexts/OrgContext";
import { api } from "../api/client";
import { Permission } from "@procamp/shared";
import Tooltip from "./Tooltip";

const nav: { to: string; label: string; icon: string; perm?: keyof Permission; newLink?: string }[] = [
  { to: "/dashboard", label: "Dashboard", icon: "fa-chart-bar" },
  { to: "/reservations", label: "Rezervace", icon: "fa-calendar", perm: "reservations_view", newLink: "/reservations/new" },
  { to: "/camps", label: "Objekty", icon: "fa-tent", perm: "camps_view" },
  { to: "/users", label: "Uživatelé", icon: "fa-user", perm: "users_manage" },
  { to: "/languages", label: "Jazyky", icon: "fa-globe", perm: "org_admin" },
];

const superAdminNav = [
  { to: "/organizations", label: "Organizace", icon: "fa-building" },
  { to: "/logs", label: "Logy", icon: "fa-list-check" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { selectedOrgId, setSelectedOrgId, setOrgs, orgs } = useOrg();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (user?.isSuperAdmin) {
      api.get("/organizations").then((r) => {
        setOrgs(r.data);
        if (selectedOrgId && !r.data.find((o: { id: string }) => o.id === selectedOrgId)) {
          setSelectedOrgId(null);
        }
      }).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const visibleNav = [...nav, ...(user?.permissions?.org_admin && !user?.isSuperAdmin ? [{ to: "/my-organization", label: "Moje organizace", icon: "fa-building", perm: undefined as keyof Permission | undefined }] : [])]
    .filter((item) => !item.perm || user?.isSuperAdmin || !!(user?.permissions as Record<string, unknown>)?.[item.perm]);

  const sidebarContent = (
    <>
      <div className="px-4 py-4 border-b border-gray-700">
        <span className="text-lg font-bold text-blue-400">MůjKemp.cz</span>
        {user?.isSuperAdmin ? (
          <div className="mt-2">
            <select
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundPosition: "right 0.75rem center", paddingRight: "2.25rem" }}
              value={selectedOrgId ?? ""}
              onChange={(e) => { setSelectedOrgId(e.target.value || null); navigate("/dashboard"); }}
            >
              <option value="">— Všechny organizace —</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5">Administrace</p>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {(!user?.isSuperAdmin || selectedOrgId) && visibleNav.map((item) => (
          <div key={item.to} className="flex items-center gap-1">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <i className={`fa-regular ${item.icon} w-4 text-center`} />
              {item.label}
            </NavLink>
            {item.newLink && (
              <>
                {/* Mobile — bez tooltipu */}
                <Link to={item.newLink} className="shrink-0 self-stretch inline-flex items-center justify-center bg-green-600 hover:bg-green-500 text-white rounded-lg px-3 transition-colors">
                  <i className="fa-regular fa-plus text-sm" />
                </Link>
              </>
            )}
          </div>
        ))}
        {user?.isSuperAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Super admin</p>
            </div>
            {superAdminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <i className={`fa-regular ${item.icon} w-4 text-center`} />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700 space-y-2">
        <p className="text-xs text-gray-400 truncate"><i className="fa-regular fa-user mr-1.5" />{user?.name}</p>
        <Link to="/settings" className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
          <i className="fa-regular fa-gear" /> Nastavení
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left text-xs text-gray-400 hover:text-white transition-colors">
          <i className="fa-regular fa-arrow-right-from-bracket" /> Odhlásit se
        </button>
      </div>
      <div className="px-4 py-4 border-t border-gray-700 space-y-2">
        <Link to="/help" className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
          <i className="fa-regular fa-circle-question" /> Nápověda
        </Link>
        <Link to="/author" className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
          <i className="fa-regular fa-id-card" /> Autor
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-gray-900 text-white flex-col fixed top-0 left-0 h-screen z-10">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 text-white flex items-center justify-between px-4 z-20">
        <span className="text-base font-bold text-blue-400">MůjKemp.cz</span>
        <button onClick={() => setSidebarOpen((v) => !v)} className="text-gray-300 hover:text-white p-2">
          <i className={`fa-regular ${sidebarOpen ? "fa-xmark" : "fa-bars"} text-xl`} />
        </button>
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="w-64 bg-gray-900 text-white flex flex-col h-full overflow-y-auto">
            {sidebarContent}
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <main className="flex-1 overflow-auto md:ml-60 mt-14 md:mt-0">
        <Outlet />
      </main>
    </div>
  );
}
