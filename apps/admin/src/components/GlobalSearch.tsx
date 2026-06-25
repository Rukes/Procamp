import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { format } from "date-fns";

interface ResResult { id: string; bookingCode?: string | null; firstName: string; lastName: string; email: string; checkIn: string; checkOut: string; status: string; }
interface CampResult { id: string; name: string; slug: string; _count: { accommodationTypes: number }; }
interface UserResult { id: string; name: string; email: string; }
interface BlockingResult { id: string; reason: string; internalNote?: string | null; dateFrom: string; dateTo: string; camp: { name: string }; }

interface Results {
  reservations: ResResult[];
  camps: CampResult[];
  users: UserResult[];
  blockings: BlockingResult[];
}

const STATUS_LABEL: Record<string, string> = { PENDING: "Čeká", CONFIRMED: "Potvrzena", CANCELLED: "Zrušena" };
const STATUS_CLASS: Record<string, string> = { PENDING: "text-amber-600", CONFIRMED: "text-green-600", CANCELLED: "text-red-500" };

interface FlatItem { type: "reservation" | "camp" | "user" | "blocking"; id: string; href: string; title: string; subtitle?: string; meta?: string; metaClass?: string; }

function toFlat(results: Results): FlatItem[] {
  const fmt = (d: string) => format(new Date(d), "d. M. yyyy");
  return [
    ...results.reservations.map((r) => ({
      type: "reservation" as const,
      id: r.id,
      href: `/reservations/${r.id}`,
      title: `${r.firstName} ${r.lastName}`,
      subtitle: [r.bookingCode, r.email].filter(Boolean).join(" · "),
      meta: STATUS_LABEL[r.status],
      metaClass: STATUS_CLASS[r.status],
    })),
    ...results.camps.map((c) => ({
      type: "camp" as const,
      id: c.id,
      href: `/camps/${c.id}`,
      title: c.name,
      subtitle: c.slug,
      meta: `${c._count.accommodationTypes} typ${c._count.accommodationTypes === 1 ? "" : "y"}`,
    })),
    ...results.users.map((u) => ({
      type: "user" as const,
      id: u.id,
      href: `/users`,
      title: u.name,
      subtitle: u.email,
    })),
    ...results.blockings.map((b) => ({
      type: "blocking" as const,
      id: b.id,
      href: `/blockings`,
      title: b.reason || b.internalNote || "Blokace",
      subtitle: b.camp.name,
      meta: `${fmt(b.dateFrom)}–${fmt(b.dateTo)}`,
    })),
  ];
}

const TYPE_CONFIG: Record<FlatItem["type"], { letter: string; label: string; bg: string; text: string }> = {
  reservation: { letter: "R", label: "Rezervace", bg: "bg-blue-100",   text: "text-blue-700" },
  camp:        { letter: "O", label: "Objekty",   bg: "bg-green-100",  text: "text-green-700" },
  user:        { letter: "U", label: "Uživatelé", bg: "bg-purple-100", text: "text-purple-700" },
  blocking:    { letter: "B", label: "Blokace",   bg: "bg-red-100",    text: "text-red-700" },
};

const ORDER: FlatItem["type"][] = ["reservation", "camp", "user", "blocking"];

interface Props { open: boolean; onClose: () => void; }

export default function GlobalSearch({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FlatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollState, setScrollState] = useState({ top: true, bottom: false });
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 1) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get("/search", { params: { q: q.trim() } });
      setResults(toFlat(res.data));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(true);
      setQuery(""); setResults([]); setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setVisible(false); setClosing(false); onClose(); }, 150);
  };

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
    requestAnimationFrame(updateScrollState);
  }, [activeIndex]);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollState({
      top: el.scrollTop <= 0,
      bottom: el.scrollTop + el.clientHeight >= el.scrollHeight - 2,
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [results]);

  useEffect(() => {
    setActiveIndex(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  const go = (href: string) => { navigate(href); handleClose(); };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[activeIndex]) go(results[activeIndex].href);
    if (e.key === "Escape") handleClose();
  };

  if (!open && !visible) return null;

  const grouped = ORDER.map((type) => ({
    type,
    items: results.filter((r) => r.type === type),
  })).filter((g) => g.items.length > 0);

  let globalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      style={{
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(2px)",
        animation: `${closing ? "searchFadeOut" : "searchFadeIn"} 150ms ease both`,
      }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: `${closing ? "searchSlideOut" : "searchSlideIn"} 150ms ease both` }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <i className={`fa-regular fa-magnifying-glass text-base shrink-0 ${loading ? "text-blue-400" : "text-gray-400"}`} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat rezervace, objekty, uživatele, blokace…"
            className="flex-1 text-sm outline-none placeholder:text-gray-400 text-gray-900"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-gray-300 hover:text-gray-500">
              <i className="fa-regular fa-xmark" />
            </button>
          )}
          <kbd className="shrink-0 hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-400 border border-gray-200 rounded">{/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl+K"}</kbd>
        </div>

        {/* Výsledky */}
        {query.trim().length > 0 && (
          <div className="relative">
          <div ref={scrollRef} className="max-h-[60vh] min-h-[8rem] overflow-y-auto py-2">
            {!loading && grouped.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Nic nenalezeno</p>
            )}
            {grouped.map((group) => {
              const cfg = TYPE_CONFIG[group.type];
              return (
                <div key={group.type}>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">{cfg.label}</p>
                  {group.items.map((item) => {
                    const idx = globalIdx++;
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={item.id}
                        ref={isActive ? activeRef : null}
                        onClick={() => go(item.href)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      >
                        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs font-bold ${cfg.bg} ${cfg.text}`}>{cfg.letter}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                          {item.subtitle && <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>}
                        </div>
                        {item.meta && <span className={`shrink-0 text-xs ${item.metaClass ?? "text-gray-400"}`}>{item.meta}</span>}
                        <i className={`fa-regular fa-corner-down-left text-xs shrink-0 ${isActive ? "text-blue-400" : "invisible"}`} />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {!scrollState.top && <div className="pointer-events-none absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white to-transparent" />}
          {!scrollState.bottom && <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent" />}
          </div>
        )}

        {/* Prázdný stav */}
        {query.trim().length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <i className="fa-regular fa-magnifying-glass text-2xl text-gray-200" />
            <p className="text-sm text-gray-400">Začněte psát pro vyhledávání</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="border border-gray-200 rounded px-1">↑↓</kbd> navigace</span>
          <span><kbd className="border border-gray-200 rounded px-1">↵</kbd> otevřít</span>
          <span><kbd className="border border-gray-200 rounded px-1">ESC</kbd> zavřít</span>
        </div>
      </div>
    </div>
  );
}
