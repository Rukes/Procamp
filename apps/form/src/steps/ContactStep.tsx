import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PriceBreakdownBlock from "../components/PriceBreakdown";
import { PriceBreakdown } from "@procamp/shared";

const schema = z.object({
  firstName: z.string().min(1, "Povinné pole"),
  lastName: z.string().min(1, "Povinné pole"),
  email: z.string().email("Neplatný e-mail"),
  phone: z.string().min(1, "Povinné pole"),
  licensePlate: z.string().optional(),
  expectedArrival: z.string().optional(),
  note: z.string().optional(),
});

export type ContactData = z.infer<typeof schema>;

interface Props {
  breakdown: PriceBreakdown;
  currency: string;
  onSubmit: (data: ContactData) => void;
  onBack: () => void;
  submitting: boolean;
}

export default function ContactStep({ breakdown, currency, onSubmit, onBack, submitting }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<ContactData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="step-card space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Kontaktní údaje</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Jméno *</label>
          <input className="input" {...register("firstName")} />
          {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="label">Příjmení *</label>
          <input className="input" {...register("lastName")} />
          {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">E-mail *</label>
        <input className="input" type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="label">Telefon *</label>
        <input className="input" type="tel" {...register("phone")} />
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="label">SPZ <span className="text-gray-400 font-normal">(nepovinné)</span></label>
        <input className="input" {...register("licensePlate")} placeholder="např. 1AB 2345" />
      </div>

      <div>
        <label className="label">Předpokládaný čas příjezdu <span className="text-gray-400 font-normal">(nepovinné)</span></label>
        <input className="input" {...register("expectedArrival")} placeholder="např. 14:00 – 16:00" />
      </div>

      <div>
        <label className="label">Poznámka <span className="text-gray-400 font-normal">(nepovinné)</span></label>
        <textarea className="input resize-none" rows={3} {...register("note")} />
      </div>

      <PriceBreakdownBlock breakdown={breakdown} currency={currency} />
      <p className="text-xs text-gray-500 text-center">Platba probíhá na místě v kempu.</p>

      <div className="flex gap-3">
        <button type="button" className="btn-secondary" onClick={onBack}>← Zpět</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Odesílám…" : "Odeslat rezervaci →"}
        </button>
      </div>
    </form>
  );
}
