import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const nav = [
  { to: "/dashboard", label: "Přehled", icon: "📊" },
  { to: "/camps", label: "Kempy", icon: "🏕️" },
  { to: "/reservations", label: "Rezervace", icon: "📅" },
  { to: "/users", label: "Uživatelé", icon: "👤" },
  { to: "/languages", label: "Jazyky", icon: "🌐" },
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
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 truncate mb-2">{user?.name}</p>
          <button onClick={handleLogout} className="w-full text-left text-xs text-gray-400 hover:text-white transition-colors">
            Odhlásit se →
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
