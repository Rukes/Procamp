import { useTitle } from "../hooks/useTitle";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../contexts/ToastContext";
import WysiwygEditor from "../components/WysiwygEditor";

interface MotdItem {
  id: string;
  title: string;
  body: string;
  color: string;
  closeable: boolean;
  showDashboard: boolean;
  showGlobal: boolean;
  showMenu: boolean;
  linkUrl: string | null;
  linkLabel: string | null;
  active: boolean;
  validFrom: string;
  validTo: string;
  createdAt: string;
}

const COLORS = [
  { value: "primary", label: "Primární", bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-800", dot: "bg-blue-500" },
  { value: "warning", label: "Upozornění", bg: "bg-yellow-50", border: "border-yellow-400", text: "text-yellow-800", dot: "bg-yellow-500" },
  { value: "danger", label: "Kritické", bg: "bg-red-50", border: "border-red-400", text: "text-red-800", dot: "bg-red-500" },
  { value: "success", label: "Úspěch", bg: "bg-green-50", border: "border-green-400", text: "text-green-800", dot: "bg-green-500" },
  { value: "neutral", label: "Neutrální", bg: "bg-gray-50", border: "border-gray-400", text: "text-gray-800", dot: "bg-gray-500" },
];

const toLocalInput = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EMPTY = {
  title: "", body: "", color: "primary",
  closeable: true, showDashboard: true, showGlobal: false, showMenu: false,
  linkUrl: "", linkLabel: "", active: true,
  validFrom: toLocalInput(new Date().toISOString()),
  validTo: toLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
};

function getStatus(m: MotdItem): { label: string; color: string } {
  const now = new Date();
  if (!m.active) return { label: "Neaktivní", color: "text-gray-400" };
  if (new Date(m.validTo) < now) return { label: "Vypršela", color: "text-gray-400" };
  if (new Date(m.validFrom) > now) return { label: "Naplánována", color: "text-blue-500" };
  return { label: "Aktivní", color: "text-green-600" };
}

export default function MotdPage() {
  useTitle("MOTD");
  const toast = useToast();
  const [items, setItems] = useState<MotdItem[]>([]);
  const [modal, setModal] = useState<MotdItem | "new" | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/motd").then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ ...EMPTY }); setModal("new"); };
  const openEdit = (m: MotdItem) => {
    setForm({
      title: m.title, body: m.body, color: m.color,
      closeable: m.closeable, showDashboard: m.showDashboard,
      showGlobal: m.showGlobal, showMenu: m.showMenu,
      linkUrl: m.linkUrl ?? "", linkLabel: m.linkLabel ?? "",
      active: m.active,
      validFrom: toLocalInput(m.validFrom),
      validTo: toLocalInput(m.validTo),
    });
    setModal(m);
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        validFrom: new Date(form.validFrom).toISOString(),
        validTo: new Date(form.validTo).toISOString(),
      };
      if (modal === "new") {
        await api.post("/motd", payload);
        toast.success("Zpráva vytvořena.");
      } else {
        await api.put(`/motd/${(modal as MotdItem).id}`, payload);
        toast.success("Zpráva uložena.");
      }
      closeModal();
      load();
    } catch {
      toast.error("Nepodařilo se uložit.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: MotdItem) => {
    if (!confirm(`Smazat zprávu „${m.title}"?`)) return;
    try {
      await api.delete(`/motd/${m.id}`);
      toast.success("Zpráva smazána.");
      load();
    } catch {
      toast.error("Nepodařilo se smazat.");
    }
  };

  const colorDot = (color: string) => COLORS.find((c) => c.value === color)?.dot ?? "bg-gray-400";

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MOTD</h1>
          <p className="text-sm text-gray-400 mt-0.5">Zprávy zobrazované uživatelům v administraci</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <i className="fa-regular fa-plus" /> Nová zpráva
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-400 text-sm">Žádné zprávy.</p>}
        {items.map((m) => {
          const status = getStatus(m);
          const color = COLORS.find((c) => c.value === m.color);
          return (
            <div key={m.id} className={`rounded-xl border-l-4 ${color?.border ?? "border-gray-300"} border border-gray-200 bg-white p-4 flex items-start gap-4`}>
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${colorDot(m.color)}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{m.title}</span>
                  <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                  <span className="text-xs text-gray-400">{color?.label}</span>
                  {m.closeable && <span className="text-xs text-gray-400">· zavíratelná</span>}
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {m.showDashboard && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Dashboard</span>}
                  {m.showGlobal && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Všude</span>}
                  {m.showMenu && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Menu</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(m.validFrom).toLocaleString("cs-CZ")} — {new Date(m.validTo).toLocaleString("cs-CZ")}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(m)} className="btn-secondary text-sm px-3 py-1.5">
                  <i className="fa-regular fa-pen" />
                </button>
                <button onClick={() => handleDelete(m)} className="btn-danger text-sm px-3 py-1.5">
                  <i className="fa-regular fa-trash" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-8" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold">{modal === "new" ? "Nová zpráva" : "Upravit zprávu"}</h3>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-700"><i className="fa-regular fa-xmark text-lg" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Titulek *</label>
                <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>

              <div>
                <label className="label">Obsah *</label>
                <WysiwygEditor
                  value={form.body}
                  onChange={(v) => setForm((f) => ({ ...f, body: v }))}
                />
              </div>

              <div>
                <label className="label">Barva</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${form.color === c.value ? `${c.bg} ${c.border} ${c.text} border-2` : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Platnost od *</label>
                  <input className="input" type="datetime-local" value={form.validFrom} onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Platnost do *</label>
                  <input className="input" type="datetime-local" value={form.validTo} onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))} required />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Zobrazení</p>
                <div className="space-y-2">
                  {[
                    { key: "showDashboard", label: "Dashboard", desc: "Banner na hlavní stránce" },
                    { key: "showGlobal", label: "Všude", desc: "Banner na každé stránce adminu" },
                    { key: "showMenu", label: "V menu", desc: "Notifikace pod logem v postranním menu" },
                  ].map(({ key, label, desc }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form[key as keyof typeof form] as boolean}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <span className="text-xs text-gray-400">{desc}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.closeable}
                      onChange={(e) => setForm((f) => ({ ...f, closeable: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Zavíratelná</span>
                    <span className="text-xs text-gray-400">Uživatel může zprávu skrýt</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Aktivní</span>
                    <span className="text-xs text-gray-400">Zpráva se zobrazuje (v rámci platnosti)</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Odkaz (volitelné)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">URL odkazu</label>
                    <input className="input" type="url" value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="label">Text tlačítka</label>
                    <input className="input" value={form.linkLabel} onChange={(e) => setForm((f) => ({ ...f, linkLabel: e.target.value }))} placeholder="Více informací" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary">Zrušit</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <i className="fa-regular fa-spinner animate-spin" /> : <i className="fa-regular fa-check" />}
                  {modal === "new" ? "Vytvořit" : "Uložit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
