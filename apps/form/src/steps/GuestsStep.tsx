import { Language } from "@procamp/shared";
import { useT } from "../i18n";

interface Props {
  adults: number;
  children: number;
  onChange: (adults: number, children: number) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

function Counter({ label, sub, value, onChange }: { label: string; sub: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
          disabled={value === 0}
        >
          −
        </button>
        <span className="w-6 text-center font-semibold text-lg">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function GuestsStep({ adults, children, onChange, onNext, onBack, lang }: Props) {
  const t = useT(lang.code);

  return (
    <div className="step-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{t.configPersonsTitle}</h2>

      <div className="mb-6">
        <Counter label={t.configAdults} sub={t.configAdultsSub} value={adults} onChange={(v) => onChange(v, children)} />
        <Counter label={t.configChildren} sub={t.configChildrenSub} value={children} onChange={(v) => onChange(adults, v)} />
      </div>

      <div className="flex gap-3">
        <button className="btn-secondary whitespace-nowrap" onClick={onBack}>{t.back}</button>
        <button className="btn-primary whitespace-nowrap" onClick={onNext} disabled={adults === 0}>
          {t.next}
        </button>
      </div>
    </div>
  );
}
