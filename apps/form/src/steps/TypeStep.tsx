import { AccommodationType } from "@procamp/shared";
import { CampPublic } from "../hooks/useCamp";

interface Props {
  camp: CampPublic;
  selected: AccommodationType | null;
  onSelect: (t: AccommodationType) => void;
  currency: string;
}

const LABELS = { CARAVAN: "Karavan", TENT: "Stan" };
const ICONS = { CARAVAN: "🚐", TENT: "⛺" };

export default function TypeStep({ camp, selected, onSelect, currency }: Props) {
  const options: { type: AccommodationType; price: number; capacity: number }[] = [
    { type: "CARAVAN", price: camp.caravanPricePerNight, capacity: camp.caravanCapacity },
    { type: "TENT", price: camp.tentPricePerNight, capacity: camp.tentCapacity },
  ];

  return (
    <div className="step-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Typ ubytování</h2>
      <p className="text-sm text-gray-500 mb-5">Vyberte, zda přijedete s karavanem nebo stanem.</p>
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ type, price, capacity }) => (
          <button
            key={type}
            onClick={() => capacity > 0 && onSelect(type)}
            disabled={capacity === 0}
            className={`relative p-5 rounded-xl border-2 text-left transition-all ${
              selected === type
                ? "border-blue-600 bg-blue-50"
                : capacity === 0
                ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
            }`}
          >
            {selected === type && (
              <span className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">✓</span>
            )}
            <div className="text-3xl mb-2">{ICONS[type]}</div>
            <div className="font-semibold text-gray-900">{LABELS[type]}</div>
            <div className="text-sm text-gray-500 mt-0.5">{price} {currency} / noc</div>
            {capacity === 0 && <div className="text-xs text-red-500 mt-1">Obsazeno</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
