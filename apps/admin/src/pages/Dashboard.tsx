import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Reservation, Camp } from "@procamp/shared";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { Link } from "react-router-dom";

const STATUS_LABEL: Record<string, string> = { PENDING: "Čeká", CONFIRMED: "Potvrzena", CANCELLED: "Zrušena" };
const STATUS_CLASS: Record<string, string> = { PENDING: "badge-pending", CONFIRMED: "badge-confirmed", CANCELLED: "badge-cancelled" };

export default function DashboardPage() {
  const [reservations, setReservations] = useState<(Reservation & { camp: Camp })[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);

  useEffect(() => {
    api.get("/reservations").then((r) => setReservations(r.data)).catch(() => {});
    api.get("/camps").then((r) => setCamps(r.data)).catch(() => {});
  }, []);

  const pending = reservations.filter((r) => r.status === "PENDING").length;
  const confirmed = reservations.filter((r) => r.status === "CONFIRMED").length;
  const recent = [...reservations].slice(0, 10);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Přehled</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-sm text-gray-500">Celkem rezervací</p>
          <p className="text-3xl font-bold mt-1">{reservations.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Čekajících</p>
          <p className="text-3xl font-bold mt-1 text-yellow-600">{pending}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Potvrzených</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{confirmed}</p>
        </div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Poslední rezervace</h2>
          <Link to="/reservations" className="text-sm text-blue-600 hover:underline">Všechny →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Jméno</th>
                <th className="px-6 py-3 font-medium">Kemp</th>
                <th className="px-6 py-3 font-medium">Příjezd</th>
                <th className="px-6 py-3 font-medium">Odjezd</th>
                <th className="px-6 py-3 font-medium">Cena</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link to={`/reservations/${r.id}`} className="font-medium text-blue-600 hover:underline">
                      {r.firstName} {r.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{r.camp?.name ?? "-"}</td>
                  <td className="px-6 py-3">{format(new Date(r.checkIn), "d. M. yyyy", { locale: cs })}</td>
                  <td className="px-6 py-3">{format(new Date(r.checkOut), "d. M. yyyy", { locale: cs })}</td>
                  <td className="px-6 py-3 font-medium">{r.totalPrice} Kč</td>
                  <td className="px-6 py-3">
                    <span className={STATUS_CLASS[r.status]}>{STATUS_LABEL[r.status]}</span>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Žádné rezervace</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
