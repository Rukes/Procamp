import { AccommodationType } from "@procamp/shared";
import { CampPublic } from "../hooks/useCamp";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import PriceBreakdownBlock from "../components/PriceBreakdown";
import { PriceBreakdown } from "@procamp/shared";

interface Props {
  camp: CampPublic;
  type: AccommodationType;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  selectedSurchargeIds: string[];
  onNext: () => void;
  onBack: () => void;
  currency: string;
}

function calcBreakdown(camp: CampPublic, type: AccommodationType, checkIn: Date, checkOut: Date, adults: number, children: number, selectedIds: string[], currency: string): PriceBreakdown {
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
  const basePrice = type === "CARAVAN" ? camp.caravanPricePerNight : camp.tentPricePerNight;
  const typeLabel = type === "CARAVAN" ? "Karavan" : "Stan";
  const personsPrice = adults * camp.adultPricePerNight + children * camp.childPricePerNight;
  const selectedSurcharges = camp.surcharges.filter((s) => selectedIds.includes(s.id));
  const surchargesPrice = selectedSurcharges.reduce((sum, s) => sum + s.pricePerNight, 0);
  const total = (basePrice + personsPrice + surchargesPrice) * nights;

  const lines = [
    { label: `${typeLabel} (${basePrice} ${currency} × ${nights} nocí)`, amount: basePrice * nights },
  ];
  if (adults > 0) lines.push({ label: `Dospělí (${adults} × ${camp.adultPricePerNight} ${currency} × ${nights} nocí)`, amount: adults * camp.adultPricePerNight * nights });
  if (children > 0) lines.push({ label: `Děti (${children} × ${camp.childPricePerNight} ${currency} × ${nights} nocí)`, amount: children * camp.childPricePerNight * nights });
  selectedSurcharges.forEach((s) => lines.push({ label: `${s.name} (${s.pricePerNight} ${currency} × ${nights} nocí)`, amount: s.pricePerNight * nights }));

  return { nights, accommodationTotal: basePrice * nights, personsTotal: personsPrice * nights, surchargesTotal: surchargesPrice * nights, total, lines };
}

const TYPE_LABEL: Record<AccommodationType, string> = { CARAVAN: "Karavan", TENT: "Stan" };

export default function SummaryStep({ camp, type, checkIn, checkOut, adults, children, selectedSurchargeIds, onNext, onBack, currency }: Props) {
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
  const breakdown = calcBreakdown(camp, type, checkIn, checkOut, adults, children, selectedSurchargeIds, currency);

  return (
    <div className="step-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Souhrn rezervace</h2>

      <div className="space-y-3 mb-6 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Typ</span><span className="font-medium">{TYPE_LABEL[type]}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Příjezd</span><span className="font-medium">{format(checkIn, "d. MMMM yyyy", { locale: cs })}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Odjezd</span><span className="font-medium">{format(checkOut, "d. MMMM yyyy", { locale: cs })}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Počet nocí</span><span className="font-medium">{nights}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Osoby</span><span className="font-medium">{adults} dospělí, {children} děti</span></div>
      </div>

      <PriceBreakdownBlock breakdown={breakdown} currency={currency} />

      <div className="flex gap-3 mt-6">
        <button className="btn-secondary" onClick={onBack}>← Zpět</button>
        <button className="btn-primary" onClick={onNext}>Vyplnit kontakt →</button>
      </div>
    </div>
  );
}

export { calcBreakdown };
