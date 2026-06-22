import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { cs } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Reservation, Camp } from "@procamp/shared";
import { langFlag } from "../utils/langFlag";

const STATUS_LABEL: Record<string, string> = { PENDING: "Čeká", CONFIRMED: "Potvrzena", CANCELLED: "Zrušena" };
const STATUS_CLASS: Record<string, string> = { PENDING: "badge-pending", CONFIRMED: "badge-confirmed", CANCELLED: "badge-cancelled" };
const DAY_NAMES = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

interface Props {
  reservations: (Reservation & { camp?: Camp })[];
  showAllLink?: boolean;
  className?: string;
}

export default function ReservationCalendar({ reservations, showAllLink = false, className }: Props) {
  const navigate = useNavigate();
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const start = startOfMonth(month);
  const days = eachDayOfInterval({ start, end: endOfMonth(month) });
  const startOffset = (start.getDay() + 6) % 7;
  const cells: (Date | null)[] = [...Array(startOffset).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  const reservationsOnDay = (d: Date) =>
    reservations.filter((r) => {
      if (r.status === "CANCELLED") return false;
      const ci = new Date(r.checkIn); ci.setHours(0, 0, 0, 0);
      const co = new Date(r.checkOut); co.setHours(0, 0, 0, 0);
      const dd = new Date(d); dd.setHours(0, 0, 0, 0);
      return dd >= ci && dd < co;
    });

  const selectedReservations = selectedDay ? reservationsOnDay(selectedDay) : [];

  return (
    <div className={`card p-5 select-none${className ? ` ${className}` : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { setMonth(subMonths(month, 1)); setSelectedDay(null); }} className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded">
          <i className="fa-regular fa-chevron-left" />
        </button>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{format(month, "LLLL yyyy", { locale: cs })}</h3>
          {!isSameDay(startOfMonth(month), startOfMonth(new Date())) && (
            <button onClick={() => { setMonth(new Date()); setSelectedDay(new Date()); }} className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-1.5 py-0.5 rounded transition-colors">
              Dnes
            </button>
          )}
        </div>
        <button onClick={() => { setMonth(addMonths(month, 1)); setSelectedDay(null); }} className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded">
          <i className="fa-regular fa-chevron-right" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const count = reservationsOnDay(day).length;
          const today = isSameDay(day, new Date());
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          return (
            <div
              key={i}
              onClick={() => setSelectedDay(day)}
              className={`relative flex flex-col items-center text-sm rounded py-1.5 cursor-pointer transition-colors
                ${isSelected ? "bg-blue-600 text-white font-bold" : today ? "bg-blue-100 text-blue-700 font-bold" : count ? "hover:bg-green-100 text-gray-900" : "hover:bg-gray-50 text-gray-600"}
              `}
            >
              <span>{day.getDate()}</span>
              {count > 0 && (
                <span className={`text-[9px] font-semibold leading-none mt-0.5 ${isSelected ? "text-blue-200" : "text-green-600"}`}>{count}</span>
              )}
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-500 mb-2">{format(selectedDay, "d. MMMM yyyy", { locale: cs })}</p>
          {selectedReservations.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Žádné rezervace</p>
          ) : (
            <div className="space-y-1.5">
              {selectedReservations.map((r) => (
                <div
                  key={r.id}
                  onClick={() => navigate(`/reservations/${r.id}`)}
                  className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{langFlag(r.languageCode)} {r.firstName} {r.lastName}</p>
                    {r.camp && <p className="text-gray-400 truncate">{r.camp.name}</p>}
                  </div>
                  <span className={`${STATUS_CLASS[r.status]} flex-shrink-0`}>{STATUS_LABEL[r.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAllLink && (
        <button
          className="mt-3 w-full text-xs text-blue-600 hover:underline text-center"
          onClick={() => navigate("/reservations?view=calendar")}
        >
          Zobrazit všechny rezervace <i className="fa-regular fa-arrow-right ml-1" />
        </button>
      )}
    </div>
  );
}
