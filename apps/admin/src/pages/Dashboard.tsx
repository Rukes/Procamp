import { useTitle } from "../hooks/useTitle";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { Reservation, Camp } from "@procamp/shared";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useOrg } from "../contexts/OrgContext";
import { Flag } from "../utils/langFlag";
import ReservationCalendar from "../components/ReservationCalendar";
import { MotdBannerDashboard } from "../components/MotdBanner";
import ReservationModal from "../components/ReservationModal";

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
      const popW = 256; const margin = 8;
      let left = rect.left + rect.width / 2 - popW / 2;
      if (left < margin) left = margin;
      if (left + popW > window.innerWidth - margin) left = window.innerWidth - popW - margin;
      setPos({ top: rect.bottom + 6, left });
    }
    setOpen((v) => !v);
  };
  return (
    <div data-note-popover className="relative flex-shrink-0" onMouseEnter={(e) => { if (window.matchMedia("(hover: hover)").matches) handleOpen(e as unknown as React.MouseEvent); }} onMouseLeave={() => { if (window.matchMedia("(hover: hover)").matches) setOpen(false); }}>
      <button ref={btnRef} type="button" onClick={handleOpen} className={internal ? "text-red-500 hover:text-red-600 transition-colors" : "text-amber-500 hover:text-amber-600 transition-colors"}>
        <i className={internal ? "fa-solid fa-note" : "fa-regular fa-message-lines"} />
      </button>
      {open && (
        <div className="fixed z-50 w-64 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl" style={{ top: pos.top, left: pos.left }}>{note}</div>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = { PENDING: "Čeká", CONFIRMED: "Potvrzena", CANCELLED: "Zrušena" };
const STATUS_CLASS: Record<string, string> = { PENDING: "badge-pending", CONFIRMED: "badge-confirmed", CANCELLED: "badge-cancelled" };
function isOngoing(r: { status: string; checkIn: string; checkOut: string }): boolean {
  if (r.status !== "CONFIRMED") return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(r.checkIn) <= today && new Date(r.checkOut) > today;
}

export default function DashboardPage() {
  useTitle("Dashboard");
  const { selectedOrgId } = useOrg();
  const [modalId, setModalId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<(Reservation & { camp: Camp })[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);

  const load = () => {
    api.get("/reservations").then((r) => setReservations(r.data)).catch(() => {});
    api.get("/camps").then((r) => setCamps(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, [selectedOrgId]);

  const getCampOccupancy = (camp: Camp) => {
    const total = (camp.accommodationTypes ?? []).reduce((s, t) => s + t.capacity, 0);
    if (total === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const active = reservations.filter((r) => {
      if (r.campId !== camp.id || r.status === "CANCELLED") return false;
      const ci = new Date(r.checkIn);
      const co = new Date(r.checkOut);
      return ci <= today && co > today;
    }).length;
    return Math.min(100, Math.round((active / total) * 100));
  };

  const handleConfirm = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Opravdu chcete potvrdit tuto rezervaci včetně odeslání potvrzení?")) return;
    await api.patch(`/reservations/${id}/status`, { status: "CONFIRMED" });
    load();
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const active = reservations.filter((r) => r.status !== "CANCELLED" && new Date(r.checkOut) > today);
  const pending = active.filter((r) => r.status === "PENDING").length;
  const confirmed = active.filter((r) => r.status === "CONFIRMED").length;
  const recent = active.slice(0, 10);

  return (
    <div className="p-4 md:p-8">
      <MotdBannerDashboard />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-3 mb-8 max-w-lg">
        <div className="rounded-xl px-4 py-4 bg-blue-100 border border-blue-200">
          <p className="text-xs text-blue-600"><span className="hidden sm:inline">Celkem rezervací</span><span className="sm:hidden">Celkem</span></p>
          <p className="text-2xl font-bold mt-0.5 text-blue-800">{active.length}</p>
        </div>
        <div className="rounded-xl px-4 py-4 bg-yellow-100 border border-yellow-200">
          <p className="text-xs text-yellow-700">Čekajících</p>
          <p className="text-2xl font-bold mt-0.5 text-yellow-800">{pending}</p>
        </div>
        <div className="rounded-xl px-4 py-4 bg-green-100 border border-green-200">
          <p className="text-xs text-green-700">Potvrzených</p>
          <p className="text-2xl font-bold mt-0.5 text-green-800">{confirmed}</p>
        </div>
      </div>

      {/* Aktuální vytíženost */}
      {camps.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Aktuální vytíženost</h2>
          <div className="space-y-3">
            {camps.map((camp) => {
              const pct = getCampOccupancy(camp);
              const total = (camp.accommodationTypes ?? []).reduce((s, t) => s + t.capacity, 0);
              return (
                <div key={camp.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{camp.name}</span>
                    <span className="text-gray-500">{pct} % <span className="text-xs text-gray-400">({total} míst celkem)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-yellow-400" : "bg-green-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Split: seznam vlevo, kalendář vpravo — na mobile pod sebou */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

        <div className="card order-1 lg:order-2">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Poslední rezervace</h2>
            <Link to="/reservations?view=list" className="text-sm text-blue-600 hover:underline">Všechny <i className="fa-regular fa-arrow-right" /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
                  <th className="px-4 py-3 font-medium">Kód</th>
                  <th className="px-4 py-3 font-medium">Jméno a příjmení</th>
                  <th className="px-4 py-3 font-medium">Objekt</th>
                  <th className="px-4 py-3 font-medium">Typ</th>
                  <th className="px-4 py-3 font-medium">Příjezd</th>
                  <th className="px-4 py-3 font-medium">Odjezd</th>
                  <th className="px-4 py-3 font-medium text-right">Os.</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setModalId(r.id)}
                  >
                    <td className="px-4 py-3"><span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{r.bookingCode ?? "—"}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900"><Flag code={r.languageCode} className="mr-1" /> {r.firstName} {r.lastName}</p>
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
                    <td className="px-4 py-3 text-gray-600">{r.camp?.name ?? "—"}</td>
                    <td className="px-4 py-3">{(() => { const t = r.accommodationType; if (!t) return "—"; const tr = t.translations as Record<string, { name: string }>; return tr.cs?.name ?? tr[Object.keys(tr)[0]]?.name ?? "—"; })()}</td>
                    <td className="px-4 py-3">{format(new Date(r.checkIn), "d. M. yyyy", { locale: cs })}</td>
                    <td className="px-4 py-3">{format(new Date(r.checkOut), "d. M. yyyy", { locale: cs })}</td>
                    <td className="px-4 py-3 text-right">{r.adults}+{r.children}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={STATUS_CLASS[r.status]}>{STATUS_LABEL[r.status]}</span>
                        {isOngoing(r) && <span className="badge bg-blue-100 text-blue-700">Probíhá</span>}
                        {r.status === "PENDING" && (
                          <button
                            className="px-2 py-0.5 rounded text-xs bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                            onClick={(e) => handleConfirm(e, r.id)}
                          ><i className="fa-regular fa-check mr-1" />Potvrdit</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Žádné rezervace</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <ReservationCalendar reservations={reservations} showAllLink className="order-2 lg:order-1" onReservationClick={setModalId} />
      </div>
      <ReservationModal reservationId={modalId} onClose={() => setModalId(null)} onChanged={load} />
    </div>
  );
}
