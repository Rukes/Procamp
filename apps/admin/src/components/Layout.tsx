import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useOrg } from "../contexts/OrgContext";
import { api } from "../api/client";
import { Permission } from "@procamp/shared";
import Tooltip from "./Tooltip";
import { marked } from "marked";
import GlobalSearch from "./GlobalSearch";
import { MotdBannerMenu, MotdBannerGlobal } from "./MotdBanner";

function MotdBannerGlobalWrapper() {
  const location = useLocation();
  if (location.pathname === "/dashboard") return null;
  return (
    <div className="px-4 md:px-8 pt-4">
      <MotdBannerGlobal />
    </div>
  );
}

const nav: { to: string; label: string; icon: string; perm?: keyof Permission; newLink?: string }[] = [
  { to: "/dashboard", label: "Dashboard", icon: "fa-chart-bar" },
  { to: "/reservations", label: "Rezervace", icon: "fa-calendar", perm: "reservations_view", newLink: "/reservations/new" },
  { to: "/blockings", label: "Blokace", icon: "fa-calendar-xmark", perm: "blockings_view" },
  { to: "/camps", label: "Objekty", icon: "fa-tent", perm: "camps_view" },
  { to: "/users", label: "Uživatelé", icon: "fa-user", perm: "users_manage" },
  { to: "/languages", label: "Jazyky", icon: "fa-globe", perm: "org_admin" },
];

const superAdminNav = [
  { to: "/organizations", label: "Organizace", icon: "fa-building" },
  { to: "/all-users", label: "Uživatelé", icon: "fa-users" },
  { to: "/motd", label: "MOTD", icon: "fa-bullhorn" },
  { to: "/logs", label: "Logy", icon: "fa-list-check" },
  { to: "/system", label: "Systém", icon: "fa-gears" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { selectedOrgId, setSelectedOrgId, setOrgs, orgs } = useOrg();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [changelogHtml, setChangelogHtml] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
        <img
          src={`${import.meta.env.VITE_API_URL ?? ""}/logos/logo-navbar.png`}
          alt="Logo"
          className="h-[52px] w-auto md:h-[58px]"
        />
      </div>

      <MotdBannerMenu />

      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 text-sm transition-colors"
        >
          <i className="fa-regular fa-magnifying-glass w-4 text-center" />
          <span className="flex-1 text-left">Hledat…</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-xs text-gray-600 border border-gray-600 rounded px-1">{/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl+K"}</kbd>
        </button>
      </div>

      <nav className="flex-1 py-2 px-3 space-y-1 overflow-y-auto">
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
            <div className="px-1 pb-1">
              <select
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundPosition: "right 0.75rem center", paddingRight: "2.25rem" }}
                value={selectedOrgId ?? ""}
                onChange={(e) => { const val = e.target.value || null; setSelectedOrgId(val); navigate(val ? "/dashboard" : "/organizations"); }}
              >
                <option value="">— Všechny organizace —</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
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
        <div className="flex items-center gap-3">
          <Link to="/author" className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
            <i className="fa-regular fa-id-card" /> Autor
          </Link>
          <button onClick={() => { if (!changelogHtml) fetch("/changelog.md").then(r => r.text()).then(t => setChangelogHtml(marked(t) as string)); setChangelogOpen(true); }} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
            <i className="fa-regular fa-clock-rotate-left" /> Changelog
          </button>
        </div>
      </div>

      {changelogOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-8 px-4" onClick={() => setChangelogOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Changelog</h2>
              <button onClick={() => setChangelogOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div
              className="overflow-y-auto px-6 py-5 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: changelogHtml }}
            />
          </div>
        </div>
      )}
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
        <img src={`${import.meta.env.VITE_API_URL ?? ""}/logos/logo-navbar.png`} alt="Logo" className="w-auto" style={{ height: "2.5rem" }} />
        <div className="flex items-center gap-1">
          <button onClick={() => setSearchOpen(true)} className="text-gray-300 hover:text-white p-2">
            <i className="fa-regular fa-magnifying-glass text-lg" />
          </button>
          <button onClick={() => setSidebarOpen((v) => !v)} className="text-gray-300 hover:text-white p-2">
            <i className={`fa-regular ${sidebarOpen ? "fa-xmark" : "fa-bars"} text-xl`} />
          </button>
        </div>
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
        <MotdBannerGlobalWrapper />
        <Outlet />
      </main>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
