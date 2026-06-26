import { useTitle } from "../hooks/useTitle";
import { useEffect, useState } from "react";
import Pagination from "../components/Pagination";
import HelpModal from "../components/HelpModal";
import { api } from "../api/client";
import { Camp } from "@procamp/shared";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useToast } from "../contexts/ToastContext";

interface AccommodationType {
  id: string;
  translations: Record<string, { name: string }>;
}

interface BlockedPeriod {
  id: string;
  campId: string;
  camp: Camp;
  accommodationTypeId: string | null;
  accommodationType: AccommodationType | null;
  dateFrom: string;
  dateTo: string;
  reason: string;
  internalNote: string | null;
  source: string;
}

const EMPTY = { campId: "", accommodationTypeId: "", dateFrom: "", dateTo: "", reason: "", internalNote: "" };

export default function BlockingsPage() {
  useTitle("Blokace termínů");
  const toast = useToast();
  const [helpOpen, setHelpOpen] = useState(false);
  const [periods, setPeriods] = useState<BlockedPeriod[]>([]);
  const [camps, setCamps] = useState<(Camp & { accommodationTypes: AccommodationType[] })[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlockedPeriod | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState("");
  const [campFilter, setCampFilter] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const load = () => {
    Promise.all([
      api.get("/blocked-periods"),
      api.get("/camps"),
    ]).then(([p, c]) => { setPeriods(p.data); setCamps(c.data); }).catch(() => {}).finally(() => setLoaded(true));
  };
  useEffect(() => { load(); }, []);

  const selectedCamp = camps.find((c) => c.id === form.campId);
  const types = selectedCamp?.accommodationTypes ?? [];

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (p: BlockedPeriod) => {
    setEditing(p);
    setForm({
      campId: p.campId,
      accommodationTypeId: p.accommodationTypeId ?? "",
      dateFrom: p.dateFrom.slice(0, 10),
      dateTo: p.dateTo.slice(0, 10),
      reason: p.reason,
      internalNote: p.internalNote ?? "",
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.dateTo && form.dateFrom && form.dateTo < form.dateFrom) {
      setError('Datum "do" nesmí být dříve než datum "od".');
      return;
    }
    try {
      const payload = {
        campId: form.campId,
        accommodationTypeId: form.accommodationTypeId || null,
        dateFrom: form.dateFrom,
        dateTo: form.dateTo,
        reason: form.reason,
        internalNote: form.internalNote || null,
      };
      if (editing) {
        await api.patch(`/blocked-periods/${editing.id}`, payload);
        toast.success("Blokace byla upravena.");
      } else {
        await api.post("/blocked-periods", payload);
        toast.success("Blokace termínu byla vytvořena.");
      }
      closeModal();
      load();
    } catch {
      setError("Nepodařilo se uložit blokaci.");
    }
  };

  const handleDelete = async (p: BlockedPeriod) => {
    if (!confirm(`Opravdu smazat blokaci „${p.reason || "bez důvodu"}"?`)) return;
    try {
      await api.delete(`/blocked-periods/${p.id}`);
      toast.success("Blokace byla smazána.");
      load();
    } catch {
      toast.error("Nepodařilo se smazat blokaci.");
    }
  };

  const typeName = (p: BlockedPeriod) => {
    if (!p.accommodationType) return "Celý objekt";
    const t = p.accommodationType.translations;
    return t.cs?.name ?? t[Object.keys(t)[0]]?.name ?? "—";
  };

  const filtered = campFilter ? periods.filter((p) => p.campId === campFilter) : periods;
  const paged = perPage === 0 ? filtered : filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Blokace termínů</h1>
          <button onClick={() => setHelpOpen(true)} className="text-gray-400 hover:text-blue-500 transition-colors" title="Nápověda"><i className="fa-regular fa-circle-question text-lg" /></button>
        </div>
        {helpOpen && <HelpModal topic="blokace" onClose={() => setHelpOpen(false)} />}
        <button className="btn-primary" onClick={openNew}>
          <i className="fa-regular fa-plus mr-1.5" />Nová blokace
        </button>
      </div>

      {/* Filtr */}
      <div className="mb-5">
        <select className="input w-56" value={campFilter} onChange={(e) => setCampFilter(e.target.value)}>
          <option value="">Všechny objekty</option>
          {camps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Seznam */}
      <div className="card overflow-hidden">
        {!loaded ? (
          <div className="p-8 text-center text-gray-400">Načítám…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>Žádné blokace termínů.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
                  <th className="px-4 py-3 font-medium">Objekt</th>
                  <th className="px-4 py-3 font-medium">Typ ubytování</th>
                  <th className="px-4 py-3 font-medium">Od</th>
                  <th className="px-4 py-3 font-medium">Do</th>
                  <th className="px-4 py-3 font-medium">Důvod</th>
                  <th className="px-4 py-3 font-medium">Interní poznámka</th>
                  <th className="px-4 py-3 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paged.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.camp?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{typeName(p)}</td>
                    <td className="px-4 py-3 text-gray-600">{format(new Date(p.dateFrom), "d. M. yyyy", { locale: cs })}</td>
                    <td className="px-4 py-3 text-gray-600">{format(new Date(p.dateTo), "d. M. yyyy", { locale: cs })}</td>
                    <td className="px-4 py-3 text-gray-600">{p.reason || <span className="text-gray-400 italic">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{p.internalNote || <span className="text-gray-400 italic">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {p.source === "booking" ? (
                          <span className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 bg-blue-50">Booking.com</span>
                        ) : (
                          <>
                            <button className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors" onClick={() => openEdit(p)}>
                              <i className="fa-regular fa-pen mr-1" />Upravit
                            </button>
                            <button className="text-xs px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors" onClick={() => handleDelete(p)}>
                              <i className="fa-regular fa-trash mr-1" />Smazat
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} total={filtered.length} perPage={perPage} onChange={setPage} onPerPageChange={(pp) => { setPerPage(pp); setPage(1); }} />

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-16" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editing ? "Upravit blokaci" : "Nová blokace termínu"}</h2>
              <button type="button" className="text-gray-400 hover:text-gray-700 text-xl leading-none" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Objekt</label>
                <select className="input" required value={form.campId} onChange={(e) => setForm((f) => ({ ...f, campId: e.target.value, accommodationTypeId: "" }))}>
                  <option value="">Vyberte objekt…</option>
                  {camps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Typ ubytování</label>
                <select className="input" value={form.accommodationTypeId} onChange={(e) => setForm((f) => ({ ...f, accommodationTypeId: e.target.value }))} disabled={!form.campId}>
                  <option value="">Blokovat celý objekt</option>
                  {types.map((t) => {
                    const name = t.translations.cs?.name ?? t.translations[Object.keys(t.translations)[0]]?.name ?? t.id;
                    return <option key={t.id} value={t.id}>{name}</option>;
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Od</label>
                  <input className="input" type="date" required value={form.dateFrom} onChange={(e) => setForm((f) => ({ ...f, dateFrom: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Do</label>
                  <input className="input" type="date" required value={form.dateTo} onChange={(e) => setForm((f) => ({ ...f, dateTo: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="label">Důvod</label>
                <input className="input" placeholder="např. Údržba, Soukromá akce…" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
              </div>

              <div>
                <label className="label">Interní poznámka</label>
                <textarea className="input resize-none" rows={2} value={form.internalNote} onChange={(e) => setForm((f) => ({ ...f, internalNote: e.target.value }))} />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button className="btn-primary" type="submit">
                  <i className="fa-regular fa-floppy-disk mr-1.5" />{editing ? "Uložit" : "Vytvořit"}
                </button>
                <button className="btn-secondary" type="button" onClick={closeModal}>
                  <i className="fa-regular fa-xmark mr-1.5" />Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
