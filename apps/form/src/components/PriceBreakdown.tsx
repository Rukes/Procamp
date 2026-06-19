import { PriceBreakdown } from "@procamp/shared";

export default function PriceBreakdownBlock({ breakdown, currency }: { breakdown: PriceBreakdown; currency: string }) {
  return (
    <div className="bg-blue-50 rounded-xl p-4 space-y-1.5 text-sm">
      {breakdown.lines.map((line, i) => (
        <div key={i} className="flex justify-between text-gray-600">
          <span>{line.label}</span>
          <span>{line.amount} {currency}</span>
        </div>
      ))}
      <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between font-bold text-gray-900 text-base">
        <span>Celkem</span>
        <span>{breakdown.total} {currency}</span>
      </div>
    </div>
  );
}
