import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: "fa-chart-bar" },
  { to: "/camps", label: "Objekty", icon: "fa-tent" },
  { to: "/reservations", label: "Rezervace", icon: "fa-calendar" },
  { to: "/users", label: "Uživatelé", icon: "fa-user" },
  { to: "/languages", label: "Jazyky", icon: "fa-globe" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-white flex flex-col">
        <div className="px-6 py-5 border-b border-gray-700">
          <span className="text-xl font-bold text-blue-400">ProCamp</span>
          <p className="text-xs text-gray-400 mt-0.5">Administrace</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {nav.map((item) => (
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
        </nav>
        <div className="px-4 py-4 border-t border-gray-700 space-y-2">
          <p className="text-xs text-gray-400 truncate"><i className="fa-regular fa-user mr-1.5" />{user?.name}</p>
          {user?.isSuperAdmin && (
            <Link to="/system-settings" className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
              <i className="fa-regular fa-gear" /> Nastavení systému
            </Link>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left text-xs text-gray-400 hover:text-white transition-colors">
            <i className="fa-regular fa-arrow-right-from-bracket" /> Odhlásit se
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
