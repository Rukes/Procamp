import { Language, formatPrice } from "@procamp/shared";
import { CampPublic, PublicAccommodationType } from "../hooks/useCamp";
import { calcBreakdown } from "./SummaryStep";
import { useT } from "../i18n";
import { useState } from "react";

function SurchargeNote({ note }: { note: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[9px] font-bold flex items-center justify-center hover:bg-gray-300 transition-colors"
        onMouseEnter={() => { if (window.matchMedia("(hover: hover)").matches) setOpen(true); }}
        onMouseLeave={() => { if (window.matchMedia("(hover: hover)").matches) setOpen(false); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!window.matchMedia("(hover: hover)").matches) setOpen((v) => !v); }}
      >
        ?
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

interface Props {
  camp: CampPublic;
  type: PublicAccommodationType;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  selectedSurchargeIds: string[];
  lang: Language;
  onChangeAdults: (n: number) => void;
  onChangeChildren: (n: number) => void;
  onChangeSurcharges: (ids: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

function Counter({ label, sub, value, onChange, min = 0 }: { label: string; sub: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 text-lg leading-none"
        >−</button>
        <span className="w-5 text-center font-semibold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg leading-none"
        >+</button>
      </div>
    </div>
  );
}

export default function ConfigStep({
  camp, type, checkIn, checkOut, adults, children, selectedSurchargeIds, lang,
  onChangeAdults, onChangeChildren, onChangeSurcharges, onNext, onBack,
}: Props) {
  const t = useT(lang.code);
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
  const mandatoryIds = camp.surcharges.filter((s) => !s.isOptional).map((s) => s.id);
  const allSelected = [...new Set([...mandatoryIds, ...selectedSurchargeIds])];
  const breakdown = calcBreakdown(camp, type, checkIn, checkOut, adults, children, allSelected, lang);

  const optional = camp.surcharges.filter((s) => s.isOptional);
  const mandatory = camp.surcharges.filter((s) => !s.isOptional);

  const toggleSurcharge = (id: string) => {
    onChangeSurcharges(
      selectedSurchargeIds.includes(id)
        ? selectedSurchargeIds.filter((s) => s !== id)
        : [...selectedSurchargeIds, id]
    );
  };

  return (
    <div className="step-card space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">{t.configPersonsTitle}</h2>
        {!camp.hideAdults && <Counter label={t.configAdults} sub={t.configAdultsSub} value={adults} onChange={onChangeAdults} min={1} />}
        {!camp.hideChildren && <Counter label={t.configChildren} sub={t.configChildrenSub} value={children} onChange={onChangeChildren} />}
      </div>

      {camp.surcharges.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t.configSurchargesTitle}</h2>

          {mandatory.length > 0 && (
            <div className="mb-3">
              {mandatory.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900 flex items-center">{s.name}{s.note && <SurchargeNote note={s.note} />}</p>
                    <p className="text-xs text-gray-500">{formatPrice(s.pricePerNight, lang)} {t.configNights(nights)}</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{t.configMandatory}</span>
                </div>
              ))}
            </div>
          )}

          {optional.map((s) => {
            const checked = selectedSurchargeIds.includes(s.id);
            return (
              <label key={s.id} className={`flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-xl cursor-pointer transition-colors ${checked ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSurcharge(s.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 flex items-center">{s.name}{s.note && <SurchargeNote note={s.note} />}</p>
                  <p className="text-xs text-gray-500">
                    {formatPrice(s.pricePerNight, lang)} {t.configPerNight}
                    {checked && ` ${t.configNights(nights)} = ${formatPrice(s.pricePerNight * nights, lang)}`}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div className="bg-blue-50 rounded-xl p-4 space-y-1.5 text-sm">
        {breakdown.lines.map((line, i) => (
          <div key={i} className="flex justify-between text-gray-600">
            <span>{line.label}</span>
            <span>{formatPrice(line.amount, lang)}</span>
          </div>
        ))}
        <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between font-bold text-gray-900 text-base">
          <span>{t.total}</span>
          <span>{formatPrice(breakdown.total, lang)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="btn-secondary" onClick={onBack}>{t.back}</button>
        <button className="btn-primary" onClick={onNext} disabled={adults === 0}>{t.next}</button>
      </div>
    </div>
  );
}
