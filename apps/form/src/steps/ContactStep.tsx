import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PriceBreakdownBlock from "../components/PriceBreakdown";
import { PriceBreakdown, Language } from "@procamp/shared";
import { useT } from "../i18n";

export type ContactData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licensePlate?: string;
  expectedArrival?: string;
  note?: string;
};

interface Props {
  breakdown: PriceBreakdown;
  lang: Language;
  onSubmit: (data: ContactData) => void;
  onBack: () => void;
  submitting: boolean;
}

export default function ContactStep({ breakdown, lang, onSubmit, onBack, submitting }: Props) {
  const t = useT(lang.code);

  const schema = z.object({
    firstName: z.string().min(1, t.required),
    lastName: z.string().min(1, t.required),
    email: z.string().email(t.invalidEmail),
    phone: z.string().min(1, t.required),
    licensePlate: z.string().optional(),
    expectedArrival: z.string().optional(),
    note: z.string().optional(),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ContactData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="step-card space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{t.contactTitle}</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t.contactFirstName} *</label>
          <input className="input" {...register("firstName")} />
          {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="label">{t.contactLastName} *</label>
          <input className="input" {...register("lastName")} />
          {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">{t.contactEmail} *</label>
        <input className="input" type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="label">{t.contactPhone} *</label>
        <input className="input" type="tel" {...register("phone")} />
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="label">{t.contactLicensePlate} <span className="text-gray-400 font-normal">({t.optional})</span></label>
        <input className="input" {...register("licensePlate")} placeholder={t.contactLicensePlatePlaceholder} />
      </div>

      <div>
        <label className="label">{t.contactArrival} <span className="text-gray-400 font-normal">({t.optional})</span></label>
        <select className="input" {...register("expectedArrival")}>
          <option value="">{t.contactArrivalUnknown}</option>
          {Array.from({ length: 24 }, (_, i) => (i + 14) % 24).map((h) => {
            const next = (h + 1) % 24;
            const pad = (n: number) => String(n).padStart(2, "0");
            const val = `${pad(h)}:00–${pad(next)}:00`;
            return <option key={val} value={val}>{pad(h)}:00 – {pad(next)}:00</option>;
          })}
        </select>
      </div>

      <div>
        <label className="label">{t.contactNote} <span className="text-gray-400 font-normal">({t.optional})</span></label>
        <textarea className="input resize-none" rows={3} {...register("note")} />
      </div>

      <PriceBreakdownBlock breakdown={breakdown} lang={lang} />
      <p className="text-xs text-gray-500 text-center">{t.paymentOnSite}</p>

      <div className="flex gap-3">
        <button type="button" className="btn-secondary" onClick={onBack}>{t.back}</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? t.contactSubmitting : t.contactSubmit}
        </button>
      </div>
    </form>
  );
}
