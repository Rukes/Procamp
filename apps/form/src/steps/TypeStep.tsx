import { Language, formatPrice } from "@procamp/shared";
import { CampPublic, PublicAccommodationType } from "../hooks/useCamp";
import { useT } from "../i18n";
import { useState } from "react";

interface Props {
  camp: CampPublic;
  selected: PublicAccommodationType | null;
  onSelect: (t: PublicAccommodationType) => void;
  lang: Language;
}

export default function TypeStep({ camp, selected, onSelect, lang }: Props) {
  const t = useT(lang.code);
  const types = camp.accommodationTypes ?? [];
  const [detailType, setDetailType] = useState<PublicAccommodationType | null>(null);

  if (types.length === 0) {
    return (
      <div className="step-card text-center text-gray-400">
        <p>{t.typeNoTypes}</p>
      </div>
    );
  }

  return (
    <div className="step-card">
      {/* Detail modal */}
      {detailType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-8" onClick={() => setDetailType(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80dvh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{detailType.name}</h3>
              <button type="button" onClick={() => setDetailType(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div
              className="overflow-y-auto px-6 py-5 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: detailType.longDescription ?? "" }}
            />
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900 mb-5">{t.typeTitle}</h2>
      <div className="grid grid-cols-2 gap-3">
        {types.map((type) => {
          const available = type.capacity > 0;
          const isSelected = selected?.id === type.id;
          return (
            <div
              key={type.id}
              onClick={() => available && onSelect(type)}
              role="button"
              tabIndex={available ? 0 : -1}
              onKeyDown={(e) => e.key === "Enter" && available && onSelect(type)}
              className={`relative p-5 rounded-xl border-2 text-left transition-all select-none ${
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : !available
                  ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer"
              }`}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">✓</span>
              )}
              {type.longDescription && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDetailType(type); }}
                  className={`absolute bottom-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isSelected ? "bg-blue-200 text-blue-700 hover:bg-blue-300" : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`}
                >
                  ?
                </button>
              )}
              <div className="font-semibold text-gray-900">{type.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-base font-semibold text-gray-800">{formatPrice(type.pricePerNight, lang)}</span>
                <span className="text-xs text-gray-400">{t.typePerNight}</span>
              </div>
              {type.shortDescription && (
                <div className="text-xs text-gray-400 mt-2 leading-snug">{type.shortDescription}</div>
              )}
              {!available && <div className="text-xs text-red-500 mt-1">{t.typeSoldOut}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
