import { Language, formatPrice } from "@procamp/shared";
import { CampPublic, PublicAccommodationType } from "../hooks/useCamp";
import { useT } from "../i18n";

interface Props {
  camp: CampPublic;
  selected: PublicAccommodationType | null;
  onSelect: (t: PublicAccommodationType) => void;
  lang: Language;
}

export default function TypeStep({ camp, selected, onSelect, lang }: Props) {
  const t = useT(lang.code);
  const types = camp.accommodationTypes ?? [];

  if (types.length === 0) {
    return (
      <div className="step-card text-center text-gray-400">
        <p>{t.typeNoTypes}</p>
      </div>
    );
  }

  return (
    <div className="step-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{t.typeTitle}</h2>
      <p className="text-sm text-gray-500 mb-5">{t.typeSubtitle}</p>
      <div className="grid grid-cols-2 gap-3">
        {types.map((type) => {
          const available = type.capacity > 0;
          const isSelected = selected?.id === type.id;
          return (
            <button
              key={type.id}
              onClick={() => available && onSelect(type)}
              disabled={!available}
              className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : !available
                  ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
              }`}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">✓</span>
              )}
              <div className="font-semibold text-gray-900">{type.name}</div>
              <div className="text-sm text-gray-500 mt-0.5">{formatPrice(type.pricePerNight, lang)} {t.typePerNight}</div>
              {!available && <div className="text-xs text-red-500 mt-1">{t.typeSoldOut}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
