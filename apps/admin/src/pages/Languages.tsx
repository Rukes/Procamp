import { useTitle } from "../hooks/useTitle";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Language } from "@procamp/shared";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import Pagination from "../components/Pagination";

const PREDEFINED = [
  { code: "cs", name: "Čeština" },
  { code: "en", name: "Angličtina" },
  { code: "de", name: "Němčina" },
  { code: "pl", name: "Polština" },
  { code: "it", name: "Italština" },
  { code: "es", name: "Španělština" },
  { code: "fr", name: "Francouzština" },
  { code: "ru", name: "Ruština" },
  { code: "uk", name: "Ukrajinština" },
  { code: "sk", name: "Slovenština" },
  { code: "hu", name: "Maďarština" },
];

const previewPrice = (sym: string, pos: "before" | "after") =>
  pos === "before" ? `${sym} 100` : `100 ${sym}`;

const EMPTY_FORM = { code: "", currencyCode: "", currencySymbol: "", currencyPosition: "after" as "before" | "after" };

export default function LanguagesPage() {
  useTitle("Jazyky");
  const { can } = useAuth();
  const toast = useToast();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ currencyCode: string; currencySymbol: string; currencyPosition: "before" | "after" }>({ currencyCode: "", currencySymbol: "", currencyPosition: "after" });

  const load = () => api.get("/languages").then((r) => setLanguages(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const available = PREDEFINED.filter((p) => !languages.find((l) => l.code === p.code));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const preset = PREDEFINED.find((p) => p.code === addForm.code);
    if (!preset) return;
    try {
      await api.post("/languages", {
        code: preset.code,
        name: preset.name,
        currencyCode: addForm.currencyCode,
        currencySymbol: addForm.currencySymbol,
        currencyPosition: addForm.currencyPosition,
      });
      setAddOpen(false);
      setAddForm(EMPTY_FORM);
      toast.success(`Jazyk „${preset.name}" byl přidán.`);
      load();
    } catch {
      toast.error("Nepodařilo se přidat jazyk.");
    }
  };

  const handleUpdate = async (lang: Language) => {
    try {
      await api.put(`/languages/${lang.id}`, editForm);
      setEditId(null);
      toast.success("Jazyk byl uložen.");
      load();
    } catch {
      toast.error("Nepodařilo se uložit jazyk.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Smazat jazyk?")) return;
    try {
      await api.delete(`/languages/${id}`);
      toast.success("Jazyk byl smazán.");
      load();
    } catch {
      toast.error("Nepodařilo se smazat jazyk.");
    }
  };

  const startEdit = (lang: Language) => {
    setEditId(lang.id);
    setEditForm({ currencyCode: lang.currencyCode, currencySymbol: lang.currencySymbol, currencyPosition: lang.currencyPosition as "before" | "after" });
  };

  const sorted = [...languages].sort((a, b) => {
    const ai = PREDEFINED.findIndex((p) => p.code === a.code);
    const bi = PREDEFINED.findIndex((p) => p.code === b.code);
    return ai - bi;
  });

  const addValid = addForm.code && addForm.currencyCode.trim() && addForm.currencySymbol.trim();

  return (
    <div className="p-8 max-w-2xl">
      {/* Modal — přidat jazyk */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-12" onClick={() => setAddOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold">Přidat jazyk</h3>
              <button onClick={() => setAddOpen(false)} className="text-gray-400 hover:text-gray-700"><i className="fa-regular fa-xmark text-lg" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="label">Jazyk</label>
                <select className="input" value={addForm.code} onChange={(e) => setAddForm({ ...addForm, code: e.target.value })} required>
                  <option value="">— vyberte jazyk —</option>
                  {available.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Kód měny</label>
                  <input className="input" value={addForm.currencyCode} onChange={(e) => setAddForm({ ...addForm, currencyCode: e.target.value.toUpperCase() })} placeholder="CZK" maxLength={5} required />
                </div>
                <div>
                  <label className="label">Symbol měny</label>
                  <input className="input" value={addForm.currencySymbol} onChange={(e) => setAddForm({ ...addForm, currencySymbol: e.target.value })} placeholder="Kč" required />
                </div>
              </div>
              <div>
                <label className="label">Pozice symbolu</label>
                <select className="input" value={addForm.currencyPosition} onChange={(e) => setAddForm({ ...addForm, currencyPosition: e.target.value as "before" | "after" })}>
                  <option value="after">Za číslem — 100 Kč</option>
                  <option value="before">Před číslem — €100</option>
                </select>
              </div>
              {addForm.currencySymbol && (
                <p className="text-xs text-gray-500">Náhled: <strong>{previewPrice(addForm.currencySymbol, addForm.currencyPosition)}</strong></p>
              )}
              <div className="flex gap-2 pt-1">
                <button className="btn-primary" type="submit" disabled={!addValid}><i className="fa-regular fa-plus mr-1.5" />Přidat</button>
                <button className="btn-secondary" type="button" onClick={() => setAddOpen(false)}><i className="fa-regular fa-xmark mr-1.5" />Zrušit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jazyky formuláře</h1>
          <p className="text-sm text-gray-500 mt-1">Každý jazyk má vlastní měnu — zákazník vidí ceny v měně svého jazyka.</p>
        </div>
        {can("org_admin") && available.length > 0 && (
          <button className="btn bg-green-600 hover:bg-green-700 text-white text-sm" onClick={() => { setAddForm(EMPTY_FORM); setAddOpen(true); }}>
            <i className="fa-regular fa-plus mr-1.5" /><span className="hidden sm:inline">Přidat jazyk</span><span className="sm:hidden">Přidat</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {sorted.length === 0 && (
          <div className="card p-12 text-center text-gray-400">
            <i className="fa-regular fa-flag text-3xl mb-3 block" />
            <p>Žádné jazyky. Přidejte první kliknutím na „+ Přidat jazyk".</p>
          </div>
        )}
        {sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((lang) => (
          <div key={lang.id} className="card p-4">
            {editId === lang.id ? (
              <div className="space-y-3">
                <p className="font-medium">{lang.name} <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-1">{lang.code}</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Kód měny</label>
                    <input className="input" value={editForm.currencyCode} onChange={(e) => setEditForm({ ...editForm, currencyCode: e.target.value.toUpperCase() })} placeholder="CZK" maxLength={5} />
                  </div>
                  <div>
                    <label className="label">Symbol měny</label>
                    <input className="input" value={editForm.currencySymbol} onChange={(e) => setEditForm({ ...editForm, currencySymbol: e.target.value })} placeholder="Kč" />
                  </div>
                </div>
                <div>
                  <label className="label">Pozice symbolu</label>
                  <select className="input" value={editForm.currencyPosition} onChange={(e) => setEditForm({ ...editForm, currencyPosition: e.target.value as "before" | "after" })}>
                    <option value="after">Za číslem — 100 Kč</option>
                    <option value="before">Před číslem — €100</option>
                  </select>
                </div>
                {editForm.currencySymbol && (
                  <p className="text-xs text-gray-500">Náhled: <strong>{previewPrice(editForm.currencySymbol, editForm.currencyPosition)}</strong></p>
                )}
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={() => handleUpdate(lang)}><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit</button>
                  <button className="btn-secondary" onClick={() => setEditId(null)}><i className="fa-regular fa-xmark mr-1.5" />Zrušit</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{lang.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{lang.code}</span>
                    {lang.isDefault && <span className="badge bg-blue-100 text-blue-700">Výchozí</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {lang.currencyCode} · {previewPrice(lang.currencySymbol, lang.currencyPosition as "before" | "after")}
                  </p>
                </div>
                <div className="flex gap-2">
                  {can("org_admin") && (
                    <button className="btn-secondary text-sm py-1.5" onClick={() => startEdit(lang)}><i className="fa-regular fa-pen sm:mr-1.5" /><span className="hidden sm:inline">Upravit měnu</span></button>
                  )}
                  {!lang.isDefault && can("org_admin") && (
                    <button className="btn-danger text-sm py-1.5" onClick={() => handleDelete(lang.id)}><i className="fa-regular fa-trash sm:mr-1.5" /><span className="hidden sm:inline">Smazat</span></button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <Pagination page={page} total={sorted.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}
