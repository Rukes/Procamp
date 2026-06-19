import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Routes, Route, Navigate } from "react-router-dom";
import { useCamp, PublicAccommodationType } from "./hooks/useCamp";
import { useOccupied } from "./hooks/useOccupied";
import { api } from "./api/client";
import { useT } from "./i18n";
import LanguageSwitcher from "./components/LanguageSwitcher";
import StepIndicator from "./components/StepIndicator";
import TypeStep from "./steps/TypeStep";
import DateStep from "./steps/DateStep";
import ConfigStep from "./steps/ConfigStep";
import { calcBreakdown } from "./steps/SummaryStep";
import ContactStep, { ContactData } from "./steps/ContactStep";
import ConfirmationStep from "./steps/ConfirmationStep";

function FormApp() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lang, setLang] = useState(searchParams.get("lang") ?? "cs");

  const { data, error } = useCamp(slug!, lang);

  const [step, setStep] = useState(0);
  const [type, setType] = useState<PublicAccommodationType | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [selectedSurchargeIds, setSelectedSurchargeIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ totalPrice: number; nights: number } | null>(null);
  const [serverError, setServerError] = useState("");
  const [contactData, setContactData] = useState<ContactData | null>(null);

  const occupied = useOccupied(slug!, type?.id ?? null);
  const t = useT(lang);

  const handleLangChange = (code: string) => {
    setLang(code);
    setSearchParams({ lang: code });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-2xl mb-2">😔</p>
          <p className="text-gray-600">{t.errorFormNotFound}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">…</div>
      </div>
    );
  }

  const { camp, languages } = data;
  const langObj = languages.find((l) => l.code === lang) ?? languages[0];
  const nights = checkIn && checkOut ? Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000) : 0;

  const breakdown =
    type && checkIn && checkOut
      ? calcBreakdown(camp, type, checkIn, checkOut, adults, children, selectedSurchargeIds, langObj)
      : null;

  const handleSubmit = async (contact: ContactData) => {
    setContactData(contact);
    setSubmitting(true);
    setServerError("");
    try {
      const res = await api.post(`/camp/${slug}/reserve`, {
        accommodationTypeId: type?.id,
        checkIn: checkIn!.toISOString().slice(0, 10),
        checkOut: checkOut!.toISOString().slice(0, 10),
        adults,
        children,
        selectedSurchargeIds,
        ...contact,
        languageCode: lang,
      });
      setConfirmed({ totalPrice: res.data.totalPrice, nights: res.data.nights });
      setStep(4);
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setServerError(code === "no_availability" ? t.errorNoAvailability : t.errorGeneral);
    } finally {
      setSubmitting(false);
    }
  };

  const mandatoryIds = camp.surcharges.filter((s) => !s.isOptional).map((s) => s.id);
  const allSelected = [...new Set([...mandatoryIds, ...selectedSurchargeIds])];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-lg mx-auto">
        <LanguageSwitcher languages={languages} current={lang} onChange={handleLangChange} />

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{camp.name}</h1>
        </div>

        {step < 4 && <StepIndicator current={step} lang={langObj} />}

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{serverError}</div>
        )}

        {step === 0 && (
          <TypeStep
            camp={camp}
            selected={type}
            lang={langObj}
            onSelect={(selected) => { setType(selected); setStep(1); }}
          />
        )}
        {step === 1 && (
          <DateStep
            occupied={occupied}
            value={{ checkIn, checkOut }}
            onChange={({ checkIn: ci, checkOut: co }) => { setCheckIn(ci); setCheckOut(co); }}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
            lang={langObj}
          />
        )}
        {step === 2 && type && checkIn && checkOut && (
          <ConfigStep
            camp={camp}
            type={type}
            checkIn={checkIn}
            checkOut={checkOut}
            adults={adults}
            children={children}
            selectedSurchargeIds={selectedSurchargeIds}
            lang={langObj}
            onChangeAdults={setAdults}
            onChangeChildren={setChildren}
            onChangeSurcharges={setSelectedSurchargeIds}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && breakdown && (
          <ContactStep
            breakdown={breakdown}
            lang={langObj}
            onSubmit={handleSubmit}
            onBack={() => setStep(2)}
            submitting={submitting}
          />
        )}
        {step === 4 && confirmed && contactData && checkIn && checkOut && (
          <ConfirmationStep
            firstName={contactData.firstName}
            checkIn={checkIn}
            checkOut={checkOut}
            totalPrice={confirmed.totalPrice}
            lang={langObj}
            nights={confirmed.nights}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/form/:slug" element={<FormApp />} />
      <Route path="*" element={<Navigate to="/form/demo" replace />} />
    </Routes>
  );
}
