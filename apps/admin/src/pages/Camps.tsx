import { useTitle } from "../hooks/useTitle";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Camp, Reservation } from "@procamp/shared";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import Pagination from "../components/Pagination";

export default function CampsPage() {
  useTitle("Objekty");
  const { can } = useAuth();
  const toast = useToast();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const load = () => {
    api.get("/camps").then((r) => setCamps(r.data)).catch(() => {});
    api.get("/reservations").then((r) => setReservations(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/camps", { name, slug });
      setCreating(false); setName(""); setSlug("");
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
        <h1 className="text-2xl font-bold text-gray-900">Objekty</h1>
        {can("camps_create") && (
          <button className="btn-primary" onClick={() => setCreating(true)}><i className="fa-regular fa-plus mr-1.5" />Nový objekt</button>
        )}
      </div>

      {creating && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold mb-4">Nový objekt</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="label">Název objektu</label>
              <input className="input" value={name} onChange={(e) => {
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button className="btn-primary" type="submit"><i className="fa-regular fa-floppy-disk mr-1.5" />Vytvořit</button>
              <button className="btn-secondary" type="button" onClick={() => setCreating(false)}><i className="fa-regular fa-xmark mr-1.5" />Zrušit</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {camps.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((camp) => {
          const occupancy = getOccupancy(camp);
          return (
            <div key={camp.id} className="card p-5 flex items-center justify-between">
              <div>
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
                <p className="text-xs text-gray-400 mt-1">
                  {camp.accommodationTypes?.length ?? 0} {camp.accommodationTypes?.length === 1 ? "typ ubytování" : "typy ubytování"}
                  {occupancy !== null && <span className="ml-2">· Aktuální vytíženost: {occupancy} %</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <Link to={`/camps/${camp.id}`} className="btn-secondary"><i className="fa-regular fa-gear sm:mr-1.5" /><span className="hidden sm:inline">Spravovat</span></Link>
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
      <Pagination page={page} total={camps.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}
