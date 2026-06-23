import { useTitle } from "../hooks/useTitle";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { User, Permission } from "@procamp/shared";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import Tooltip from "../components/Tooltip";

type UserWithOrg = User & { organization?: { id: string; name: string } | null };

const PERM_LABELS: { key: keyof Permission; label: string; group: string }[] = [
  { key: "camps_view", label: "Zobrazit objekty", group: "Objekty" },
  { key: "camps_create", label: "Vytvářet objekty", group: "Objekty" },
  { key: "camps_edit", label: "Upravovat objekty", group: "Objekty" },
  { key: "camps_delete", label: "Mazat objekty", group: "Objekty" },
  { key: "templates_edit", label: "Upravovat e-mailové šablony", group: "Objekty" },
  { key: "reservations_view", label: "Zobrazit rezervace", group: "Rezervace" },
  { key: "reservations_create", label: "Vytvářet rezervace", group: "Rezervace" },
  { key: "reservations_edit", label: "Upravovat rezervace", group: "Rezervace" },
  { key: "reservations_delete", label: "Mazat rezervace", group: "Rezervace" },
  { key: "blockings_view", label: "Zobrazit blokace", group: "Blokace" },
  { key: "blockings_edit", label: "Vytvářet a upravovat blokace", group: "Blokace" },
  { key: "blockings_delete", label: "Mazat blokace", group: "Blokace" },
  { key: "users_manage", label: "Spravovat uživatele", group: "Správce" },
  { key: "org_admin", label: "Nastavení organizace", group: "Správce" },
];

const DEFAULT_PERMS: Permission = {
  camps_view: false, camps_create: false, camps_edit: false, camps_delete: false,
  reservations_view: false, reservations_create: false, reservations_edit: false, reservations_delete: false,
  blockings_view: false, blockings_edit: false, blockings_delete: false,
  users_manage: false, templates_edit: false, settings_edit: false, org_admin: false,
};

const PermissionGrid = ({ perms, onChange }: { perms: Permission; onChange: (k: keyof Permission, v: boolean) => void }) => {
  const groups = [...new Set(PERM_LABELS.map((p) => p.group))];
  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <div key={group}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{group}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PERM_LABELS.filter((p) => p.group === group).map((p) => (
              <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!perms[p.key]} onChange={(e) => onChange(p.key, e.target.checked)} className="rounded" />
                {p.label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function AllUsersPage() {
  useTitle("Všichni uživatelé");
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<UserWithOrg[]>([]);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<UserWithOrg | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [formError, setFormError] = useState("");
  const pwInputRef = useRef<HTMLInputElement>(null);

  const load = () => api.get("/users").then((r) => setUsers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const genPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let pw = "";
    for (let i = 0; i < 10; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
    setEditPassword(pw);
    navigator.clipboard.writeText(pw).catch(() => {});
    if (pwInputRef.current) pwInputRef.current.type = "text";
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!editUser) return;
    try {
      const payload: Record<string, unknown> = {
        name: editUser.name,
        email: editUser.email,
        permissions: editUser.permissions,
        isSuperAdmin: editUser.isSuperAdmin,
        reservationsDefaultView: editUser.reservationsDefaultView,
      };
      if (editPassword) payload.password = editPassword;
      await api.put(`/users/${editUser.id}`, payload);
      setEditUser(null);
      setEditPassword("");
      toast.success("Uživatel byl uložen.");
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (msg?.includes("email") || msg?.includes("already")) {
        setFormError("Uživatel s tímto e-mailem již existuje.");
      } else {
        toast.error("Nepodařilo se uložit uživatele.");
      }
    }
  };

  const handleDelete = async (u: UserWithOrg) => {
    if (!confirm(`Opravdu smazat uživatele „${u.name}"? Tato akce je nevratná.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success("Uživatel byl smazán.");
      load();
    } catch {
      toast.error("Nepodařilo se smazat uživatele.");
    }
  };

  const handleForceLogout = async (u: UserWithOrg) => {
    if (!confirm(`Odhlásit uživatele „${u.name}"? Uživatel bude okamžitě odhlášen ze všech zařízení.`)) return;
    try {
      await api.post(`/users/${u.id}/force-logout`, {});
      toast.success(`${u.name} byl odhlášen.`);
    } catch {
      toast.error("Nepodařilo se odhlásit uživatele.");
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.organization?.name ?? "").toLowerCase().includes(q);
  });

  if (!me?.isSuperAdmin) return <div className="p-8 text-gray-500">Pouze pro super adminy.</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Všichni uživatelé</h1>
        <span className="text-sm text-gray-400">{filtered.length} uživatelů</span>
      </div>

      <div className="mb-4">
        <input className="input max-w-sm" placeholder="Hledat podle jména, e-mailu nebo organizace…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Jméno</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Organizace</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Žádní uživatelé.</td></tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 text-gray-500">{u.organization?.name ?? <span className="italic text-gray-300">bez organizace</span>}</td>
                <td className="px-4 py-3">
                  {u.isSuperAdmin
                    ? <span className="badge bg-purple-100 text-purple-800">Super Admin</span>
                    : <span className="badge bg-gray-100 text-gray-600">Uživatel</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <Tooltip text="Upravit" position="left">
                      <button className="btn-secondary text-sm px-2.5 py-1.5" onClick={() => { setEditUser(u); setEditPassword(""); setFormError(""); }}>
                        <i className="fa-regular fa-pen" />
                      </button>
                    </Tooltip>
                    {u.id !== me?.id && (
                      <Tooltip text="Odhlásit ze všech zařízení" position="left">
                        <button className="btn-secondary text-sm px-2.5 py-1.5 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => handleForceLogout(u)}>
                          <i className="fa-regular fa-arrow-right-from-bracket" />
                        </button>
                      </Tooltip>
                    )}
                    {u.id !== me?.id && (
                      <Tooltip text="Smazat" position="left">
                        <button className="btn-danger text-sm px-2.5 py-1.5" onClick={() => handleDelete(u)}>
                          <i className="fa-regular fa-trash" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 pt-6" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h3 className="font-semibold">Upravit: {editUser.name}</h3>
              <button type="button" onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-700"><i className="fa-regular fa-xmark text-lg" /></button>
            </div>
            <div className="px-6 py-5">
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Jméno</label>
                    <input className="input" value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">E-mail</label>
                    <input className="input" type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="label">Nové heslo (ponechte prázdné pro zachování)</label>
                  <div className="flex gap-2">
                    <input className="input" ref={pwInputRef} type="password"
                      onFocus={(e) => e.currentTarget.type = "text"}
                      onBlur={(e) => e.currentTarget.type = "password"}
                      value={editPassword} onChange={(e) => setEditPassword(e.target.value)} minLength={8} />
                    <Tooltip text="Vygenerovat heslo" position="left">
                      <button type="button" onClick={genPassword} className="btn-secondary px-3 flex-shrink-0">
                        <i className="fa-regular fa-wand-magic-sparkles" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <hr />
                <p className="text-sm font-medium text-gray-700">Oprávnění</p>
                <PermissionGrid
                  perms={editUser.permissions ?? { ...DEFAULT_PERMS }}
                  onChange={(k, v) => setEditUser({ ...editUser, permissions: { ...editUser.permissions, [k]: v } })}
                />
                {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>}
                <div className="flex justify-between w-full pt-2">
                  <button className="btn-primary px-8" type="submit"><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit</button>
                  <button className="btn-secondary" type="button" onClick={() => setEditUser(null)}><i className="fa-regular fa-xmark mr-1.5" />Zrušit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
