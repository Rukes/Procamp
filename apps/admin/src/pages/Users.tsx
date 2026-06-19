import { useEffect, useState } from "react";
import { api } from "../api/client";
import { User, Permission } from "@procamp/shared";
import { useAuth } from "../contexts/AuthContext";

const PERM_LABELS: { key: keyof Permission; label: string; group: string }[] = [
  { key: "camps_view", label: "Zobrazit kempy", group: "Kempy" },
  { key: "camps_create", label: "Vytvářet kempy", group: "Kempy" },
  { key: "camps_edit", label: "Upravovat kempy", group: "Kempy" },
  { key: "camps_delete", label: "Mazat kempy", group: "Kempy" },
  { key: "reservations_view", label: "Zobrazit rezervace", group: "Rezervace" },
  { key: "reservations_create", label: "Vytvářet rezervace", group: "Rezervace" },
  { key: "reservations_edit", label: "Upravovat rezervace", group: "Rezervace" },
  { key: "reservations_delete", label: "Mazat rezervace", group: "Rezervace" },
  { key: "users_manage", label: "Spravovat uživatele", group: "Systém" },
  { key: "templates_edit", label: "Upravovat šablony", group: "Systém" },
  { key: "settings_edit", label: "Systémové nastavení", group: "Systém" },
];

const DEFAULT_PERMS: Permission = {
  camps_view: false, camps_create: false, camps_edit: false, camps_delete: false,
  reservations_view: false, reservations_create: false, reservations_edit: false, reservations_delete: false,
  users_manage: false, templates_edit: false, settings_edit: false,
};

export default function UsersPage() {
  const { can, user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", permissions: { ...DEFAULT_PERMS } });

  const load = () => api.get("/users").then((r) => setUsers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/users", form);
    setCreating(false);
    setForm({ name: "", email: "", password: "", permissions: { ...DEFAULT_PERMS } });
    load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    await api.put(`/users/${editUser.id}`, { name: editUser.name, permissions: editUser.permissions });
    setEditUser(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu smazat uživatele?")) return;
    await api.delete(`/users/${id}`);
    load();
  };

  const groups = [...new Set(PERM_LABELS.map((p) => p.group))];

  const PermissionGrid = ({ perms, onChange }: { perms: Permission; onChange: (k: keyof Permission, v: boolean) => void }) => (
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

  if (!can("users_manage")) return <div className="p-8 text-gray-500">Nemáte oprávnění ke správě uživatelů.</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Uživatelé</h1>
        <button className="btn-primary" onClick={() => setCreating(true)}>+ Nový uživatel</button>
      </div>

      {(creating || editUser) && (
        <div className="card p-6 mb-6 max-w-2xl">
          <h2 className="font-semibold mb-4">{creating ? "Nový uživatel" : `Upravit: ${editUser!.name}`}</h2>
          <form onSubmit={creating ? handleCreate : handleUpdate} className="space-y-4">
            {creating && (
              <>
                <div><label className="label">Jméno</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                <div><label className="label">Heslo</label><input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></div>
                <hr />
                <p className="text-sm font-medium text-gray-700">Oprávnění</p>
                <PermissionGrid perms={form.permissions} onChange={(k, v) => setForm({ ...form, permissions: { ...form.permissions, [k]: v } })} />
              </>
            )}
            {editUser && !creating && (
              <>
                <div><label className="label">Jméno</label><input className="input" value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} required /></div>
                {!editUser.isSuperAdmin && (
                  <>
                    <hr />
                    <p className="text-sm font-medium text-gray-700">Oprávnění</p>
                    <PermissionGrid perms={editUser.permissions} onChange={(k, v) => setEditUser({ ...editUser, permissions: { ...editUser.permissions, [k]: v } })} />
                  </>
                )}
              </>
            )}
            <div className="flex gap-2">
              <button className="btn-primary" type="submit">Uložit</button>
              <button className="btn-secondary" type="button" onClick={() => { setCreating(false); setEditUser(null); }}>Zrušit</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3 max-w-2xl">
        {users.map((u) => (
          <div key={u.id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{u.name}</p>
              <p className="text-sm text-gray-500">{u.email} {u.isSuperAdmin && <span className="badge bg-purple-100 text-purple-800 ml-1">Super Admin</span>}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm" onClick={() => setEditUser(u)}>Upravit</button>
              {u.id !== me?.id && (
                <button className="btn-danger text-sm" onClick={() => handleDelete(u.id)}>Smazat</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
