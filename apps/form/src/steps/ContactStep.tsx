import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import PriceBreakdownBlock from "../components/PriceBreakdown";
import { PriceBreakdown, Language } from "@procamp/shared";
import { useT } from "../i18n";
import HCaptcha from "../components/HCaptcha";

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
  termsText?: string;
  requireTermsAcceptance?: boolean;
  onSubmit: (data: ContactData) => void;
  onBack: () => void;
  submitting: boolean;
}

export default function ContactStep({ breakdown, lang, termsText, requireTermsAcceptance, onSubmit, onBack, submitting }: Props) {
  const t = useT(lang.code);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const hasTerms = !!termsText?.trim();
  const needsAcceptance = hasTerms && (requireTermsAcceptance ?? true);
  const hasCaptcha = !!import.meta.env.VITE_HCAPTCHA_SITE_KEY;

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

  const handleFormSubmit = (data: ContactData) => {
    if (needsAcceptance && !termsAccepted) return;
    if (hasCaptcha && !captchaToken) return;
    onSubmit(data);
  };

  return (
    <>
      {termsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setTermsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Obchodní podmínky & GDPR</h3>
              <button type="button" onClick={() => setTermsOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div
              className="overflow-y-auto px-6 py-5 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: termsText ?? "" }}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="step-card space-y-4">
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

        <HCaptcha onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />

        {hasTerms && !needsAcceptance && (
          <p className="text-sm text-gray-500 p-3 rounded-xl border border-gray-200 bg-gray-50">
            Odesláním rezervace berete na vědomí{" "}
            <button type="button" className="text-blue-600 underline hover:text-blue-800" onClick={(e) => { e.preventDefault(); setTermsOpen(true); }}>
              podmínky
            </button>
            {" "}zpracování osobních údajů (GDPR).
          </p>
        )}
        {needsAcceptance && (
          <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${termsAccepted ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 flex-shrink-0"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span className="text-sm text-gray-700">
              Souhlasím s{" "}
              <button
                type="button"
                className="text-blue-600 underline hover:text-blue-800"
                onClick={(e) => { e.preventDefault(); setTermsOpen(true); }}
              >
                podmínkami
              </button>
              {" "}zpracování osobních údajů (GDPR).
            </span>
          </label>
        )}
        {needsAcceptance && !termsAccepted && (
          <p className="text-xs text-red-500 -mt-2">Pro odeslání rezervace je nutný souhlas s podmínkami.</p>
        )}

        <div className="flex gap-3">
          <button type="button" className="btn-secondary" onClick={onBack}>{t.back}</button>
          <button type="submit" className="btn-primary" disabled={submitting || (needsAcceptance && !termsAccepted) || (hasCaptcha && !captchaToken)}>
            {submitting ? t.contactSubmitting : t.contactSubmit}
          </button>
        </div>
      </form>
    </>
  );
}
