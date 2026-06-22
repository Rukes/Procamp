import { useTitle } from "../hooks/useTitle";
import { useEffect, useState, useMemo, Fragment } from "react";
import { api } from "../api/client";

interface LogEntry {
  id: string;
  userId: string | null;
  userEmail: string;
  ip: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  payload: unknown;
  createdAt: string;
}

type DiffPayload = Record<string, { before?: unknown; after?: unknown }>;

const ACTION_LABELS: Record<string, { label: string; cls: string }> = {
  LOGIN:  { label: "Přihlášení", cls: "bg-blue-100 text-blue-700" },
  CREATE: { label: "Vytvoření",  cls: "bg-green-100 text-green-700" },
  UPDATE: { label: "Úprava",     cls: "bg-amber-100 text-amber-700" },
  DELETE: { label: "Smazání",    cls: "bg-red-100 text-red-700" },
};

const ENTITY_LABELS: Record<string, string> = {
  user:         "Uživatel",
  camp:         "Objekt",
  reservation:  "Rezervace",
  organization: "Organizace",
  surcharge:    "Příplatek",
};

// Noisy fields to hide from diff
const SKIP_FIELDS = new Set(["updatedAt", "createdAt"]);

const PER_PAGE = 50;

type SortKey = "createdAt" | "userEmail" | "action" | "entity";

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: "asc" | "desc" }) {
  const active = sortKey === col;
  return <i className={`fa-regular ml-1 text-xs ${active ? (sortDir === "asc" ? "fa-arrow-up text-blue-500" : "fa-arrow-down text-blue-500") : "fa-arrows-up-down text-gray-300"}`} />;
}

function isDiff(payload: unknown): payload is DiffPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const values = Object.values(payload as object);
  if (values.length === 0) return false;
  return values.every((v) => v && typeof v === "object" && ("before" in v || "after" in v));
}

function fmtVal(val: unknown): { text: string; isComplex: boolean } {
  if (val === null || val === undefined) return { text: "(prázdné)", isComplex: false };
  if (typeof val === "boolean") return { text: val ? "ano" : "ne", isComplex: false };
  if (typeof val === "string") return { text: val === "" ? "(prázdné)" : val, isComplex: false };
  if (typeof val === "number") return { text: String(val), isComplex: false };
  return { text: JSON.stringify(val, null, 2), isComplex: true };
}

function DiffModal({ log, onClose }: { log: LogEntry; onClose: () => void }) {
  const action = ACTION_LABELS[log.action] ?? { label: log.action, cls: "bg-gray-100 text-gray-600" };
  const entity = ENTITY_LABELS[log.entity] ?? log.entity;
  const isUpdate = log.action === "UPDATE" && isDiff(log.payload);

  const diffEntries = isUpdate
    ? Object.entries(log.payload as DiffPayload).filter(([k]) => !SKIP_FIELDS.has(k))
    : [];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 pt-12" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[90vw] max-w-[90vw] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge ${action.cls}`}>{action.label}</span>
              <span className="text-sm text-gray-600">{entity}</span>
            </div>
            <p className="text-xs text-gray-400">
              {log.userEmail} · {new Date(log.createdAt).toLocaleString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            {log.entityId && <p className="text-xs text-gray-300 font-mono mt-0.5">{log.entityId}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 shrink-0">
            <i className="fa-regular fa-xmark text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-auto p-6">
          {isUpdate ? (
            diffEntries.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Žádné viditelné změny.</p>
            ) : (
              <>
                <div className="space-y-3">
                  {diffEntries.map(([key, change]) => {
                    const before = fmtVal(change.before);
                    const after = fmtVal(change.after);
                    return (
                      <div key={key} className="rounded-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 font-mono border-b border-gray-100">
                          {key}
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-gray-100">
                          <div className="px-3 py-2">
                            <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Před</p>
                            {before.isComplex ? (
                              <pre className="text-xs text-red-700 whitespace-pre-wrap break-all">{before.text}</pre>
                            ) : (
                              <p className={`text-sm font-mono ${change.before === null || change.before === undefined || change.before === "" ? "text-gray-300 italic" : "text-red-700"}`}>{before.text}</p>
                            )}
                          </div>
                          <div className="px-3 py-2">
                            <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Po</p>
                            {after.isComplex ? (
                              <pre className="text-xs text-green-700 whitespace-pre-wrap break-all">{after.text}</pre>
                            ) : (
                              <p className={`text-sm font-mono ${change.after === null || change.after === undefined || change.after === "" ? "text-gray-300 italic" : "text-green-700"}`}>{after.text}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <details className="mt-4">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">Celý payload</summary>
                  <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </details>
              </>
            )
          ) : (
            <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LogsPage() {
  useTitle("Logy aktivit");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [activeLog, setActiveLog] = useState<LogEntry | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const load = () => {
    const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
    if (filterAction) params.set("action", filterAction);
    if (filterEntity) params.set("entity", filterEntity);
    api.get(`/activity-logs?${params}`).then((r) => {
      setLogs(r.data.logs);
      setTotal(r.data.total);
    }).catch(() => {});
  };

  useEffect(() => { setPage(1); }, [filterAction, filterEntity]);
  useEffect(() => { load(); }, [page, filterAction, filterEntity]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "cs");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [logs, sortKey, sortDir]);

  return (
    <div className="p-4 md:p-8">
      {activeLog && <DiffModal log={activeLog} onClose={() => setActiveLog(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Logy aktivit</h1>
        <p className="text-sm text-gray-500 mt-1">Přihlášení, vytvoření, úpravy a smazání záznamů.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 max-w-lg">
        <select className="input flex-1 min-w-[140px]" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
          <option value="">Všechny akce</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className="input flex-1 min-w-[140px]" value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)}>
          <option value="">Všechny entity</option>
          {Object.entries(ENTITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400 self-center">Celkem: {total}</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {([ ["createdAt", "Čas", "w-44"], ["userEmail", "Uživatel", ""], ["action", "Akce", "w-28"], ["entity", "Entita", "w-32"] ] as [SortKey, string, string][]).map(([col, label, w]) => (
                <th key={col} className={`text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-900 ${w}`} onClick={() => handleSort(col)}>
                  {label}<SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
                </th>
              ))}
              <th className="text-left px-4 py-3 font-semibold text-gray-600 w-32">IP adresa</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 w-20">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Žádné záznamy</td></tr>
            )}
            {sortedLogs.map((log) => {
              const action = ACTION_LABELS[log.action] ?? { label: log.action, cls: "bg-gray-100 text-gray-600" };
              const entity = ENTITY_LABELS[log.entity] ?? log.entity;
              const hasPayload = !!log.payload;
              const isUpdate = log.action === "UPDATE" && isDiff(log.payload);

              return (
                <Fragment key={log.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 tabular-nums whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{log.userEmail}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${action.cls}`}>{action.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{entity}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.ip ?? "—"}</td>
                    <td className="px-4 py-3">
                      {hasPayload ? (
                        <button
                          className="text-blue-500 hover:text-blue-700 text-xs underline"
                          onClick={() => setActiveLog(log)}
                        >
                          Detail
                        </button>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Strana {page} z {totalPages}</span>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm py-1.5" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <i className="fa-regular fa-chevron-left mr-1" />Předchozí
            </button>
            <button className="btn-secondary text-sm py-1.5" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Další<i className="fa-regular fa-chevron-right ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
