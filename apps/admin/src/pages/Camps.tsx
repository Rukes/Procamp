import { useTitle } from "../hooks/useTitle";
import { useEffect, useState } from "react";
import HelpModal from "../components/HelpModal";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Camp, Reservation } from "@procamp/shared";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import Pagination from "../components/Pagination";
import Tooltip from "../components/Tooltip";

export default function CampsPage() {
  useTitle("Objekty");
  const { can } = useAuth();
  const toast = useToast();
  const [helpOpen, setHelpOpen] = useState(false);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const load = () => {
    api.get("/camps").then((r) => setCamps(r.data)).catch(() => {});
    api.get("/reservations").then((r) => setReservations(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/camps", { name, slug, notificationEmail });
      setCreating(false); setName(""); setSlug(""); setNotificationEmail("");
      toast.success(`Objekt „${name}" byl vytvořen.`);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Chyba při vytváření kempu");
      toast.error(msg ?? "Nepodařilo se vytvořit objekt.");
    }
  };

  const getOccupancy = (camp: Camp) => {
    const total = (camp.accommodationTypes ?? []).reduce((s, t) => s + t.capacity, 0);
    if (total === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const active = reservations.filter((r) => {
      if (r.campId !== camp.id) return false;
      if (r.status === "CANCELLED") return false;
      const ci = new Date(r.checkIn);
      const co = new Date(r.checkOut);
      return ci <= today && co > today;
    }).length;
    return Math.round((active / total) * 100);
  };

  const formBase = import.meta.env.VITE_FORM_BASE_URL;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Objekty</h1>
          <button onClick={() => setHelpOpen(true)} className="text-gray-400 hover:text-blue-500 transition-colors" title="Nápověda"><i className="fa-regular fa-circle-question text-lg" /></button>
        </div>
        {helpOpen && <HelpModal topic="objekty" onClose={() => setHelpOpen(false)} />}
        {can("camps_create") && (
          <button className="btn-primary" onClick={() => setCreating(true)}><i className="fa-regular fa-plus mr-1.5" />Nový objekt</button>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-16" onClick={() => { setCreating(false); setName(""); setSlug(""); setNotificationEmail(""); setError(""); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Nový objekt</h2>
              <button type="button" className="text-gray-400 hover:text-gray-700 text-xl leading-none" onClick={() => { setCreating(false); setName(""); setSlug(""); setNotificationEmail(""); setError(""); }}>×</button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Název objektu</label>
                <input className="input" autoFocus value={name} onChange={(e) => {
                  setName(e.target.value);
                  const s = e.target.value
                    .normalize("NFD")
                    .replace(/[̀-ͯ]/g, "")
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "");
                  setSlug(s);
                }} required />
              </div>
              <div>
                <label className="label">URL slug (identifikátor)</label>
                <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" />
                <p className="text-xs text-gray-500 mt-1">Použije se v URL formuláře: /form/{"{org-slug}"}/<strong>{slug || "nazev-objektu"}</strong></p>
              </div>
              <div>
                <label className="label">E-mail správce <span className="text-gray-400 font-normal text-xs">(notifikace o rezervacích)</span></label>
                <input className="input" type="email" value={notificationEmail} onChange={(e) => setNotificationEmail(e.target.value)} required placeholder="info@kempmylnska.cz" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button className="btn-primary" type="submit"><i className="fa-regular fa-floppy-disk mr-1.5" />Vytvořit</button>
                <button className="btn-secondary" type="button" onClick={() => { setCreating(false); setName(""); setSlug(""); setNotificationEmail(""); setError(""); }}><i className="fa-regular fa-xmark mr-1.5" />Zrušit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {(perPage === 0 ? camps : camps.slice((page - 1) * perPage, page * perPage)).map((camp) => {
          const occupancy = getOccupancy(camp);
          return (
            <div key={camp.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Tooltip text="Nastavení objektu" position="top"><Link to={`/camps/${camp.id}`} className="px-3 py-2 rounded-lg border border-yellow-400 hover:bg-yellow-50 text-yellow-600 text-sm font-medium transition-colors shrink-0 hidden sm:block"><i className="fa-regular fa-gear" /></Link></Tooltip>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900">{camp.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{camp.slug}</code>
                  <a
                    href={`${formBase}/form/${(camp as any).organization?.slug}/${camp.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                    title="Otevřít rezervační formulář"
                  >
                    <i className="fa-regular fa-arrow-up-right-from-square mr-0.5" />formulář
                  </a>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-gray-400">
                    {camp.accommodationTypes?.length ?? 0} {camp.accommodationTypes?.length === 1 ? "typ ubytování" : "typy ubytování"}
                  </p>
                  {occupancy !== null && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${occupancy === 0 ? "bg-gray-100 text-gray-500" : occupancy <= 50 ? "bg-green-100 text-green-700" : occupancy <= 80 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {occupancy} % vytíženo
                    </span>
                  )}
                  {(camp as any).smtpHost && (
                    <span className="text-xs text-green-600"><i className="fa-regular fa-envelope mr-1" />SMTP aktivní</span>
                  )}
                </div>
              </div>
              <Tooltip text="Rezervace tohoto objektu" position="top">
                <Link to={`/reservations?camp=${camp.id}`} className="px-3 py-2 rounded-lg border border-blue-400 hover:bg-blue-50 text-blue-600 text-sm font-medium transition-colors shrink-0 hidden sm:flex items-center gap-1.5">
                  <i className="fa-regular fa-calendar-check mr-1.5" />Rezervace
                </Link>
              </Tooltip>
              <div className="flex gap-2 sm:hidden">
                <Link to={`/camps/${camp.id}`} className="px-2.5 py-1.5 rounded-lg border border-yellow-400 hover:bg-yellow-50 text-yellow-600 text-xs font-medium transition-colors flex items-center gap-1">
                  <i className="fa-regular fa-gear" />Nastavení
                </Link>
                <Link to={`/reservations?camp=${camp.id}`} className="px-2.5 py-1.5 rounded-lg border border-blue-400 hover:bg-blue-50 text-blue-600 text-xs font-medium transition-colors flex items-center gap-1">
                  <i className="fa-regular fa-calendar-check" />Rezervace
                </Link>
              </div>
            </div>
          );
        })}
        {camps.length === 0 && !creating && (
          <div className="card p-12 text-center text-gray-400">
            <p className="text-lg mb-2">Žádné objekty</p>
            <p className="text-sm">Vytvořte první objekt kliknutím na „+ Nový objekt".</p>
          </div>
        )}
      </div>
      <Pagination page={page} total={camps.length} perPage={perPage} onChange={setPage} onPerPageChange={setPerPage} />
    </div>
  );
}
