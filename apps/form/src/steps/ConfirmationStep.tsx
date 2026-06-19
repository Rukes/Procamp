import { format } from "date-fns";
import { Language, formatPrice } from "@procamp/shared";
import { useT } from "../i18n";
import { getDateLocale } from "../i18n/dateFnsLocale";

interface Props {
  firstName: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  lang: Language;
  nights: number;
}

export default function ConfirmationStep({ firstName, checkIn, checkOut, totalPrice, lang, nights }: Props) {
  const t = useT(lang.code);
  const locale = getDateLocale(lang.code);

  return (
    <div className="step-card text-center py-10">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">✓</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{t.confirmTitle}</h2>
      <p className="text-gray-600 mb-6">{t.confirmSubtitle(firstName)}</p>
      <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 text-left max-w-xs mx-auto">
        <div className="flex justify-between"><span className="text-gray-500">{t.confirmCheckIn}</span><span className="font-medium">{format(checkIn, "d. M. yyyy", { locale })}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{t.confirmCheckOut}</span><span className="font-medium">{format(checkOut, "d. M. yyyy", { locale })}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{t.confirmNights}</span><span className="font-medium">{nights}</span></div>
        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>{t.confirmTotal}</span><span>{formatPrice(totalPrice, lang)}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-6">{t.confirmFooter}</p>
    </div>
  );
}
