import { useState } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { format, isBefore, startOfDay } from "date-fns";
import "react-day-picker/dist/style.css";
import { Language } from "@procamp/shared";
import { useT } from "../i18n";
import { getDateLocale } from "../i18n/dateFnsLocale";

interface Props {
  occupied: string[];
  value: { checkIn: Date | null; checkOut: Date | null };
  onChange: (v: { checkIn: Date | null; checkOut: Date | null }) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

export default function DateStep({ occupied, value, onChange, onNext, onBack, lang }: Props) {
  const tr = useT(lang.code);
  const locale = getDateLocale(lang.code);

  const [range, setRange] = useState<DateRange | undefined>(
    value.checkIn && value.checkOut ? { from: value.checkIn, to: value.checkOut } : undefined,
  );

  const occupiedSet = new Set(occupied);
  const today = startOfDay(new Date());

  const isDisabled = (date: Date) =>
    isBefore(date, today) || occupiedSet.has(format(date, "yyyy-MM-dd"));

  const rangeHasConflict = (r: DateRange | undefined): boolean => {
    if (!r?.from || !r?.to) return false;
    const d = new Date(r.from);
    while (d < r.to) {
      if (occupiedSet.has(format(d, "yyyy-MM-dd"))) return true;
      d.setDate(d.getDate() + 1);
    }
    return false;
  };

  const handleSelect = (r: DateRange | undefined) => {
    setRange(r);
    if (rangeHasConflict(r)) {
      onChange({ checkIn: null, checkOut: null });
    } else {
      onChange({ checkIn: r?.from ?? null, checkOut: r?.to ?? null });
    }
  };

  const conflict = rangeHasConflict(range);

  const nights =
    range?.from && range?.to && !conflict
      ? Math.round((range.to.getTime() - range.from.getTime()) / 86400000)
      : 0;

  return (
    <div className="step-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{tr.dateTitle}</h2>
      <p className="text-sm text-gray-500 mb-4">{tr.dateSubtitle}</p>

      <div className="flex justify-center">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleSelect}
          disabled={isDisabled}
          numberOfMonths={1}
          locale={locale}
          modifiersStyles={{
            selected: { backgroundColor: "#2563eb", color: "#fff", borderRadius: "0.5rem" },
            range_middle: { backgroundColor: "#dbeafe", color: "#1e40af", borderRadius: 0 },
            today: { fontWeight: "bold" },
          }}
        />
      </div>

      {nights > 0 && (
        <div className="bg-blue-50 rounded-xl p-3 text-center text-sm text-blue-700 font-medium mb-4">
          {tr.dateNight(nights)}
          {" · "}
          {format(range!.from!, "d. M.", { locale })} – {format(range!.to!, "d. M. yyyy", { locale })}
        </div>
      )}

      {conflict && (
        <div className="bg-red-50 rounded-xl p-3 text-center text-sm text-red-600 font-medium mb-4">
          {tr.errorNoAvailability}
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button className="btn-secondary" onClick={onBack}>{tr.back}</button>
        <button className="btn-primary whitespace-nowrap" onClick={onNext} disabled={!range?.from || !range?.to || conflict}>
          {tr.next}
        </button>
      </div>
    </div>
  );
}
