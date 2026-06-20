import { useTitle } from "../hooks/useTitle";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Reservation, Camp } from "@procamp/shared";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { cs } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { useOrg } from "../contexts/OrgContext";
import { langFlag } from "../utils/langFlag";

const STATUS_LABEL: Record<string, string> = { PENDING: "Čeká", CONFIRMED: "Potvrzena", CANCELLED: "Zrušena" };
const STATUS_CLASS: Record<string, string> = { PENDING: "badge-pending", CONFIRMED: "badge-confirmed", CANCELLED: "badge-cancelled" };
const DAY_NAMES = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

function MiniCalendar({ reservations }: { reservations: (Reservation & { camp: Camp })[] }) {
  const navigate = useNavigate();
  const [month, setMonth] = useState(new Date());
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });

  // offset: Mon=0
  const startOffset = (start.getDay() + 6) % 7;
  const cells: (Date | null)[] = [...Array(startOffset).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  const reservationsOnDay = (d: Date) =>
    reservations.filter((r) => {
      const ci = new Date(r.checkIn);
      const co = new Date(r.checkOut);
      return d >= ci && d < co;
    });

  const arrivals = (d: Date) =>
    reservations.filter((r) => isSameDay(new Date(r.checkIn), d));

  return (
    <div className="card p-5 select-none">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonth(subMonths(month, 1))} className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded"><i className="fa-regular fa-chevron-left" /></button>
        <h3 className="font-semibold text-gray-900">{format(month, "LLLL yyyy", { locale: cs })}</h3>
        <button onClick={() => setMonth(addMonths(month, 1))} className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded"><i className="fa-regular fa-chevron-right" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const staying = reservationsOnDay(day);
          const arriving = arrivals(day);
          const today = isSameDay(day, new Date());
          return (
            <div
              key={i}
              title={staying.length ? `${staying.length} rezervací` : undefined}
              className={`relative text-center text-sm rounded py-1.5 cursor-default transition-colors
                ${today ? "bg-blue-600 text-white font-bold" : ""}
                ${!today && staying.length ? "bg-green-50" : ""}
                ${!today && !staying.length ? "hover:bg-gray-50 text-gray-700" : ""}
              `}
            >
              {day.getDate()}
              {arriving.length > 0 && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
              )}
              {staying.length > 0 && !arriving.length && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> příjezd</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> pobyt</span>
      </div>
      <button
        className="mt-3 w-full text-xs text-blue-600 hover:underline text-center"
        onClick={() => navigate("/reservations?view=calendar")}
      >
        Zobrazit všechny rezervace <i className="fa-regular fa-arrow-right ml-1" />
      </button>
    </div>
  );
}

export default function DashboardPage() {
  useTitle("Dashboard");
  const navigate = useNavigate();
  const { selectedOrgId } = useOrg();
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
    if (!confirm("Opravdu chcete potvrdit tuto rezervaci?")) return;
    await api.patch(`/reservations/${id}/status`, { status: "CONFIRMED" });
    load();
  };

  const pending = reservations.filter((r) => r.status === "PENDING").length;
  const confirmed = reservations.filter((r) => r.status === "CONFIRMED").length;
  const recent = [...reservations].slice(0, 10);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="rounded-xl px-4 py-4 bg-blue-100 border border-blue-200">
          <p className="text-xs text-blue-600"><span className="hidden sm:inline">Celkem rezervací</span><span className="sm:hidden">Celkem</span></p>
          <p className="text-2xl font-bold mt-0.5 text-blue-800">{reservations.length}</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Poslední rezervace</h2>
            <Link to="/reservations?view=list" className="text-sm text-blue-600 hover:underline">Všechny <i className="fa-regular fa-arrow-right" /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Jméno a příjmení</th>
                  <th className="px-6 py-3 font-medium">Objekt</th>
                  <th className="px-6 py-3 font-medium">Příjezd</th>
                  <th className="px-6 py-3 font-medium">Odjezd</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/reservations/${r.id}`)}
                  >
                    <td className="px-6 py-3 font-medium text-gray-900">{langFlag(r.languageCode)} {r.firstName} {r.lastName}</td>
                    <td className="px-6 py-3 text-gray-600">{r.camp?.name ?? "-"}</td>
                    <td className="px-6 py-3">{format(new Date(r.checkIn), "d. M. yyyy", { locale: cs })}</td>
                    <td className="px-6 py-3">{format(new Date(r.checkOut), "d. M. yyyy", { locale: cs })}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className={STATUS_CLASS[r.status]}>{STATUS_LABEL[r.status]}</span>
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
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Žádné rezervace</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <MiniCalendar reservations={reservations} />
      </div>
    </div>
  );
}
