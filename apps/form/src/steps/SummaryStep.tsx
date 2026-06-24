import { Language, formatPrice, PriceBreakdown } from "@procamp/shared";
import { CampPublic, PublicAccommodationType, getEffectivePricePerNight } from "../hooks/useCamp";
import { format } from "date-fns";
import PriceBreakdownBlock from "../components/PriceBreakdown";
import { useT } from "../i18n";
import { getDateLocale } from "../i18n/dateFnsLocale";

interface Props {
  camp: CampPublic;
  type: PublicAccommodationType;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  selectedSurchargeIds: string[];
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

function calcBreakdown(camp: CampPublic, type: PublicAccommodationType, checkIn: Date, checkOut: Date, adults: number, children: number, selectedIds: string[], lang: Language): PriceBreakdown {
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
  const basePrice = getEffectivePricePerNight(type, nights);
  const personsPrice = adults * type.adultPricePerNight + children * type.childPricePerNight;
  const selectedSurcharges = camp.surcharges.filter((s) => selectedIds.includes(s.id));
  const surchargesPrice = selectedSurcharges.reduce((sum, s) => sum + s.pricePerNight, 0);
  const total = (basePrice + personsPrice + surchargesPrice) * nights;

  const lines: { label: string; amount: number }[] = [];
  if (basePrice > 0) lines.push({ label: `${type.name} (${formatPrice(basePrice, lang)} × ${nights})`, amount: basePrice * nights });
  if (adults > 0 && type.adultPricePerNight > 0) lines.push({ label: `${adults}× ${formatPrice(type.adultPricePerNight, lang)} × ${nights}`, amount: adults * type.adultPricePerNight * nights });
  if (children > 0 && type.childPricePerNight > 0) lines.push({ label: `${children}× ${formatPrice(type.childPricePerNight, lang)} × ${nights}`, amount: children * type.childPricePerNight * nights });
  selectedSurcharges.forEach((s) => lines.push({ label: `${s.name} × ${nights}`, amount: s.pricePerNight * nights }));

  return { nights, accommodationTotal: basePrice * nights, personsTotal: personsPrice * nights, surchargesTotal: surchargesPrice * nights, total, lines };
}

export default function SummaryStep({ camp, type, checkIn, checkOut, adults, children, selectedSurchargeIds, onNext, onBack, lang }: Props) {
  const t = useT(lang.code);
  const locale = getDateLocale(lang.code);
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
  const breakdown = calcBreakdown(camp, type, checkIn, checkOut, adults, children, selectedSurchargeIds, lang);

  return (
    <div className="step-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.summaryTitle}</h2>

      <div className="space-y-3 mb-6 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">{t.summaryType}</span><span className="font-medium">{type.name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{t.summaryCheckIn}</span><span className="font-medium">{format(checkIn, "d. MMMM yyyy", { locale })}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{t.summaryCheckOut}</span><span className="font-medium">{format(checkOut, "d. MMMM yyyy", { locale })}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{t.summaryNights}</span><span className="font-medium">{nights}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{t.summaryPersons}</span><span className="font-medium">{t.summaryAdults(adults)}, {t.summaryChildren(children)}</span></div>
      </div>

      <PriceBreakdownBlock breakdown={breakdown} lang={lang} />

      <div className="flex gap-3 mt-6">
        <button className="btn-secondary" onClick={onBack}>{t.back}</button>
        <button className="btn-primary" onClick={onNext}>{t.contactTitle} →</button>
      </div>
    </div>
  );
}

export { calcBreakdown };
