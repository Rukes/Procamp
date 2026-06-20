import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useOrg } from "../contexts/OrgContext";
import { api } from "../api/client";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: "fa-chart-bar" },
  { to: "/camps", label: "Objekty", icon: "fa-tent" },
  { to: "/reservations", label: "Rezervace", icon: "fa-calendar" },
  { to: "/users", label: "Uživatelé", icon: "fa-user" },
  { to: "/languages", label: "Jazyky", icon: "fa-globe" },
];

const superAdminNav = [
  { to: "/organizations", label: "Organizace", icon: "fa-building" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { selectedOrgId, selectedOrg, orgs, setSelectedOrgId, setOrgs } = useOrg();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.isSuperAdmin) {
      api.get("/organizations").then((r) => setOrgs(r.data)).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-gray-900 text-white flex flex-col fixed top-0 left-0 h-screen z-10">
        <div className="px-4 py-4 border-b border-gray-700">
          <span className="text-lg font-bold text-blue-400">ProCamp</span>
          {user?.isSuperAdmin ? (
            <div className="mt-2">
              <select
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundPosition: "right 0.75rem center", paddingRight: "2.25rem" }}
                value={selectedOrgId ?? ""}
                onChange={(e) => setSelectedOrgId(e.target.value || null)}
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
          {(!user?.isSuperAdmin || selectedOrgId) && [...nav, ...(user?.permissions?.org_admin && !user?.isSuperAdmin ? [{ to: "/my-organization", label: "Moje organizace", icon: "fa-building" }] : [])].map((item) => (
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
      </aside>

      <main className="flex-1 overflow-auto ml-60">
        <Outlet />
      </main>
    </div>
  );
}
