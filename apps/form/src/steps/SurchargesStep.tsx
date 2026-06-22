import { Language, formatPrice } from "@procamp/shared";
import { CampPublic, PublicSurcharge } from "../hooks/useCamp";
import { useT } from "../i18n";
import { useState } from "react";

interface Props {
  camp: CampPublic;
  selected: string[];
  nights: number;
  onChange: (ids: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

function SurchargeNote({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center hover:bg-gray-300 transition-colors"
        onMouseEnter={() => { if (window.matchMedia("(hover: hover)").matches) setOpen(true); }}
        onMouseLeave={() => { if (window.matchMedia("(hover: hover)").matches) setOpen(false); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!window.matchMedia("(hover: hover)").matches) setOpen((v) => !v); }}
      >
        i
      </button>
      {open && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-20 w-52 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
          {note}
          <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-800" />
        </span>
      )}
    </span>
  );
}

export default function SurchargesStep({ camp, selected, nights, onChange, onNext, onBack, lang }: Props) {
  const t = useT(lang.code);
const optional = camp.surcharges.filter((s) => s.isOptional);
  const mandatory = camp.surcharges.filter((s) => !s.isOptional);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  if (camp.surcharges.length === 0) {
    return (
      <div className="step-card">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t.configSurchargesTitle}</h2>
        <div className="flex gap-3 mt-4">
          <button className="btn-secondary" onClick={onBack}>{t.back}</button>
          <button className="btn-primary" onClick={onNext}>{t.next}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="step-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">{t.configSurchargesTitle}</h2>

      {mandatory.length > 0 && (
        <div className="mb-4">
          {mandatory.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900 flex items-center">
                  {s.name}
                  {s.note && <SurchargeNote note={s.note} />}
                </p>
                <p className="text-sm text-gray-500">{formatPrice(s.pricePerNight, lang)} {t.configPerNight} {t.configNights(nights)} = {formatPrice(s.pricePerNight * nights, lang)}</p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{t.configMandatory}</span>
            </div>
          ))}
        </div>
      )}

      {optional.length > 0 && (
        <div className="mb-6">
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
                  <p className="font-medium text-gray-900 flex items-center">
                    {s.name}
                    {s.note && <SurchargeNote note={s.note} />}
                  </p>
                  <p className="text-sm text-gray-500">{formatPrice(s.pricePerNight, lang)} {t.configPerNight}{checked ? ` ${t.configNights(nights)} = ${formatPrice(s.pricePerNight * nights, lang)}` : ""}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        <button className="btn-secondary" onClick={onBack}>{t.back}</button>
        <button className="btn-primary" onClick={onNext}>{t.next}</button>
      </div>
    </div>
  );
}
