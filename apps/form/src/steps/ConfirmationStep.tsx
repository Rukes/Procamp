import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface Props {
  firstName: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  currency: string;
  nights: number;
}

export default function ConfirmationStep({ firstName, checkIn, checkOut, totalPrice, currency, nights }: Props) {
  return (
    <div className="step-card text-center py-10">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">✓</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Rezervace odeslána!</h2>
      <p className="text-gray-600 mb-6">
        Děkujeme, {firstName}! Potvrzení jsme poslali na váš e-mail.
      </p>
      <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 text-left max-w-xs mx-auto">
        <div className="flex justify-between"><span className="text-gray-500">Příjezd</span><span className="font-medium">{format(checkIn, "d. M. yyyy", { locale: cs })}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Odjezd</span><span className="font-medium">{format(checkOut, "d. M. yyyy", { locale: cs })}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Počet nocí</span><span className="font-medium">{nights}</span></div>
        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>Celková cena</span><span>{totalPrice} {currency}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-6">Platba probíhá na místě. Těšíme se na vás!</p>
    </div>
  );
}
