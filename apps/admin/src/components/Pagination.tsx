const PER_PAGE_OPTIONS = [20, 50, 100, 0] as const; // 0 = vše
const PER_PAGE_LABELS: Record<number, string> = { 20: "20", 50: "50", 100: "100", 0: "Vše" };

interface Props {
  page: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

export default function Pagination({ page, total, perPage, onChange, onPerPageChange }: Props) {
  const pages = perPage === 0 ? 1 : Math.ceil(total / perPage);
  const from = perPage === 0 ? 1 : (page - 1) * perPage + 1;
  const to = perPage === 0 ? total : Math.min(page * perPage, total);

  const getPages = (): (number | "…")[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const result: (number | "…")[] = [1];
    if (page > 3) result.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) result.push(i);
    if (page < pages - 2) result.push("…");
    result.push(pages);
    return result;
  };

  return (
    <div className="flex flex-wrap items-center justify-between mt-4 gap-2 text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <span>{total === 0 ? "0" : `${from} až ${to} z ${total}`}</span>
        {onPerPageChange && (
          <select
            value={perPage}
            onChange={(e) => { onPerPageChange(Number(e.target.value)); onChange(1); }}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {PER_PAGE_OPTIONS.map((o) => (
              <option key={o} value={o}>{PER_PAGE_LABELS[o]} / strana</option>
            ))}
          </select>
        )}
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button onClick={() => onChange(page - 1)} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
            <i className="fa-regular fa-chevron-left text-xs" />
          </button>
          {getPages().map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400">…</span>
            ) : (
              <button key={p} onClick={() => onChange(p)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors font-medium ${p === page ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-700"}`}>
                {p}
              </button>
            )
          )}
          <button onClick={() => onChange(page + 1)} disabled={page === pages} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
            <i className="fa-regular fa-chevron-right text-xs" />
          </button>
        </div>
      )}
    </div>
  );
}
