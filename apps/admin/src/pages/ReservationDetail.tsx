import { useTitle } from "../hooks/useTitle";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { Reservation, Camp, AccommodationType } from "@procamp/shared";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths } from "date-fns";
import { cs } from "date-fns/locale";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { langFlag } from "../utils/langFlag";
import { ARRIVAL_TIMES } from "../utils/arrivalTimes";

const STATUS_LABEL: Record<string, string> = { PENDING: "Čeká na potvrzení", CONFIRMED: "Potvrzena", CANCELLED: "Zrušena" };
const STATUS_CLASS: Record<string, string> = { PENDING: "badge-pending", CONFIRMED: "badge-confirmed", CANCELLED: "badge-cancelled" };
export default function ReservationDetailPage() {
  useTitle("Detail rezervace");
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const toast = useToast();
  const [reservation, setReservation] = useState<(Reservation & { camp: Camp }) | null>(null);
  const [campTypes, setCampTypes] = useState<AccommodationType[]>([]);
  const [languages, setLanguages] = useState<{ code: string; currencySymbol: string; currencyPosition: string }[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setEditing(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  const load = async () => {
    const res = await api.get(`/reservations/${id}`).catch(() => null);
    if (!res) return;
    setReservation(res.data);
    const campId = res.data.campId;
    if (campId) {
      api.get(`/camps/${campId}/accommodation-types`).then((r) => setCampTypes(r.data)).catch(() => {});
    }
    api.get("/languages").then((r) => setLanguages(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, [id]);

  const formatPrice = (amount: number, langCode: string) => {
    const lang = languages.find((l) => l.code === langCode);
    const formatted = amount.toLocaleString("cs-CZ");
    if (!lang) return `${formatted} Kč`;
    return lang.currencyPosition === "before" ? `${lang.currencySymbol}${formatted}` : `${formatted} ${lang.currencySymbol}`;
  };

  const STATUS_TOAST: Record<string, string> = {
    CONFIRMED: "Rezervace byla potvrzena.",
    CANCELLED: "Rezervace byla zrušena.",
    PENDING: "Rezervace obnovena jako čekající.",
  };

  const startEdit = () => {
    if (!reservation) return;
    setEditForm({
      firstName: reservation.firstName,
      lastName: reservation.lastName,
      email: reservation.email,
      phone: reservation.phone,
      accommodationTypeId: reservation.accommodationTypeId,
      checkIn: new Date(reservation.checkIn).toISOString().slice(0, 10),
      checkOut: new Date(reservation.checkOut).toISOString().slice(0, 10),
      adults: String(reservation.adults),
      children: String(reservation.children),
      licensePlate: reservation.licensePlate ?? "",
      expectedArrival: reservation.expectedArrival ?? "",
      note: reservation.note ?? "",
    });
    setEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/reservations/${id}`, {
        ...editForm,
        adults: Number(editForm.adults),
        children: Number(editForm.children),
      });
      toast.success("Rezervace byla upravena.");
      setEditing(false);
      load();
    } catch {
      toast.error("Nepodařilo se uložit změny.");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Opravdu smazat rezervaci ${reservation?.firstName} ${reservation?.lastName}? Tato akce je nevratná.`)) return;
    try {
      await api.delete(`/reservations/${id}`);
      toast.success("Rezervace byla smazána.");
      window.history.back();
    } catch {
      toast.error("Nepodařilo se smazat rezervaci.");
    }
  };

  const setStatus = async (status: string) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status });
      toast.success(STATUS_TOAST[status] ?? "Status byl změněn.");
      load();
    } catch {
      toast.error("Nepodařilo se změnit status rezervace.");
    }
  };

  if (!reservation) return <div className="p-8 text-gray-500">Načítám…</div>;

  const checkIn = new Date(reservation.checkIn);
  const checkOut = new Date(reservation.checkOut);
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);

  // Build calendar months spanning the stay
  const months: Date[][] = [];
  let cur = startOfMonth(checkIn);
  const lastMonth = startOfMonth(checkOut);
  while (cur <= lastMonth) {
    const days = eachDayOfInterval({ start: startOfMonth(cur), end: endOfMonth(cur) });
    months.push(days);
    cur = addMonths(cur, 1);
  }
  const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
  const DAY_NAMES = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
  const isStay = (d: Date) => d >= checkIn && d < checkOut;
  const isArrival = (d: Date) => isSameDay(d, checkIn);
  const isDeparture = (d: Date) => isSameDay(d, checkOut);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link to="/reservations" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600"><i className="fa-regular fa-arrow-left" /> Rezervace</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{langFlag(reservation.languageCode)} {reservation.firstName} {reservation.lastName}</span>
        <span className={STATUS_CLASS[reservation.status]}>{STATUS_LABEL[reservation.status]}</span>
        <span className="text-xs text-gray-400 sm:ml-auto">Vytvořeno {format(new Date(reservation.createdAt), "d. M. yyyy HH:mm", { locale: cs })}</span>
      </div>

      {can("reservations_edit") && (
        <div className="flex flex-wrap gap-2 mb-4">
          {reservation.status !== "CONFIRMED" && (
            <button className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors" onClick={() => setStatus("CONFIRMED")}><i className="fa-regular fa-check mr-1.5" />Potvrdit</button>
          )}
          {reservation.status !== "CANCELLED" && (
            <button className="btn-danger" onClick={() => { if (confirm("Opravdu zrušit?")) setStatus("CANCELLED"); }}><i className="fa-regular fa-ban mr-1.5" />Zrušit</button>
          )}
          {reservation.status === "CANCELLED" && (
            <button className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium transition-colors" onClick={() => setStatus("PENDING")}><i className="fa-regular fa-rotate-left mr-1.5" />Obnovit jako čekající</button>
          )}
          <button className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium transition-colors ml-auto" onClick={startEdit}><i className="fa-regular fa-pen mr-1.5" />Upravit</button>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-12" onClick={() => setEditing(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Upravit rezervaci</h2>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-700"><i className="fa-regular fa-xmark text-lg" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Kontakt</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="label">Jméno</label><input className="input" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required /></div>
                  <div><label className="label">Příjmení</label><input className="input" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} required /></div>
                  <div><label className="label">E-mail</label><input className="input" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required /></div>
                  <div><label className="label">Telefon</label><input className="input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required /></div>
                </div>
              </div>

              <hr />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ubytování</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Typ ubytování</label>
                    <select className="input" value={editForm.accommodationTypeId} onChange={(e) => setEditForm({ ...editForm, accommodationTypeId: e.target.value })}>
                      {campTypes.map((t) => {
                        const tr = t.translations as Record<string, { name: string }>;
                        const name = tr.cs?.name ?? tr[Object.keys(tr)[0]]?.name ?? t.id;
                        return <option key={t.id} value={t.id}>{name}</option>;
                      })}
                    </select>
                  </div>
                  <div><label className="label">SPZ</label><input className="input" value={editForm.licensePlate} onChange={(e) => setEditForm({ ...editForm, licensePlate: e.target.value })} /></div>
                  <div><label className="label">Příjezd</label><input className="input" type="date" value={editForm.checkIn} onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })} required /></div>
                  <div><label className="label">Odjezd</label><input className="input" type="date" value={editForm.checkOut} onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })} required /></div>
                  <div><label className="label">Dospělí</label><input className="input" type="number" min="1" value={editForm.adults} onChange={(e) => setEditForm({ ...editForm, adults: e.target.value })} required /></div>
                  <div><label className="label">Děti</label><input className="input" type="number" min="0" value={editForm.children} onChange={(e) => setEditForm({ ...editForm, children: e.target.value })} required /></div>
                  <div>
                    <label className="label">Předpokládaný příjezd</label>
                    <select className="input" value={editForm.expectedArrival} onChange={(e) => setEditForm({ ...editForm, expectedArrival: e.target.value })}>
                      <option value="">— nevím —</option>
                      {ARRIVAL_TIMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <hr />
              <div>
                <label className="label">Poznámka</label>
                <textarea className="input" rows={3} value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} />
              </div>

              <div className="flex gap-2 pt-2">
                <button className="btn-primary" type="submit"><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit změny</button>
                <button className="btn-secondary" type="button" onClick={() => setEditing(false)}><i className="fa-regular fa-xmark mr-1.5" />Zrušit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-4">

        {/* Levý sloupec: kalendář + cena */}
        <div className="card p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Celková cena</p>
            <p className="text-3xl font-bold text-gray-900">{formatPrice(reservation.totalPrice, reservation.languageCode)}</p>
            <p className="text-sm text-gray-400">Platba na místě</p>
          </div>
          <hr />
          <div>
            <div className="flex flex-wrap gap-6">
              {months.map((days, mi) => {
                const firstDay = days[0];
                const offset = (firstDay.getDay() + 6) % 7;
                const cells: (Date | null)[] = [...Array(offset).fill(null), ...days];
                while (cells.length % 7 !== 0) cells.push(null);
                return (
                  <div key={mi} className="w-full">
                    <p className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                      {format(firstDay, "LLLL yyyy", { locale: cs })}
                    </p>
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {DAY_NAMES.map((d) => (
                        <div key={d} className="text-center text-xs text-gray-400 py-0.5">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {cells.map((day, i) => {
                        if (!day) return <div key={i} />;
                        const arrival = isArrival(day);
                        const departure = isDeparture(day);
                        const stay = isStay(day);
                        return (
                          <div
                            key={i}
                            className={`text-center text-xs py-1.5 rounded font-medium
                              ${arrival ? "bg-green-500 text-white" : ""}
                              ${departure ? "bg-red-400 text-white" : ""}
                              ${stay && !arrival && !departure ? "bg-blue-100 text-blue-800" : ""}
                              ${!stay && !arrival && !departure ? "text-gray-500" : ""}
                              ${isSameDay(day, todayDate) ? "ring-2 ring-gray-900" : ""}
                            `}
                          >
                            <span className={isSameDay(day, todayDate) ? "font-bold text-gray-900" : ""}>{day.getDate()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> příjezd</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 inline-block" /> pobyt</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> odjezd</span>
            </div>
          </div>
        </div>

        {/* Pravý sloupec: kontakt + ubytování */}
        <div className="flex flex-col gap-4">
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Kontakt</h2>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div><dt className="text-gray-500">Jméno a příjmení</dt><dd className="font-medium">{langFlag(reservation.languageCode)} {reservation.firstName} {reservation.lastName}</dd></div>
              <div><dt className="text-gray-500">E-mail</dt><dd className="font-medium"><a href={`mailto:${reservation.email}`} className="text-blue-600">{reservation.email}</a></dd></div>
              <div><dt className="text-gray-500">Telefon</dt><dd className="font-medium"><a href={`tel:${reservation.phone}`} className="text-blue-600">{reservation.phone}</a></dd></div>
              <div><dt className="text-gray-500">SPZ</dt><dd className={reservation.licensePlate ? "font-medium" : "text-gray-400 italic"}>{reservation.licensePlate || "nevyplněno"}</dd></div>
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold mb-4">Ubytování</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-500">Objekt</dt><dd className="font-medium">{reservation.camp?.name}</dd></div>
              <div><dt className="text-gray-500">Typ</dt><dd className="font-medium">{(() => { const t = reservation.accommodationType; if (!t) return "—"; const tr = t.translations as Record<string, { name: string }>; return tr.cs?.name ?? tr[Object.keys(tr)[0]]?.name ?? "—"; })()}</dd></div>
              <div><dt className="text-gray-500">Příjezd</dt><dd className="font-medium">{format(checkIn, "d. MMMM yyyy", { locale: cs })}</dd></div>
              <div><dt className="text-gray-500">Odjezd</dt><dd className="font-medium">{format(checkOut, "d. MMMM yyyy", { locale: cs })}</dd></div>
              <div><dt className="text-gray-500">Počet nocí</dt><dd className="font-medium">{nights}</dd></div>
              <div><dt className="text-gray-500">Osoby</dt><dd className="font-medium">{reservation.adults} dospělí, {reservation.children} děti</dd></div>
              <div className="col-span-2"><dt className="text-gray-500">Předpokládaný příjezd</dt><dd className={reservation.expectedArrival ? "font-medium" : "text-gray-400 italic"}>{reservation.expectedArrival || "nevyplněno"}</dd></div>
              {reservation.note
                ? <div className="col-span-2 mt-1 p-3 bg-amber-50 border border-amber-200 rounded-xl"><dt className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1"><i className="fa-regular fa-message-exclamation mr-1.5" />Poznámka</dt><dd className="text-sm font-medium text-amber-900">{reservation.note}</dd></div>
                : <div className="col-span-2"><dt className="text-gray-500">Poznámka</dt><dd className="text-gray-400 italic">nevyplněno</dd></div>
              }
            </dl>
          </div>
        </div>

      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-400">ID: {reservation.id}</p>
        {can("reservations_delete") && (
          <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 transition-colors">
            <i className="fa-regular fa-trash mr-1" />Smazat rezervaci
          </button>
        )}
      </div>
    </div>
  );
}
