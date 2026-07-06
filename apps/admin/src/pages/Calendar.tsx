import { useEffect, useRef, useState } from "react";
import { useTitle } from "../hooks/useTitle";
import { api } from "../api/client";
import ReservationModal from "../components/ReservationModal";
import { getDaysInMonth, format, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { cs } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { Flag } from "../utils/langFlag";

interface AccType { id: string; translations: Record<string, { name: string }> }
interface TimelineReservation {
  id: string; bookingCode?: string | null;
  firstName: string; lastName: string;
  checkIn: string; checkOut: string;
  status: string; accommodationTypeId: string; languageCode: string;
}
interface BlockedPeriod {
  id: string; reason: string;
  dateFrom: string; dateTo: string;
  accommodationTypeId: string | null;
}
interface Camp { id: string; name: string }

const DAY_NAMES = ["ne","po","út","st","čt","pá","so"];
const MONTH_NAMES = ["Leden","Únor","Březen","Duben","Květen","Červen","Červenec","Srpen","Září","Říjen","Listopad","Prosinec"];

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  PENDING:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  CANCELLED: "bg-gray-100 text-gray-400 border-gray-200",
};

function typeName(type: AccType): string {
  const t = type.translations as Record<string, { name: string }>;
  return t?.cs?.name || t?.en?.name || Object.values(t)?.[0]?.name || "–";
}

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Potvrzena",
  PENDING:   "Čeká na potvrzení",
  CANCELLED: "Zrušena",
};

const CELL_W = 38;
const UNIT_COL_W = 150;

interface PopoverState {
  block: { id: string; label: string; languageCode?: string; status?: string; checkIn?: string; checkOut?: string; bookingCode?: string | null };
  top: number; left: number;
}

interface BlockingPopoverState {
  id: string; reason: string; dateFrom: string; dateTo: string;
  top: number; left: number;
}

interface BlockingDetail {
  id: string;
  reason: string;
  internalNote: string | null;
  dateFrom: string;
  dateTo: string;
  source: string;
  camp: { name: string };
  accommodationType: { translations: Record<string, { name: string }> } | null;
}

function BlockingModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [data, setData] = useState<BlockingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/blocked-periods/${id}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [id]);

  const typeName = (at: BlockingDetail["accommodationType"]) => {
    if (!at) return null;
    const t = at.translations;
    return t?.cs?.name || t?.en?.name || Object.values(t)?.[0]?.name || null;
  };

  const nights = data ? Math.round((new Date(data.dateTo).getTime() - new Date(data.dateFrom).getTime()) / 86400000) : null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-8 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mb-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-8 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <i className="fa-regular fa-calendar-xmark text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Detail blokace</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">
          {loading && <p className="text-sm text-gray-400 text-center py-6"><i className="fa-regular fa-spinner animate-spin mr-2" />Načítám…</p>}
          {!loading && !data && <p className="text-sm text-red-500 text-center py-6">Nepodařilo se načíst blokaci.</p>}
          {data && (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Důvod</dt>
                <dd className="font-medium text-gray-900">{data.reason || "—"}</dd>
              </div>
              {data.internalNote && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Interní poznámka</dt>
                  <dd className="text-gray-700">{data.internalNote}</dd>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Od</dt>
                  <dd className="text-gray-800">{format(new Date(data.dateFrom), "d. M. yyyy", { locale: cs })}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Do</dt>
                  <dd className="text-gray-800">{format(new Date(data.dateTo), "d. M. yyyy", { locale: cs })}</dd>
                </div>
              </div>
              {nights !== null && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Délka</dt>
                  <dd className="text-gray-800">{nights} {nights === 1 ? "den" : nights < 5 ? "dny" : "dní"}</dd>
                </div>
              )}
              {data.accommodationType && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Ubytovací jednotka</dt>
                  <dd className="text-gray-800">{typeName(data.accommodationType) ?? "Všechny"}</dd>
                </div>
              )}
              {!data.accommodationType && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Platí pro</dt>
                  <dd className="text-gray-800">Všechny jednotky</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Objekt</dt>
                <dd className="text-gray-800">{data.camp.name}</dd>
              </div>
              {data.source && data.source !== "MANUAL" && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Zdroj</dt>
                  <dd className="text-gray-600 font-mono text-xs">{data.source}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockingPopover({ state, onClose, onOpen }: {
  state: BlockingPopoverState;
  onClose: () => void;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [finalLeft, setFinalLeft] = useState(state.left);
  useEffect(() => {
    if (!ref.current) return;
    const w = ref.current.offsetWidth;
    setFinalLeft(Math.min(Math.max(state.left, 8), window.innerWidth - w - 8));
  }, [state.left]);
  const nights = Math.round((new Date(state.dateTo).getTime() - new Date(state.dateFrom).getTime()) / 86400000);
  return (
    <div
      ref={ref}
      style={{ position: "fixed", top: state.top, left: finalLeft, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-xl shadow-xl w-52 p-3 text-sm pointer-events-auto"
      onMouseLeave={onClose}
    >
      <div className="flex items-center gap-2 mb-2">
        <i className="fa-regular fa-calendar-xmark text-gray-400 flex-shrink-0" />
        <span className="font-semibold text-gray-900 truncate">{state.reason || "Blokace"}</span>
      </div>
      <div className="text-xs text-gray-500 space-y-0.5">
        <div><span className="text-gray-400">Od:</span> {format(new Date(state.dateFrom), "d. M. yyyy", { locale: cs })}</div>
        <div><span className="text-gray-400">Do:</span> {format(new Date(state.dateTo), "d. M. yyyy", { locale: cs })}</div>
        <div><span className="text-gray-400">Nocí:</span> {nights}</div>
      </div>
      <button
        className="mt-2 w-full text-xs text-center text-blue-600 hover:text-blue-800 font-medium pt-1.5 border-t border-gray-100"
        onClick={onOpen}
      >
        Detail →
      </button>
    </div>
  );
}

function ReservationPopover({ state, onClose, onOpen }: {
  state: PopoverState;
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  const { block, top, left } = state;
  const popRef = useRef<HTMLDivElement>(null);

  // Clamp left after render
  const [finalLeft, setFinalLeft] = useState(left);
  useEffect(() => {
    if (!popRef.current) return;
    const w = popRef.current.offsetWidth;
    const vw = window.innerWidth;
    setFinalLeft(Math.min(Math.max(left, 8), vw - w - 8));
  }, [left]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, [onClose]);

  const nights = block.checkIn && block.checkOut
    ? Math.round((new Date(block.checkOut).getTime() - new Date(block.checkIn).getTime()) / 86400000)
    : null;

  return (
    <div
      ref={popRef}
      style={{ position: "fixed", top, left: finalLeft, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-xl shadow-xl w-56 p-3 text-sm pointer-events-auto"
      onMouseLeave={onClose}
    >
      <div className="flex items-center gap-2 mb-2">
        {block.languageCode && <Flag code={block.languageCode} />}
        <span className="font-semibold text-gray-900 truncate">{block.label}</span>
      </div>
      {block.status && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mb-2 ${STATUS_COLOR[block.status] ?? ""}`}>
          {STATUS_LABEL[block.status] ?? block.status}
        </span>
      )}
      {block.checkIn && block.checkOut && (
        <div className="text-xs text-gray-500 space-y-0.5 mt-1">
          <div><span className="text-gray-400">Příjezd:</span> {format(new Date(block.checkIn), "d. M. yyyy", { locale: cs })}</div>
          <div><span className="text-gray-400">Odjezd:</span> {format(new Date(block.checkOut), "d. M. yyyy", { locale: cs })}</div>
          {nights !== null && <div><span className="text-gray-400">Nocí:</span> {nights}</div>}
        </div>
      )}
      {block.bookingCode && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400 font-mono"># {block.bookingCode}</div>
      )}
      <button
        className="mt-2 w-full text-xs text-center text-blue-600 hover:text-blue-800 font-medium pt-1.5 border-t border-gray-100"
        onClick={() => onOpen(block.id)}
      >
        Otevřít detail →
      </button>
    </div>
  );
}

export default function CalendarPage() {
  useTitle("Kalendář");
  const navigate = useNavigate();
  const [modalId, setModalId] = useState<string | null>(null);
  const [blockingModalId, setBlockingModalId] = useState<string | null>(null);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [blockingPopover, setBlockingPopover] = useState<BlockingPopoverState | null>(null);
  const [dragState, setDragState] = useState<{ reservationId: string; origCheckIn: string; origCheckOut: string } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<{ typeId: string; day: number } | null>(null);
  const [cellSel, setCellSel] = useState<{ typeId: string; startDay: number; endDay: number } | null>(null);
  const [selMousePos, setSelMousePos] = useState<{ x: number; y: number } | null>(null);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [campId, setCampId] = useState<string>("");
  const [accTypes, setAccTypes] = useState<AccType[]>([]);
  const [reservations, setReservations] = useState<TimelineReservation[]>([]);
  const [blocked, setBlocked] = useState<BlockedPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/camps/for-filter").then((r) => {
      setCamps(r.data);
      if (r.data.length > 0) setCampId(r.data[0].id);
    }).catch(() => {});
  }, []);

  const loadTimeline = () => {
    if (!campId) return;
    setLoading(true);
    api.get(`/reservations/timeline?campId=${campId}&year=${year}&month=${month}`)
      .then((r) => {
        setAccTypes(r.data.accommodationTypes);
        setReservations(r.data.reservations);
        setBlocked(r.data.blockedPeriods);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTimeline(); }, [campId, year, month]);

  // Scroll to today or start of month
  useEffect(() => {
    if (!scrollRef.current) return;
    const todayDay = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : 1;
    const offset = (todayDay - 1) * CELL_W - 60;
    scrollRef.current.scrollLeft = Math.max(0, offset);
  }, [accTypes, year, month]);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, []);

  // Global mouseup — finish cell-drag selection and navigate
  useEffect(() => {
    const up = () => {
      if (!cellSel) return;
      const { typeId, startDay, endDay } = cellSel;
      const from = Math.min(startDay, endDay);
      const to = Math.max(startDay, endDay);
      setCellSel(null);
      setSelMousePos(null);
      const checkIn = format(new Date(year, month - 1, from), "yyyy-MM-dd");
      // single-click (from===to) → 1 noc, drag → checkOut = poslední vybraný den
      const checkOut = format(from === to ? addDays(new Date(year, month - 1, to), 1) : new Date(year, month - 1, to), "yyyy-MM-dd");
      navigate(`/reservations/new?campId=${campId}&typeId=${typeId}&checkIn=${checkIn}&checkOut=${checkOut}`);
    };
    const move = (e: MouseEvent) => {
      if (cellSel) setSelMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mouseup", up);
    window.addEventListener("mousemove", move);
    return () => { window.removeEventListener("mouseup", up); window.removeEventListener("mousemove", move); };
  }, [cellSel, year, month, campId]);

  const openNewReservation = (typeId: string, day: number) => {
    const checkIn = format(new Date(year, month - 1, day), "yyyy-MM-dd");
    const checkOut = format(addDays(new Date(year, month - 1, day), 1), "yyyy-MM-dd");
    navigate(`/reservations/new?campId=${campId}&typeId=${typeId}&checkIn=${checkIn}&checkOut=${checkOut}`);
  };

  const handleDrop = async (typeId: string, day: number) => {
    if (!dragState) return;
    const { reservationId, origCheckIn, origCheckOut } = dragState;
    const origStart = new Date(origCheckIn);
    const nights = Math.round((new Date(origCheckOut).getTime() - origStart.getTime()) / 86400000);
    const newCheckIn = new Date(year, month - 1, day);
    const newCheckOut = addDays(newCheckIn, nights);
    setDragState(null);
    setDragOverDay(null);
    try {
      await api.put(`/reservations/${reservationId}`, {
        accommodationTypeId: typeId,
        checkIn: format(newCheckIn, "yyyy-MM-dd"),
        checkOut: format(newCheckOut, "yyyy-MM-dd"),
      });
      loadTimeline();
    } catch {
      loadTimeline();
    }
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); };

  const handlePickerSelect = (day: Date | undefined) => {
    if (!day) return;
    setYear(day.getFullYear());
    setMonth(day.getMonth() + 1);
    setPickerOpen(false);
    // Scroll to selected day after render
    setTimeout(() => {
      if (!scrollRef.current) return;
      const offset = (day.getDate() - 1) * CELL_W - 60;
      scrollRef.current.scrollLeft = Math.max(0, offset);
    }, 50);
  };

  const dim = getDaysInMonth(new Date(year, month - 1));
  const todayDay = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : -1;

  function getBlocksForRow(typeId: string) {
    const result: { id: string; label: string; from: number; to: number; kind: "reservation" | "blocked"; status?: string; rId?: string; languageCode?: string; checkIn?: string; checkOut?: string; bookingCode?: string | null }[] = [];

    reservations
      .filter(r => r.accommodationTypeId === typeId)
      .forEach(r => {
        const ci = new Date(r.checkIn);
        const co = new Date(r.checkOut);
        const toDate = new Date(co); toDate.setDate(toDate.getDate() - 1);
        const ciMonth = ci.getMonth() + 1; const coMonth = co.getMonth() + 1;
        const startDay = ciMonth === month && ci.getFullYear() === year ? ci.getDate() : 1;
        const endDay = coMonth === month && co.getFullYear() === year ? toDate.getDate() : dim;
        if (startDay > dim || endDay < 1) return;
        result.push({
          id: r.id, rId: r.id,
          label: `${r.firstName} ${r.lastName[0]}.`,
          from: Math.max(startDay, 1), to: Math.min(endDay, dim),
          kind: "reservation", status: r.status, languageCode: r.languageCode,
          checkIn: r.checkIn, checkOut: r.checkOut, bookingCode: r.bookingCode,
        });
      });

    blocked
      .filter(b => b.accommodationTypeId === typeId || b.accommodationTypeId === null)
      .forEach(b => {
        const df = new Date(b.dateFrom); const dt = new Date(b.dateTo);
        const startDay = df.getMonth() + 1 === month && df.getFullYear() === year ? df.getDate() : 1;
        const endDay = dt.getMonth() + 1 === month && dt.getFullYear() === year ? dt.getDate() : dim;
        if (startDay > dim || endDay < 1) return;
        result.push({
          id: b.id, label: b.reason || "Blokace",
          from: Math.max(startDay, 1), to: Math.min(endDay, dim),
          kind: "blocked",
          checkIn: b.dateFrom, checkOut: b.dateTo,
        });
      });

    return result;
  }

  return (
    <div className="p-4 md:p-8">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Kalendář</h1>
        <div className="flex-1" />
        {camps.length > 1 && (
          <select className="input max-w-[200px]" value={campId} onChange={e => setCampId(e.target.value)}>
            {camps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        {/* Month navigation */}
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="btn-secondary px-3 py-2"><i className="fa-regular fa-chevron-left" /></button>

          {/* Clickable month label — opens day picker */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen(v => !v)}
              className="btn-secondary text-sm font-semibold px-4 py-2 min-w-[140px]"
            >
              {MONTH_NAMES[month - 1]} {year}
              <i className="fa-regular fa-calendar-days ml-2 text-gray-400" />
            </button>
            {pickerOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-2" style={{ fontSize: "0.8rem" }}>
                <DayPicker
                  mode="single"
                  defaultMonth={new Date(year, month - 1)}
                  onSelect={handlePickerSelect}
                  locale={cs}
                  classNames={{
                    months: "flex flex-col",
                    month: "space-y-1",
                    caption: "flex justify-center items-center relative py-1",
                    caption_label: "text-sm font-medium",
                    nav: "flex items-center gap-1",
                    nav_button: "p-1 rounded hover:bg-gray-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse",
                    head_row: "flex",
                    head_cell: "text-gray-400 w-8 font-normal text-[0.7rem] text-center",
                    row: "flex w-full mt-0.5",
                    cell: "w-8 h-8 text-center text-xs p-0 relative",
                    day: "w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors",
                    day_selected: "bg-blue-600 text-white hover:bg-blue-700 rounded-lg",
                    day_today: "font-bold text-red-600",
                  }}
                />
              </div>
            )}
          </div>

          <button onClick={nextMonth} className="btn-secondary px-3 py-2"><i className="fa-regular fa-chevron-right" /></button>
        </div>
        <button onClick={goToday} className="btn-secondary text-sm px-3 py-2">Dnes</button>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <div ref={scrollRef} className="overflow-x-auto">
          <table className="border-collapse" style={{ width: "max-content", minWidth: "100%" }}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="sticky left-0 z-20 bg-gray-50 border-r border-gray-200 text-left px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ minWidth: UNIT_COL_W, width: UNIT_COL_W }}>
                  Jednotka
                </th>
                {Array.from({ length: dim }, (_, i) => i + 1).map(d => {
                  const dow = new Date(year, month - 1, d).getDay();
                  const isWe = dow === 0 || dow === 6;
                  const isToday = d === todayDay;
                  return (
                    <th
                      key={d}
                      id={isToday ? "today-col" : undefined}
                      className={`text-center px-0 border-r border-gray-100 last:border-r-0 ${isToday ? "bg-red-50" : isWe ? "bg-gray-50" : ""}`}
                      style={{ minWidth: CELL_W, width: CELL_W }}
                    >
                      <span className={`block text-xs font-bold ${isToday ? "text-red-600" : "text-gray-700"}`}>{d}</span>
                      <span className={`block text-[10px] ${isToday ? "text-red-400" : "text-gray-400"}`}>{DAY_NAMES[dow]}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={dim + 1} className="text-center text-gray-400 text-sm py-12">
                    <i className="fa-regular fa-spinner animate-spin mr-2" />Načítám…
                  </td>
                </tr>
              )}
              {!loading && accTypes.length === 0 && (
                <tr>
                  <td colSpan={dim + 1} className="text-center text-gray-400 text-sm py-12">
                    {campId ? "Žádné ubytovací jednotky." : "Vyberte objekt."}
                  </td>
                </tr>
              )}
              {!loading && accTypes.map((type, ti) => {
                const blocks = getBlocksForRow(type.id);
                const rowBg = ti % 2 === 1;
                return (
                  <tr key={type.id} className={`border-t border-gray-100 ${rowBg ? "bg-gray-50/50" : ""}`}>
                    <td
                      className={`sticky left-0 z-10 border-r border-gray-200 px-3 py-0 ${rowBg ? "bg-gray-50" : "bg-white"}`}
                      style={{ minWidth: UNIT_COL_W, width: UNIT_COL_W, height: 44 }}
                    >
                      <span className="text-sm font-medium text-gray-800 truncate block">{typeName(type)}</span>
                    </td>
                    {Array.from({ length: dim }, (_, i) => i + 1).map(d => {
                      const dow = new Date(year, month - 1, d).getDay();
                      const isWe = dow === 0 || dow === 6;
                      const isToday = d === todayDay;
                      const block = blocks.find(b => b.from === d);
                      return (
                        <td
                          key={d}
                          className={`relative border-r border-gray-100 last:border-r-0 p-0 transition-colors select-none ${
                            cellSel?.typeId === type.id && d >= Math.min(cellSel.startDay, cellSel.endDay) && d <= Math.max(cellSel.startDay, cellSel.endDay)
                              ? "bg-blue-100"
                              : dragOverDay?.typeId === type.id && dragOverDay?.day === d
                              ? "bg-blue-100"
                              : isToday ? "bg-red-50" : isWe ? "bg-gray-50/70" : ""
                          }`}
                          style={{ minWidth: CELL_W, width: CELL_W, height: 44 }}
                          onMouseDown={() => { if (!block && !dragState) setCellSel({ typeId: type.id, startDay: d, endDay: d }); }}
                          onMouseEnter={() => { if (cellSel && cellSel.typeId === type.id && !block) setCellSel(s => s ? { ...s, endDay: d } : s); }}
                          onDragOver={(e) => { if (dragState) { e.preventDefault(); setDragOverDay({ typeId: type.id, day: d }); } }}
                          onDragLeave={() => setDragOverDay(null)}
                          onDrop={(e) => { e.preventDefault(); handleDrop(type.id, d); }}
                        >
                          {/* Today vertical accent */}
                          {isToday && <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-red-400 z-20" />}

                          {/* Empty cell cursor hint */}
                          {!block && <div className="absolute inset-0 cursor-crosshair" />}

                          {block && (() => {
                            const span = block.to - block.from + 1;
                            const w = span * CELL_W - 3;
                            if (block.kind === "blocked") {
                              const isTouch = () => !window.matchMedia("(hover: hover)").matches;
                              const openBlockingPopover = (e: React.MouseEvent<HTMLDivElement>) => {
                                const r = e.currentTarget.getBoundingClientRect();
                                setBlockingPopover({ id: block.id, reason: block.label, dateFrom: block.checkIn ?? "", dateTo: block.checkOut ?? "", top: r.bottom + 6, left: r.left });
                              };
                              return (
                                <div
                                  className="absolute top-[7px] bottom-[7px] rounded flex items-center px-2 text-[11px] font-medium text-gray-500 bg-gray-100 border border-dashed border-gray-300 overflow-hidden whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors z-10"
                                  style={{ left: 2, width: w }}
                                  onMouseEnter={(e) => { if (!isTouch()) openBlockingPopover(e); }}
                                  onMouseLeave={() => { if (!isTouch()) setBlockingPopover(null); }}
                                  onClick={(e) => { e.stopPropagation(); setBlockingPopover(null); setBlockingModalId(block.id); }}
                                >
                                  {span > 1 ? block.label : ""}
                                </div>
                              );
                            }
                            const cls = STATUS_COLOR[block.status ?? "CONFIRMED"] ?? STATUS_COLOR.CONFIRMED;
                            const isTouch = () => !window.matchMedia("(hover: hover)").matches;
                            const openPopover = (e: React.MouseEvent<HTMLDivElement>) => {
                              const r = e.currentTarget.getBoundingClientRect();
                              setPopover({ block: { id: block.id, label: block.label, languageCode: block.languageCode, status: block.status, checkIn: block.checkIn, checkOut: block.checkOut, bookingCode: block.bookingCode }, top: r.bottom + 6, left: r.left });
                            };
                            return (
                              <div
                                className={`absolute top-[7px] bottom-[7px] rounded flex items-center px-2 text-[11px] font-medium overflow-hidden whitespace-nowrap cursor-grab active:cursor-grabbing z-10 border ${cls} hover:brightness-95 transition-all`}
                                style={{ left: 2, width: w }}
                                draggable={block.kind === "reservation"}
                                onDragStart={() => {
                                  if (block.kind === "reservation" && block.rId) {
                                    setDragState({ reservationId: block.rId, origCheckIn: block.checkIn!, origCheckOut: block.checkOut! });
                                  }
                                }}
                                onDragEnd={() => { setDragState(null); setDragOverDay(null); }}
                                onMouseEnter={(e) => { if (!isTouch()) openPopover(e); }}
                                onMouseLeave={() => { if (!isTouch()) setPopover(null); }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isTouch()) {
                                    setPopover(p => p?.block.id === block.id ? null : null);
                                    openPopover(e);
                                  } else {
                                    setPopover(null);
                                    block.rId && setModalId(block.rId);
                                  }
                                }}
                              >
                                {block.languageCode && <Flag code={block.languageCode} className="mr-1 flex-shrink-0" />}
                                {span > 2 ? block.label : span === 2 ? block.label.split(" ")[0] : block.label.split(" ").map(w => w[0]).join("")}
                              </div>
                            );
                          })()}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {popover && (
        <ReservationPopover
          state={popover}
          onClose={() => setPopover(null)}
          onOpen={(id) => { setPopover(null); setModalId(id); }}
        />
      )}
      {cellSel && selMousePos && (() => {
        const from = Math.min(cellSel.startDay, cellSel.endDay);
        const to = Math.max(cellSel.startDay, cellSel.endDay);
        const nights = from === to ? 1 : to - from;
        const fromStr = format(new Date(year, month - 1, from), "d. M.", { locale: cs });
        const toStr = format(new Date(year, month - 1, to), "d. M.", { locale: cs });
        return (
          <div
            style={{ position: "fixed", top: selMousePos.y + 14, left: selMousePos.x + 12, zIndex: 9999, pointerEvents: "none" }}
            className="bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 shadow-xl whitespace-nowrap"
          >
            {fromStr} – {toStr} · {nights} {nights === 1 ? "noc" : nights < 5 ? "noci" : "nocí"}
          </div>
        );
      })()}

      {blockingPopover && (
        <BlockingPopover
          state={blockingPopover}
          onClose={() => setBlockingPopover(null)}
          onOpen={() => { const id = blockingPopover.id; setBlockingPopover(null); setBlockingModalId(id); }}
        />
      )}

      <ReservationModal reservationId={modalId} onClose={() => setModalId(null)} onChanged={loadTimeline} />
      {blockingModalId && <BlockingModal id={blockingModalId} onClose={() => setBlockingModalId(null)} />}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3">
        {[
          { cls: "bg-green-100 border-green-200", label: "Potvrzeno" },
          { cls: "bg-yellow-100 border-yellow-200", label: "Čeká na potvrzení" },
          { cls: "bg-gray-100 border-dashed border-gray-300", label: "Blokace" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-4 h-3 rounded border ${l.cls}`} />
            <span className="text-xs text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
