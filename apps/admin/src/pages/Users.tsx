import { useEffect, useState } from "react";
import { api } from "../api/client";
import { User, Permission } from "@procamp/shared";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import Pagination from "../components/Pagination";

const PERM_LABELS: { key: keyof Permission; label: string; group: string }[] = [
  { key: "camps_view", label: "Zobrazit objekty", group: "Objekty" },
  { key: "camps_create", label: "Vytvářet objekty", group: "Objekty" },
  { key: "camps_edit", label: "Upravovat objekty", group: "Objekty" },
  { key: "camps_delete", label: "Mazat objekty", group: "Objekty" },
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

export default function UsersPage() {
  const { can, user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", reservationsDefaultView: "list", permissions: { ...DEFAULT_PERMS } });
  const [formError, setFormError] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const load = () => api.get("/users").then((r) => setUsers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      await api.post("/users", form);
      setCreating(false);
      setForm({ name: "", email: "", password: "", reservationsDefaultView: "list", permissions: { ...DEFAULT_PERMS } });
      toast.success("Uživatel byl vytvořen.");
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (msg?.includes("email") || msg?.includes("unikátní") || msg?.includes("already")) {
        setFormError("Uživatel s tímto e-mailem již existuje.");
      } else {
        toast.error("Nepodařilo se vytvořit uživatele.");
      }
    }
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
      if (msg?.includes("email") || msg?.includes("unikátní") || msg?.includes("already")) {
        setFormError("Uživatel s tímto e-mailem již existuje.");
      } else {
        toast.error("Nepodařilo se uložit uživatele.");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu smazat uživatele?")) return;
    await api.delete(`/users/${id}`);
    toast.success("Uživatel byl smazán.");
    load();
  };

  const startEdit = (u: User) => { setEditUser(u); setEditPassword(""); };

  if (!can("users_manage")) return <div className="p-8 text-gray-500">Nemáte oprávnění ke správě uživatelů.</div>;

  const closeModal = () => { setCreating(false); setEditUser(null); setFormError(""); };

  const UserForm = ({ isCreate }: { isCreate: boolean }) => (
    <form onSubmit={isCreate ? handleCreate : handleUpdate} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Jméno</label>
          <input className="input" value={isCreate ? form.name : editUser!.name}
            onChange={(e) => isCreate ? setForm({ ...form, name: e.target.value }) : setEditUser({ ...editUser!, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input className="input" type="email" value={isCreate ? form.email : editUser!.email}
            onChange={(e) => isCreate ? setForm({ ...form, email: e.target.value }) : setEditUser({ ...editUser!, email: e.target.value })} required />
        </div>
      </div>
      <div>
        <label className="label">{isCreate ? "Heslo" : "Nové heslo (ponechte prázdné pro zachování)"}</label>
        <input className="input" type="password"
          value={isCreate ? form.password : editPassword}
          onChange={(e) => isCreate ? setForm({ ...form, password: e.target.value }) : setEditPassword(e.target.value)}
          required={isCreate} minLength={8} />
      </div>
      <div>
        <label className="label">Výchozí zobrazení rezervací</label>
        <select className="input"
          value={isCreate ? form.reservationsDefaultView : editUser!.reservationsDefaultView}
          onChange={(e) => isCreate ? setForm({ ...form, reservationsDefaultView: e.target.value }) : setEditUser({ ...editUser!, reservationsDefaultView: e.target.value as "list" | "calendar" })}>
          <option value="list">Seznam</option>
          <option value="calendar">Kalendář</option>
        </select>
      </div>
      <hr />
      <p className="text-sm font-medium text-gray-700">Oprávnění</p>
      <PermissionGrid
        perms={isCreate ? form.permissions : editUser!.permissions}
        onChange={(k, v) => isCreate
          ? setForm({ ...form, permissions: { ...form.permissions, [k]: v } })
          : setEditUser({ ...editUser!, permissions: { ...editUser!.permissions, [k]: v } })}
      />
      {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>}
      <div className="flex gap-2 pt-2">
        <button className="btn-primary" type="submit"><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit</button>
        <button className="btn-secondary" type="button" onClick={closeModal}><i className="fa-regular fa-xmark mr-1.5" />Zrušit</button>
      </div>
    </form>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Uživatelé</h1>
        <button className="btn-primary" onClick={() => { setCreating(true); setEditUser(null); }}><i className="fa-regular fa-plus mr-1.5" />Nový uživatel</button>
      </div>

      {(creating || editUser) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 pt-12" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h3 className="font-semibold">{creating ? "Nový uživatel" : `Upravit: ${editUser!.name}`}</h3>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-700"><i className="fa-regular fa-xmark text-lg" /></button>
            </div>
            <div className="px-6 py-5">
              <UserForm isCreate={creating} />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 max-w-2xl">
        {users.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((u) => (
          <div key={u.id} className="card p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{u.name}</p>
                {u.isSuperAdmin && <span className="badge bg-purple-100 text-purple-800">Super Admin</span>}
              </div>
              <p className="text-sm text-gray-500">{u.email}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm" onClick={() => startEdit(u)}><i className="fa-regular fa-pen mr-1.5" />Upravit</button>
              {(!me || u.id !== me.id) && (
                <button className="btn-danger text-sm" onClick={() => handleDelete(u.id)}><i className="fa-regular fa-trash mr-1.5" />Smazat</button>
              )}
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} total={users.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}
