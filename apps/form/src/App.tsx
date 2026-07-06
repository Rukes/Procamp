import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
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
import { initAnalytics, trackBeginCheckout, trackPurchase } from "./hooks/useAnalytics";

function InfoModal({ html, onClose, title }: { html: string; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80dvh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto px-6 py-5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

function FormApp() {
  const { orgSlug, campSlug } = useParams<{ orgSlug: string; campSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lang, setLang] = useState(searchParams.get("lang") ?? "cs");
  const [infoOpen, setInfoOpen] = useState(false);

  const { data, error } = useCamp(orgSlug!, campSlug!, lang);

  const [step, setStep] = useState(0);
  const [type, setType] = useState<PublicAccommodationType | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [selectedSurchargeIds, setSelectedSurchargeIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ totalPrice: number; nights: number; bookingCode?: string; status?: string } | null>(null);
  const [serverError, setServerError] = useState("");
  const [contactData, setContactData] = useState<ContactData | null>(null);

  const occupied = useOccupied(orgSlug!, campSlug!, type?.id ?? null);
  const t = useT(lang);
  const gaInitialized = useRef(false);

  const gaTrackingId = data?.gaTrackingId ?? null;
  const hideCopyright = data?.hideCopyright ?? false;
  useEffect(() => {
    if (!gaInitialized.current && data) {
      initAnalytics(gaTrackingId);
      gaInitialized.current = true;
    }
  }, [data, gaTrackingId]);

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

  const { camp, languages, termsText, requireTermsAcceptance } = data;

  if (!languages?.length || !camp.accommodationTypes?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-gray-500">Rezervace zatím není možná.</p>
        </div>
      </div>
    );
  }

  const langObj = languages.find((l) => l.code === lang) ?? languages[0];
  const nights = checkIn && checkOut ? Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000) : 0;

  const breakdown =
    type && checkIn && checkOut
      ? calcBreakdown(camp, type, checkIn, checkOut, adults, children, selectedSurchargeIds, langObj, t)
      : null;

  const handleSubmit = async (contact: ContactData) => {
    setContactData(contact);
    setSubmitting(true);
    setServerError("");
    try {
      const res = await api.post(`/camp/${orgSlug}/${campSlug}/reserve`, {
        accommodationTypeId: type?.id,
        checkIn: format(checkIn!, "yyyy-MM-dd"),
        checkOut: format(checkOut!, "yyyy-MM-dd"),
        adults,
        children,
        selectedSurchargeIds,
        ...contact,
        languageCode: lang,
      });
      setConfirmed({ totalPrice: res.data.totalPrice, nights: res.data.nights, bookingCode: res.data.bookingCode, status: res.data.status });
      trackPurchase({
        reservationId: res.data.id,
        campName: camp.name,
        totalPrice: res.data.totalPrice,
        currency: langObj?.currencyCode ?? "CZK",
        nights: res.data.nights,
      });
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

  const infoHtml = (camp.info as Record<string, string> | undefined)?.[lang] ?? (camp.info as Record<string, string> | undefined)?.["cs"] ?? "";

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 flex flex-col">
      {infoOpen && infoHtml && (
        <InfoModal html={infoHtml} title={t.campInfo} onClose={() => setInfoOpen(false)} />
      )}
      <div className="max-w-lg mx-auto w-full flex-1">
        <div className="flex justify-end mb-0">
          <LanguageSwitcher languages={languages} current={lang} onChange={handleLangChange} />
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">{camp.name}</h1>
          {infoHtml && (
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <i className="fa-regular fa-circle-info" />
              {t.campInfo}
            </button>
          )}
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
            onSelect={(selected) => { setType(selected); setStep(1); trackBeginCheckout(camp.name); }}
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
            termsText={termsText}
            requireTermsAcceptance={requireTermsAcceptance}
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
            bookingCode={confirmed.bookingCode}
            isPending={confirmed.status === "PENDING"}
            onInfo={infoHtml ? () => setInfoOpen(true) : undefined}
          />
        )}
      </div>
      {!hideCopyright && <footer className="mt-auto pt-6 pb-2 flex flex-col items-center gap-2">
        <img
          src={`${import.meta.env.VITE_API_URL ?? ""}/logos/logo-color-notext.png`}
          alt="Ubysoft.cz"
          className="h-10 w-auto opacity-80"
        />
        <p className="text-xs text-gray-400">
          Rezervační systém{" "}
          <a href="https://ubysoft.cz" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-gray-600 transition-colors">
            Ubysoft.cz
          </a>
        </p>
      </footer>}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/form/:orgSlug/:campSlug" element={<FormApp />} />
      <Route path="*" element={<Navigate to="/form/demo/demo" replace />} />
    </Routes>
  );
}
