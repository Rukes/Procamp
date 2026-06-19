interface Props {
  adults: number;
  children: number;
  onChange: (adults: number, children: number) => void;
  onNext: () => void;
  onBack: () => void;
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

export default function GuestsStep({ adults, children, onChange, onNext, onBack }: Props) {
  return (
    <div className="step-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Počet osob</h2>
      <p className="text-sm text-gray-500 mb-4">Zadejte počet dospělých a dětí.</p>

      <div className="mb-6">
        <Counter label="Dospělí" sub="15 let a více" value={adults} onChange={(v) => onChange(v, children)} />
        <Counter label="Děti" sub="Do 15 let" value={children} onChange={(v) => onChange(adults, v)} />
      </div>

      <div className="flex gap-3">
        <button className="btn-secondary" onClick={onBack}>← Zpět</button>
        <button className="btn-primary" onClick={onNext} disabled={adults === 0}>
          Pokračovat →
        </button>
      </div>
    </div>
  );
}
