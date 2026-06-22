import { useTitle } from "../hooks/useTitle";
import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { Reservation, Camp, Language } from "@procamp/shared";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useAuth } from "../contexts/AuthContext";
import { langFlag } from "../utils/langFlag";
import Pagination from "../components/Pagination";
import ReservationCalendar from "../components/ReservationCalendar";

function NotePopover({ note, internal = false }: { note: string; internal?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (btnRef.current && !btnRef.current.closest("[data-note-popover]")?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const popW = 256;
      const margin = 8;
      let left = rect.left + rect.width / 2 - popW / 2;
      if (left < margin) left = margin;
      if (left + popW > window.innerWidth - margin) left = window.innerWidth - popW - margin;
      setPos({ top: rect.bottom + 6, left });
    }
    setOpen((v) => !v);
  };

  return (
    <div data-note-popover className="relative flex-shrink-0 mt-0.5" onMouseEnter={(e) => { if (window.matchMedia("(hover: hover)").matches) handleOpen(e as unknown as React.MouseEvent); }} onMouseLeave={() => { if (window.matchMedia("(hover: hover)").matches) setOpen(false); }}>
      <button ref={btnRef} type="button" onClick={handleOpen} className={internal ? "text-red-500 hover:text-red-600 transition-colors" : "text-amber-500 hover:text-amber-600 transition-colors"}>
        <i className={internal ? "fa-solid fa-note" : "fa-regular fa-message-lines"} />
      </button>
      {open && (
        <div
          className="fixed z-50 w-64 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl"
          style={{ top: pos.top, left: pos.left }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = { PENDING: "Čeká", CONFIRMED: "Potvrzena", CANCELLED: "Zrušena", COMPLETED: "Proběhla", EXPIRED: "Propadlá" };
const STATUS_CLASS: Record<string, string> = { PENDING: "badge-pending", CONFIRMED: "badge-confirmed", CANCELLED: "badge-cancelled", COMPLETED: "badge bg-gray-100 text-gray-500", EXPIRED: "badge bg-orange-100 text-orange-700" };

type SortKey = "name" | "camp" | "checkIn" | "checkOut" | "persons" | "price" | "status";
type SortDir = "asc" | "desc";

function effectiveStatus(r: Reservation): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (r.status === "CONFIRMED" && new Date(r.checkOut) <= today) return "COMPLETED";
  if (r.status === "PENDING" && new Date(r.checkOut) <= today) return "EXPIRED";
  return r.status;
}

function isOngoing(r: Reservation): boolean {
  if (r.status !== "CONFIRMED") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(r.checkIn) <= today && new Date(r.checkOut) > today;
}

const STATUS_SORT_ORDER: Record<string, number> = { PENDING: 0, CONFIRMED: 1, COMPLETED: 2, EXPIRED: 3, CANCELLED: 4 };

export default function ReservationsPage() {
  useTitle("Rezervace");
  const { can } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<(Reservation & { camp: Camp })[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [search, setSearch] = useState("");
  const [campFilter, setCampFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<"list" | "calendar">(searchParams.get("view") === "calendar" ? "calendar" : "list");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("checkIn");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const PER_PAGE = 25;

  const load = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (campFilter) params.set("campId", campFilter);
    // EXPIRED je virtuální stav — na server posílám PENDING, pak filtruji client-side
    if (statusFilter && statusFilter !== "EXPIRED") params.set("status", statusFilter);
    else if (statusFilter === "EXPIRED") params.set("status", "PENDING");
    api.get(`/reservations?${params}`).then((r) => {
      let data = r.data;
      if (statusFilter === "PENDING") data = data.filter((x: Reservation) => effectiveStatus(x) === "PENDING");
      if (statusFilter === "EXPIRED") data = data.filter((x: Reservation) => effectiveStatus(x) === "EXPIRED");
      setReservations(data);
    }).catch(() => {});
  };

  useEffect(() => {
    api.get("/camps/for-filter").then((r) => setCamps(r.data)).catch(() => {});
    api.get("/languages").then((r) => setLanguages(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); setPage(1); }, [search, campFilter, statusFilter, dateFrom, dateTo]);

  const handleConfirm = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Opravdu chcete potvrdit tuto rezervaci?")) return;
    await api.patch(`/reservations/${id}/status`, { status: "CONFIRMED" });
    load();
  };

  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportOpen]);

  const handleExport = useCallback(async (fmt: "xlsx" | "csv") => {
    setExportOpen(false);
    const params = new URLSearchParams();
    if (campFilter) params.set("campId", campFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const mime = fmt === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv;charset=utf-8;";
    const res = await api.get(`/reservations/export/${fmt}${qs}`, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `rezervace.${fmt}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [campFilter, statusFilter, search, dateFrom, dateTo]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const formatPrice = (r: Reservation & { camp: Camp }): string => {
    const lang = languages.find((l) => l.code === r.languageCode);
    const amount = r.totalPrice.toLocaleString("cs-CZ");
    if (!lang) return `${amount} Kč`;
    return lang.currencyPosition === "before"
      ? `${lang.currencySymbol}${amount}`
      : `${amount} ${lang.currencySymbol}`;
  };

  const sorted = [...reservations].sort((a, b) => {
    const es_a = effectiveStatus(a);
    const es_b = effectiveStatus(b);
    let cmp = 0;
    switch (sortKey) {
      case "name": cmp = `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`, "cs"); break;
      case "camp": cmp = (a.camp?.name ?? "").localeCompare(b.camp?.name ?? "", "cs"); break;
      case "checkIn": cmp = new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(); break;
      case "checkOut": cmp = new Date(a.checkOut).getTime() - new Date(b.checkOut).getTime(); break;
      case "persons": cmp = (a.adults + a.children) - (b.adults + b.children); break;
      case "price": cmp = a.totalPrice - b.totalPrice; break;
      case "status": cmp = STATUS_SORT_ORDER[es_a] - STATUS_SORT_ORDER[es_b]; break;
    }
    // COMPLETED/CANCELLED vždy na konec při výchozím řazení (ne-status sloupce)
    if (sortKey !== "status") {
      const aLast = es_a === "COMPLETED" || es_a === "EXPIRED" || es_a === "CANCELLED";
      const bLast = es_b === "COMPLETED" || es_b === "EXPIRED" || es_b === "CANCELLED";
      if (aLast !== bLast) return aLast ? 1 : -1;
    }
    return sortDir === "asc" ? cmp : -cmp;
  }).filter((r) => {
    if (dateFrom && new Date(r.checkIn) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.checkOut) > new Date(new Date(dateTo).setHours(23, 59, 59, 999))) return false;
    return true;
  });

  const SortIcon = ({ k }: { k: SortKey }) => (
    <i className={`fa-regular ml-1 text-xs ${
      sortKey === k ? (sortDir === "asc" ? "fa-arrow-up text-blue-500" : "fa-arrow-down text-blue-500") : "fa-arrow-up-arrow-down text-gray-300"
    }`} />
  );

  const Th = ({ k, children, className = "" }: { k: SortKey; children: React.ReactNode; className?: string }) => (
    <th
      className={`px-4 py-3 font-medium cursor-pointer select-none hover:text-gray-800 transition-colors ${className}`}
      onClick={() => handleSort(k)}
    >
      {children}<SortIcon k={k} />
    </th>
  );

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rezervace</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button onClick={() => setView("list")} className={`px-3 py-1.5 text-sm ${view === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}><i className="fa-regular fa-list mr-1.5" />Seznam</button>
              <button onClick={() => setView("calendar")} className={`px-3 py-1.5 text-sm ${view === "calendar" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}><i className="fa-regular fa-calendar mr-1.5" />Kalendář</button>
            </div>
            {can("reservations_create") && <Link to="/reservations/new" className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"><i className="fa-regular fa-plus mr-1.5" /><span className="hidden sm:inline">Nová rezervace</span><span className="sm:hidden">Nová</span></Link>}
          </div>
        </div>
        <div ref={exportRef} className="relative self-start hidden sm:block">
          <button className="btn-secondary text-sm py-1.5 px-3" onClick={() => setExportOpen((v) => !v)}>
            <i className="fa-regular fa-download mr-1.5" />Export <i className="fa-regular fa-chevron-down ml-1.5 text-xs" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => handleExport("xlsx")}>
                <i className="fa-regular fa-file-excel text-green-600 w-4" />Export do Excelu
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => handleExport("csv")}>
                <i className="fa-regular fa-file-csv text-blue-500 w-4" />Export do CSV
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-5">
        <input className="input w-full" placeholder="Hledat jméno, e-mail, telefon…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2">
          <select className="input flex-1" value={campFilter} onChange={(e) => setCampFilter(e.target.value)}>
            <option value="">Všechny objekty</option>
            {camps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input flex-1" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Všechny statusy</option>
            <option value="PENDING">Čeká</option>
            <option value="EXPIRED">Propadlá</option>
            <option value="CONFIRMED">Potvrzena</option>
            <option value="CANCELLED">Zrušena</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Příjezd od</label>
            <input className="input w-full" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Příjezd do</label>
            <input className="input w-full" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          {(dateFrom || dateTo) && (
            <button className="text-sm text-gray-400 hover:text-gray-700 pb-2 px-1" onClick={() => { setDateFrom(""); setDateTo(""); }}>
              <i className="fa-regular fa-xmark" />
            </button>
          )}
        </div>
      </div>

      {view === "list" ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
                <Th k="name">Jméno a příjmení</Th>
                <Th k="camp">Objekt</Th>
                <th className="px-4 py-3 font-medium">Typ</th>
                <Th k="checkIn">Příjezd</Th>
                <Th k="checkOut">Odjezd</Th>
                <Th k="persons" className="text-right">Os.</Th>
                <Th k="price" className="text-right">Cena</Th>
                <Th k="status">Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((r) => {
                const es = effectiveStatus(r);
                return (
                  <tr
                    key={r.id}
                    className={`cursor-pointer ${isOngoing(r) ? "bg-green-50 hover:bg-green-100" : es === "COMPLETED" || es === "CANCELLED" || es === "EXPIRED" ? "opacity-60 hover:bg-gray-50" : "hover:bg-gray-50"}`}
                    onClick={() => navigate(`/reservations/${r.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{langFlag(r.languageCode)} {r.firstName} {r.lastName}</p>
                          <p className="text-xs text-gray-400">{r.email}</p>
                        </div>
                        {(r.note || r.internalNote) && (
                          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                            {r.internalNote && <NotePopover note={r.internalNote} internal />}
                            {r.note && <NotePopover note={r.note} />}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.camp?.name}</td>
                    <td className="px-4 py-3">{(() => { const t = r.accommodationType; if (!t) return "—"; const tr = t.translations as Record<string, { name: string }>; return tr.cs?.name ?? tr[Object.keys(tr)[0]]?.name ?? "—"; })()}</td>
                    <td className="px-4 py-3">{format(new Date(r.checkIn), "d. M. yyyy", { locale: cs })}</td>
                    <td className="px-4 py-3">{format(new Date(r.checkOut), "d. M. yyyy", { locale: cs })}</td>
                    <td className="px-4 py-3 text-right">{r.adults}+{r.children}</td>
                    <td className="px-4 py-3 font-medium text-right">{formatPrice(r)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={STATUS_CLASS[es]}>{STATUS_LABEL[es]}</span>
                        {r.status === "PENDING" && es !== "EXPIRED" && can("reservations_edit") && (
                          <button
                            className="px-2 py-0.5 rounded text-xs bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                            onClick={(e) => handleConfirm(e, r.id)}
                          ><i className="fa-regular fa-check mr-1" />Potvrdit</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {reservations.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Žádné rezervace</td></tr>
              )}
            </tbody>
          </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination page={page} total={sorted.length} perPage={PER_PAGE} onChange={setPage} />
          </div>
        </div>
      ) : (
        <ReservationCalendar reservations={sorted} />
      )}
    </div>
  );
}
