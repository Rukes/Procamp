import { useEffect, useRef, useState } from "react";
import { useTitle } from "../hooks/useTitle";
import { api } from "../api/client";
import ReservationModal from "../components/ReservationModal";
import HelpModal from "../components/HelpModal";
import { getDaysInMonth, format, addDays } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  source?: string | null;
}

const SOURCE_COLOR: Record<string, string> = {
  BOOKING: "bg-blue-100 text-blue-800 border-blue-300",
  AIRBNB:  "bg-pink-100 text-pink-800 border-pink-300",
};
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
const LANE_H = 32;
const LANE_PAD = 4;

// Timezone-safe: parse date string "YYYY-MM-DD..." as local date
const parseDate = (s: string) => {
  const d = new Date(s);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
};

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
  const [searchParams] = useSearchParams();
  const [helpOpen, setHelpOpen] = useState(false);
  const [modalId, setModalId] = useState<string | null>(null);
  const [blockingModalId, setBlockingModalId] = useState<string | null>(null);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [blockingPopover, setBlockingPopover] = useState<BlockingPopoverState | null>(null);
  const [dragState, setDragState] = useState<{ reservationId: string; origCheckIn: string; origCheckOut: string } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<{ typeId: string; day: number } | null>(null);
  const [cellSel, setCellSel] = useState<{ typeId: string; startDay: number; endDay: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ typeId: string; day: number } | null>(null);
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
  const [cellW, setCellW] = useState(CELL_W);

  useEffect(() => {
    api.get("/camps/for-filter").then((r) => {
      setCamps(r.data);
      const preId = searchParams.get("campId");
      if (preId && r.data.some((c: Camp) => c.id === preId)) setCampId(preId);
      else if (r.data.length > 0) setCampId(r.data[0].id);
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!scrollRef.current) return;
    const update = () => {
      if (!scrollRef.current) return;
      const avail = scrollRef.current.clientWidth - UNIT_COL_W;
      setCellW(Math.max(CELL_W, Math.floor(avail / dim)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, [dim]);

  function getBlocksForRow(typeId: string) {
    type RawBlock = { id: string; label: string; from: number; to: number; kind: "reservation" | "blocked"; status?: string; rId?: string; languageCode?: string; checkIn?: string; checkOut?: string; bookingCode?: string | null; startsThisMonth?: boolean; endsThisMonth?: boolean; source?: string | null };
    const raw: RawBlock[] = [];

    reservations
      .filter(r => r.accommodationTypeId === typeId)
      .forEach(r => {
        const ci = parseDate(r.checkIn);
        const co = parseDate(r.checkOut);
        const startsThisMonth = ci.month === month && ci.year === year;
        const endsThisMonth = co.month === month && co.year === year;
        const startDay = startsThisMonth ? ci.day : (ci.year < year || (ci.year === year && ci.month < month)) ? 1 : dim + 1;
        const endDay = endsThisMonth ? co.day : (co.year > year || (co.year === year && co.month > month)) ? dim : 0;
        if (startDay > dim || endDay < 1) return;
        raw.push({
          id: r.id, rId: r.id,
          label: `${r.firstName} ${r.lastName[0]}.`,
          from: Math.max(startDay, 1), to: Math.min(endDay, dim),
          kind: "reservation", status: r.status, languageCode: r.languageCode,
          checkIn: r.checkIn, checkOut: r.checkOut, bookingCode: r.bookingCode,
          startsThisMonth, endsThisMonth,
        });
      });

    blocked
      .filter(b => b.accommodationTypeId === typeId || b.accommodationTypeId === null)
      .forEach(b => {
        const df = parseDate(b.dateFrom); const dt = parseDate(b.dateTo);
        const startDay = df.month === month && df.year === year ? df.day : (df.year < year || (df.year === year && df.month < month)) ? 1 : dim + 1;
        const endDay = dt.month === month && dt.year === year ? dt.day : (dt.year > year || (dt.year === year && dt.month > month)) ? dim : 0;
        if (startDay > dim || endDay < 1) return;
        const bStartsThisMonth = df.month === month && df.year === year;
        const bEndsThisMonth = dt.month === month && dt.year === year;
        raw.push({
          id: b.id, label: b.reason || "Blokace",
          from: Math.max(startDay, 1), to: Math.min(endDay, dim),
          kind: "blocked",
          checkIn: b.dateFrom, checkOut: b.dateTo,
          startsThisMonth: bStartsThisMonth, endsThisMonth: bEndsThisMonth,
          source: b.source,
        });
      });

    // Lane assignment — greedy, sort by from
    const sorted = [...raw].sort((a, b) => a.from - b.from || a.to - b.to);
    const laneEnds: number[] = []; // laneEnds[i] = 'to' of last block in lane i
    const withLane = sorted.map(block => {
      // Dva bloky se překrývají pokud from_A < to_B && from_B < to_A
      let lane = laneEnds.findIndex(end => end <= block.from);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = block.to;
      return { ...block, lane };
    });

    const laneCount = Math.max(1, laneEnds.length);
    return { blocks: withLane, laneCount, rowH: laneCount * LANE_H + LANE_PAD * 2 };
  }

  return (
    <>
    <div className="p-4 md:p-8">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Kalendář</h1>
        <button onClick={() => setHelpOpen(true)} className="text-gray-400 hover:text-blue-500 transition-colors" title="Nápověda"><i className="fa-regular fa-circle-question text-lg" /></button>
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
        <div ref={scrollRef} className="overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          <div style={{ width: "max-content", minWidth: "100%" }}>

            {/* Header row */}
            <div className="flex bg-gray-50 border-b border-gray-200">
              <div
                className="sm:sticky left-0 z-20 bg-gray-50 border-r border-gray-200 flex items-center px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide flex-shrink-0"
                style={{ width: UNIT_COL_W, height: 40 }}
              >
                Jednotka
              </div>
              {Array.from({ length: dim }, (_, i) => i + 1).map(d => {
                const dow = new Date(year, month - 1, d).getDay();
                const isWe = dow === 0 || dow === 6;
                const isToday = d === todayDay;
                return (
                  <div
                    key={d}
                    className={`flex-shrink-0 text-center border-r border-gray-200 last:border-r-0 flex flex-col justify-center ${isToday ? "bg-red-50" : isWe ? "bg-gray-100/60" : ""}`}
                    style={{ width: cellW, height: 40 }}
                  >
                    <span className={`block text-xs font-bold leading-tight ${isToday ? "text-red-600" : "text-gray-700"}`}>{d}</span>
                    <span className={`block text-[10px] leading-tight ${isToday ? "text-red-400" : "text-gray-400"}`}>{DAY_NAMES[dow]}</span>
                  </div>
                );
              })}
            </div>

            {/* Loading / empty */}
            {loading && (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                <i className="fa-regular fa-spinner animate-spin mr-2" />Načítám…
              </div>
            )}
            {!loading && accTypes.length === 0 && (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                {campId ? "Žádné ubytovací jednotky." : "Vyberte objekt."}
              </div>
            )}

            {/* Data rows */}
            {!loading && accTypes.map((type, ti) => {
              const { blocks, rowH } = getBlocksForRow(type.id);

              return (
                <div key={type.id} className="flex border-t border-gray-100" style={{ height: rowH }}>

                  {/* Sticky label */}
                  <div
                    className="sm:sticky left-0 z-10 border-r border-gray-200 px-3 flex items-center flex-shrink-0 bg-white"
                    style={{ width: UNIT_COL_W, height: rowH }}
                  >
                    <span className="text-sm font-medium text-gray-800 truncate">{typeName(type)}</span>
                  </div>

                  {/* Day cells + block overlay */}
                  <div className="relative flex flex-1" style={{ height: rowH, minWidth: dim * cellW }}>

                    {/* Day cells — background colours, today line, drag/drop/select */}
                    {Array.from({ length: dim }, (_, i) => i + 1).map(d => {
                      const dow = new Date(year, month - 1, d).getDay();
                      const isWe = dow === 0 || dow === 6;
                      const isToday = d === todayDay;
                      const hasAnyBlock = blocks.some(b => b.from <= d && b.to >= d);
                      return (
                        <div
                          key={d}
                          className={`relative border-r border-gray-200 last:border-r-0 flex-shrink-0 select-none transition-colors ${
                            cellSel?.typeId === type.id && d >= Math.min(cellSel.startDay, cellSel.endDay) && d <= Math.max(cellSel.startDay, cellSel.endDay)
                              ? "bg-blue-100"
                              : dragOverDay?.typeId === type.id && dragOverDay?.day === d
                              ? "bg-blue-100"
                              : isToday ? "bg-red-50"
                              : !cellSel && !dragState && hoverCell && (hoverCell.typeId === type.id || hoverCell.day === d)
                              ? hoverCell.typeId === type.id && hoverCell.day === d ? "bg-blue-100/40" : "bg-blue-50/50"
                              : isWe ? "bg-gray-100/70" : ""
                          }`}
                          style={{ width: cellW, height: rowH }}
                          onMouseDown={() => { if (!dragState) setCellSel({ typeId: type.id, startDay: d, endDay: d }); }}
                          onMouseEnter={() => {
                            if (cellSel?.typeId === type.id) setCellSel(s => s ? { ...s, endDay: d } : s);
                            setHoverCell({ typeId: type.id, day: d });
                          }}
                          onMouseLeave={() => setHoverCell(null)}
                          onDragOver={(e) => { if (dragState) { e.preventDefault(); setDragOverDay({ typeId: type.id, day: d }); } }}
                          onDragLeave={() => setDragOverDay(null)}
                          onDrop={(e) => { e.preventDefault(); handleDrop(type.id, d); }}
                        >
                          {isToday && <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-red-400 z-[5] pointer-events-none" />}
                          <div className="absolute inset-0 cursor-crosshair" />
                        </div>
                      );
                    })}

                    {/* Blocks — absolutely positioned over day cells, no clipping */}
                    {blocks.map(block => {
                      const leftOff = block.startsThisMonth ? cellW / 2 + 3 : 1;
                      const rightOff = block.endsThisMonth ? cellW / 2 - 3 : cellW - 1;
                      const span = block.to - block.from;
                      const w = span * cellW + rightOff - leftOff - 1;
                      const blockLeft = (block.from - 1) * cellW + leftOff;
                      const labelSpan = span;
                      const blockTop = LANE_PAD + block.lane * LANE_H + 2;
                      const height = LANE_H - 4;

                      const roundCls = block.startsThisMonth && block.endsThisMonth ? "rounded" : block.startsThisMonth ? "rounded-l" : block.endsThisMonth ? "rounded-r" : "rounded-none";
                      const padL = block.startsThisMonth ? "pl-2" : "pl-1";
                      const padR = block.endsThisMonth ? "pr-2" : "pr-1";

                      if (block.kind === "blocked") {
                        const src = (block.source ?? "").toUpperCase();
                        const srcCls = SOURCE_COLOR[src] ?? "bg-gray-200 text-gray-600 border-gray-400";
                        const isTouch = () => !window.matchMedia("(hover: hover)").matches;
                        const openBlockingPopover = (e: React.MouseEvent<HTMLDivElement>) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          setBlockingPopover({ id: block.id, reason: block.label, dateFrom: block.checkIn ?? "", dateTo: block.checkOut ?? "", top: r.bottom + 6, left: r.left });
                        };
                        return (
                          <div
                            key={block.id}
                            className={`absolute flex items-center text-[11px] font-medium border border-dashed overflow-hidden whitespace-nowrap cursor-pointer transition-colors z-10 hover:brightness-95 ${roundCls} ${padL} ${padR} ${srcCls}`}
                            style={{ left: blockLeft, width: w, top: blockTop, height }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => { if (!isTouch()) openBlockingPopover(e); }}
                            onMouseLeave={() => { if (!isTouch()) setBlockingPopover(null); }}
                            onClick={(e) => { e.stopPropagation(); setBlockingPopover(null); setBlockingModalId(block.id); }}
                          >
                            {block.label && block.label !== "Blokace" ? <span className="truncate">{block.label}</span> : labelSpan > 1 ? <span className="truncate">Blokace</span> : null}
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
                          key={block.id}
                          className={`absolute flex items-center text-[11px] font-medium overflow-hidden whitespace-nowrap cursor-grab active:cursor-grabbing border z-10 hover:brightness-95 transition-all ${roundCls} ${padL} ${padR} ${cls}`}
                          style={{ left: blockLeft, width: w, top: blockTop, height }}
                          draggable
                          onDragStart={() => {
                            if (block.rId) setDragState({ reservationId: block.rId, origCheckIn: block.checkIn!, origCheckOut: block.checkOut! });
                          }}
                          onDragEnd={() => { setDragState(null); setDragOverDay(null); }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onMouseEnter={(e) => { if (!isTouch()) openPopover(e); }}
                          onMouseLeave={() => { if (!isTouch()) setPopover(null); }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isTouch()) { openPopover(e); }
                            else { setPopover(null); block.rId && setModalId(block.rId); }
                          }}
                        >
                          {block.languageCode && <Flag code={block.languageCode} className="mr-1 flex-shrink-0" />}
                          {labelSpan > 2 ? block.label : labelSpan >= 1 ? block.label.split(" ")[0] : block.label.split(" ").map(w => w[0]).join("")}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          </div>
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

      {/* Legend + hint */}
      <div className="flex items-center justify-between flex-wrap gap-2 mt-3">
      <div className="flex flex-wrap gap-4">
        {[
          { cls: "bg-green-100 border-green-200", label: "Potvrzeno" },
          { cls: "bg-yellow-100 border-yellow-200", label: "Čeká na potvrzení" },
          { cls: "bg-gray-200 border-dashed border-gray-400", label: "Blokace" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-4 h-3 rounded border ${l.cls}`} />
            <span className="text-xs text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
      <span className="text-xs text-gray-400 flex items-center gap-1.5">
        <i className="fa-regular fa-hand-pointer" />
        Kliknutím nebo tažením přes dny vytvoříte novou rezervaci
      </span>
      </div>
    </div>
    {helpOpen && <HelpModal topic="kalendar" onClose={() => setHelpOpen(false)} />}
    </>
  );
}
