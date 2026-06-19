import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Reservation, Camp } from "@procamp/shared";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useAuth } from "../contexts/AuthContext";

const STATUS_LABEL: Record<string, string> = { PENDING: "Čeká", CONFIRMED: "Potvrzena", CANCELLED: "Zrušena" };
const STATUS_CLASS: Record<string, string> = { PENDING: "badge-pending", CONFIRMED: "badge-confirmed", CANCELLED: "badge-cancelled" };
const TYPE_LABEL: Record<string, string> = { CARAVAN: "Karavan", TENT: "Stan" };

export default function ReservationsPage() {
  const { can } = useAuth();
  const [reservations, setReservations] = useState<(Reservation & { camp: Camp })[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [search, setSearch] = useState("");
  const [campFilter, setCampFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");

  const load = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (campFilter) params.set("campId", campFilter);
    if (statusFilter) params.set("status", statusFilter);
    api.get(`/reservations?${params}`).then((r) => setReservations(r.data)).catch(() => {});
  };

  useEffect(() => {
    api.get("/camps").then((r) => setCamps(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [search, campFilter, statusFilter]);

  const handleExport = () => {
    const params = campFilter ? `?campId=${campFilter}` : "";
    window.open(`/api/reservations/export/csv${params}`, "_blank");
  };

  // Calendar: group by month
  const today = new Date();
  const calDays: Date[] = [];
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) calDays.push(new Date(d));

  const getReservationsForDay = (day: Date) =>
    reservations.filter((r) => {
      const ci = new Date(r.checkIn);
      const co = new Date(r.checkOut);
      return ci <= day && co > day;
    });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rezervace</h1>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handleExport}>↓ Export CSV</button>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button onClick={() => setView("list")} className={`px-3 py-1.5 text-sm ${view === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}>Seznam</button>
            <button onClick={() => setView("calendar")} className={`px-3 py-1.5 text-sm ${view === "calendar" ? "bg-blue-600 text-white" : "bg-white text-gray-600"}`}>Kalendář</button>
          </div>
          {can("reservations_create") && <Link to="/reservations/new" className="btn-primary">+ Nová</Link>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input className="input max-w-xs" placeholder="Hledat jméno, e-mail, telefon…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-48" value={campFilter} onChange={(e) => setCampFilter(e.target.value)}>
          <option value="">Všechny kempy</option>
          {camps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input max-w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Všechny statusy</option>
          <option value="PENDING">Čeká</option>
          <option value="CONFIRMED">Potvrzena</option>
          <option value="CANCELLED">Zrušena</option>
        </select>
      </div>

      {view === "list" ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500 bg-gray-50">
                <th className="px-4 py-3 font-medium">Jméno</th>
                <th className="px-4 py-3 font-medium">Kemp</th>
                <th className="px-4 py-3 font-medium">Typ</th>
                <th className="px-4 py-3 font-medium">Příjezd</th>
                <th className="px-4 py-3 font-medium">Odjezd</th>
                <th className="px-4 py-3 font-medium">Os.</th>
                <th className="px-4 py-3 font-medium">Cena</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/reservations/${r.id}`} className="font-medium text-blue-600 hover:underline">
                      {r.firstName} {r.lastName}
                    </Link>
                    <p className="text-xs text-gray-400">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.camp?.name}</td>
                  <td className="px-4 py-3">{TYPE_LABEL[r.accommodationType]}</td>
                  <td className="px-4 py-3">{format(new Date(r.checkIn), "d. M. yyyy", { locale: cs })}</td>
                  <td className="px-4 py-3">{format(new Date(r.checkOut), "d. M. yyyy", { locale: cs })}</td>
                  <td className="px-4 py-3">{r.adults}+{r.children}</td>
                  <td className="px-4 py-3 font-medium">{r.totalPrice} Kč</td>
                  <td className="px-4 py-3"><span className={STATUS_CLASS[r.status]}>{STATUS_LABEL[r.status]}</span></td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Žádné rezervace</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-6">
          <h2 className="font-semibold mb-4">{format(today, "MMMM yyyy", { locale: cs })}</h2>
          <div className="grid grid-cols-7 gap-1">
            {["Po", "Út", "St", "Čt", "Pá", "So", "Ne"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
            ))}
            {Array.from({ length: (start.getDay() || 7) - 1 }).map((_, i) => <div key={`e${i}`} />)}
            {calDays.map((day) => {
              const dayRes = getReservationsForDay(day);
              const isToday = day.toDateString() === today.toDateString();
              return (
                <div key={day.toISOString()} className={`min-h-16 p-1.5 rounded-lg border text-xs ${isToday ? "border-blue-400 bg-blue-50" : "border-gray-100"}`}>
                  <span className={`font-medium ${isToday ? "text-blue-600" : "text-gray-700"}`}>{day.getDate()}</span>
                  {dayRes.slice(0, 2).map((r) => (
                    <Link key={r.id} to={`/reservations/${r.id}`} className="block mt-0.5 truncate bg-blue-100 text-blue-700 rounded px-1">
                      {r.firstName} {r.lastName[0]}.
                    </Link>
                  ))}
                  {dayRes.length > 2 && <span className="text-gray-400">+{dayRes.length - 2} více</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
