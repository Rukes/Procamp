import { PriceBreakdown, Language, formatPrice } from "@procamp/shared";
import { useT } from "../i18n";

export default function PriceBreakdownBlock({ breakdown, lang }: { breakdown: PriceBreakdown; lang: Language }) {
  const t = useT(lang.code);
  return (
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
  );
}
