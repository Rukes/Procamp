import { useMotd, ActiveMotd } from "../hooks/useMotd";

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  primary: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-800", icon: "fa-circle-info text-blue-500" },
  warning: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-800", icon: "fa-triangle-exclamation text-yellow-500" },
  danger:  { bg: "bg-red-50",    border: "border-red-300",    text: "text-red-800",    icon: "fa-circle-exclamation text-red-500" },
  success: { bg: "bg-green-50",  border: "border-green-300",  text: "text-green-800",  icon: "fa-circle-check text-green-500" },
  neutral: { bg: "bg-gray-50",   border: "border-gray-300",   text: "text-gray-700",   icon: "fa-circle-info text-gray-400" },
};

function MotdCard({ m, onDismiss }: { m: ActiveMotd; onDismiss: () => void }) {
  const c = COLOR_MAP[m.color] ?? COLOR_MAP.neutral;
  return (
    <div className={`rounded-xl border ${c.bg} ${c.border} px-4 py-3 flex gap-3 items-start`}>
      <i className={`fa-solid ${c.icon} mt-0.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${c.text}`}>{m.title}</p>
        <div
          className={`text-sm mt-1 ${c.text} prose prose-sm max-w-none`}
          dangerouslySetInnerHTML={{ __html: m.body }}
        />
        {m.linkUrl && (
          <a href={m.linkUrl} target="_blank" rel="noopener noreferrer" className={`inline-block mt-2 text-xs font-medium underline ${c.text}`}>
            {m.linkLabel || m.linkUrl}
          </a>
        )}
      </div>
      {m.closeable && (
        <button onClick={onDismiss} className={`flex-shrink-0 ${c.text} opacity-60 hover:opacity-100`}>
          <i className="fa-regular fa-xmark" />
        </button>
      )}
    </div>
  );
}

export function MotdBannerDashboard() {
  const { visibleDashboard, dismiss } = useMotd();
  const items = visibleDashboard();
  if (!items.length) return null;
  return (
    <div className="space-y-2 mb-4">
      {items.map((m) => <MotdCard key={m.id} m={m} onDismiss={() => dismiss(m.id)} />)}
    </div>
  );
}

export function MotdBannerGlobal() {
  const { visible, dismiss } = useMotd();
  const items = visible("showGlobal");
  if (!items.length) return null;
  return (
    <div className="space-y-2 mb-4">
      {items.map((m) => <MotdCard key={m.id} m={m} onDismiss={() => dismiss(m.id)} />)}
    </div>
  );
}

export function MotdBannerMenu() {
  const { visible, dismiss } = useMotd();
  const items = visible("showMenu");
  if (!items.length) return null;
  return (
    <div className="space-y-1.5 px-3 py-2">
      {items.map((m) => {
        const c = COLOR_MAP[m.color] ?? COLOR_MAP.neutral;
        return (
          <div key={m.id} className={`rounded-lg border ${c.bg} ${c.border} px-3 py-2 flex gap-2 items-start`}>
            <i className={`fa-solid ${c.icon} text-xs mt-0.5 flex-shrink-0`} />
            <p className={`text-xs font-medium flex-1 ${c.text}`}>{m.title}</p>
            {m.closeable && (
              <button onClick={() => dismiss(m.id)} className={`flex-shrink-0 ${c.text} opacity-60 hover:opacity-100`}>
                <i className="fa-regular fa-xmark text-xs" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
