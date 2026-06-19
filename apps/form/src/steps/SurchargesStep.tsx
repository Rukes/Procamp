import { CampPublic } from "../hooks/useCamp";

interface Props {
  camp: CampPublic;
  selected: string[];
  nights: number;
  onChange: (ids: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  currency: string;
}

export default function SurchargesStep({ camp, selected, nights, onChange, onNext, onBack, currency }: Props) {
  const optional = camp.surcharges.filter((s) => s.isOptional);
  const mandatory = camp.surcharges.filter((s) => !s.isOptional);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  if (camp.surcharges.length === 0) {
    return (
      <div className="step-card">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Příplatky</h2>
        <p className="text-sm text-gray-500 mb-6">Žádné příplatky nejsou k dispozici.</p>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={onBack}>← Zpět</button>
          <button className="btn-primary" onClick={onNext}>Pokračovat →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="step-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Příplatky</h2>
      <p className="text-sm text-gray-500 mb-5">Vyberte doplňkové služby.</p>

      {mandatory.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Povinné příplatky</p>
          {mandatory.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">{s.name}</p>
                <p className="text-sm text-gray-500">{s.pricePerNight} {currency} × {nights} nocí = {s.pricePerNight * nights} {currency}</p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Povinný</span>
            </div>
          ))}
        </div>
      )}

      {optional.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Volitelné příplatky</p>
          {optional.map((s) => {
            const checked = selected.includes(s.id);
            return (
              <label key={s.id} className={`flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl cursor-pointer transition-colors ${checked ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(s.id)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-sm text-gray-500">{s.pricePerNight} {currency} / noc{checked ? ` × ${nights} = ${s.pricePerNight * nights} ${currency}` : ""}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        <button className="btn-secondary" onClick={onBack}>← Zpět</button>
        <button className="btn-primary" onClick={onNext}>Pokračovat →</button>
      </div>
    </div>
  );
}
