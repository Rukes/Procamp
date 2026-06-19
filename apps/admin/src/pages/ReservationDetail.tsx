import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { Reservation, Camp } from "@procamp/shared";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useAuth } from "../contexts/AuthContext";

const STATUS_LABEL: Record<string, string> = { PENDING: "Čeká na potvrzení", CONFIRMED: "Potvrzena", CANCELLED: "Zrušena" };
const STATUS_CLASS: Record<string, string> = { PENDING: "badge-pending", CONFIRMED: "badge-confirmed", CANCELLED: "badge-cancelled" };
const TYPE_LABEL: Record<string, string> = { CARAVAN: "Karavan", TENT: "Stan" };

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const [reservation, setReservation] = useState<(Reservation & { camp: Camp }) | null>(null);

  const load = () => api.get(`/reservations/${id}`).then((r) => setReservation(r.data)).catch(() => {});
  useEffect(() => { load(); }, [id]);

  const setStatus = async (status: string) => {
    await api.patch(`/reservations/${id}/status`, { status });
    load();
  };

  if (!reservation) return <div className="p-8 text-gray-500">Načítám…</div>;

  const nights = Math.round(
    (new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / 86400000,
  );

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/reservations" className="text-gray-400 hover:text-gray-600">← Rezervace</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{reservation.firstName} {reservation.lastName}</span>
        <span className={STATUS_CLASS[reservation.status]}>{STATUS_LABEL[reservation.status]}</span>
      </div>

      <div className="grid gap-4">
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Ubytování</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-gray-500">Kemp</dt><dd className="font-medium">{reservation.camp?.name}</dd></div>
            <div><dt className="text-gray-500">Typ</dt><dd className="font-medium">{TYPE_LABEL[reservation.accommodationType]}</dd></div>
            <div><dt className="text-gray-500">Příjezd</dt><dd className="font-medium">{format(new Date(reservation.checkIn), "d. MMMM yyyy", { locale: cs })}</dd></div>
            <div><dt className="text-gray-500">Odjezd</dt><dd className="font-medium">{format(new Date(reservation.checkOut), "d. MMMM yyyy", { locale: cs })}</dd></div>
            <div><dt className="text-gray-500">Počet nocí</dt><dd className="font-medium">{nights}</dd></div>
            <div><dt className="text-gray-500">Osoby</dt><dd className="font-medium">{reservation.adults} dospělí, {reservation.children} děti</dd></div>
            {reservation.expectedArrival && <div><dt className="text-gray-500">Předpokládaný příjezd</dt><dd className="font-medium">{reservation.expectedArrival}</dd></div>}
            {reservation.note && <div className="col-span-2"><dt className="text-gray-500">Poznámka</dt><dd className="font-medium">{reservation.note}</dd></div>}
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold mb-4">Kontakt</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-gray-500">Jméno</dt><dd className="font-medium">{reservation.firstName} {reservation.lastName}</dd></div>
            <div><dt className="text-gray-500">E-mail</dt><dd className="font-medium"><a href={`mailto:${reservation.email}`} className="text-blue-600">{reservation.email}</a></dd></div>
            <div><dt className="text-gray-500">Telefon</dt><dd className="font-medium"><a href={`tel:${reservation.phone}`} className="text-blue-600">{reservation.phone}</a></dd></div>
            {reservation.licensePlate && <div><dt className="text-gray-500">SPZ</dt><dd className="font-medium">{reservation.licensePlate}</dd></div>}
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold mb-4">Cena</h2>
          <p className="text-3xl font-bold text-gray-900">{reservation.totalPrice} Kč</p>
          <p className="text-sm text-gray-500 mt-1">Platba na místě</p>
        </div>

        {can("reservations_edit") && (
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Akce</h2>
            <div className="flex gap-2">
              {reservation.status !== "CONFIRMED" && (
                <button className="btn-primary" onClick={() => setStatus("CONFIRMED")}>✓ Potvrdit rezervaci</button>
              )}
              {reservation.status !== "CANCELLED" && (
                <button className="btn-danger" onClick={() => { if (confirm("Opravdu zrušit?")) setStatus("CANCELLED"); }}>Zrušit rezervaci</button>
              )}
              {reservation.status === "CANCELLED" && (
                <button className="btn-secondary" onClick={() => setStatus("PENDING")}>Obnovit jako čekající</button>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">ID: {reservation.id} · Vytvořeno: {format(new Date(reservation.createdAt), "d. M. yyyy HH:mm", { locale: cs })}</p>
    </div>
  );
}
