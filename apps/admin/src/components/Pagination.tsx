interface Props {
  page: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, total, perPage, onChange }: Props) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

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
    <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
      <span>{from}–{to} z {total}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <i className="fa-regular fa-chevron-left text-xs" />
        </button>
        {getPages().map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors font-medium ${
                p === page ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === pages}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <i className="fa-regular fa-chevron-right text-xs" />
        </button>
      </div>
    </div>
  );
}
