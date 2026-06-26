import { useTitle } from "../hooks/useTitle";
import Tooltip from "../components/Tooltip";
import HelpModal from "../components/HelpModal";
import { useEffect, useRef, useState } from "react";
import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/github-dark-dimmed.css";
hljs.registerLanguage("html", xml);
import WysiwygEditorShared from "../components/WysiwygEditor";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { Camp, Surcharge, EmailTemplate, Language, AccommodationType, AccommodationTypePrice } from "@procamp/shared";
// SurchargePrice used via Surcharge.prices
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Flag } from "../utils/langFlag";

type Tab = "settings" | "types" | "sms" | "smtp" | "surcharges" | "emails" | "embed" | "booking";

const TEMPLATE_VARS = [
  { key: "{{bookingCode}}", desc: "Kód rezervace" },
  { key: "{{firstName}}", desc: "Jméno zákazníka" },
  { key: "{{lastName}}", desc: "Příjmení zákazníka" },
  { key: "{{email}}", desc: "E-mail zákazníka" },
  { key: "{{phone}}", desc: "Telefon zákazníka" },
  { key: "{{accommodationType}}", desc: "Typ ubytování" },
  { key: "{{checkIn}}", desc: "Datum příjezdu" },
  { key: "{{checkOut}}", desc: "Datum odjezdu" },
  { key: "{{nights}}", desc: "Počet nocí" },
  { key: "{{adults}}", desc: "Počet dospělých" },
  { key: "{{children}}", desc: "Počet dětí" },
  { key: "{{totalPrice}}", desc: "Celková cena (číslo)" },
  { key: "{{totalPriceFormatted}}", desc: "Cena včetně symbolu měny" },
  { key: "{{campName}}", desc: "Název objektu" },
  { key: "{{licensePlate}}", desc: "SPZ vozidla" },
  { key: "{{expectedArrival}}", desc: "Předpokládaný příjezd" },
  { key: "{{note}}", desc: "Poznámka zákazníka" },
];



const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  ADMIN_NOTIFICATION: {
    subject: "Nová rezervace – {{campName}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#1e40af;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;color:#ffffff;font-size:20px">🏕️ Nová rezervace</h1>
    <p style="margin:4px 0 0;color:#bfdbfe;font-size:14px">{{campName}}</p>
  </div>
  <div style="background:#f8fafc;padding:24px 32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none">
    <h2 style="margin:0 0 12px;font-size:15px;color:#374151;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Kontaktní údaje</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
      <tr><td style="padding:6px 0;color:#6b7280;width:180px">Jméno a příjmení</td><td style="padding:6px 0;font-weight:600">{{firstName}} {{lastName}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">E-mail</td><td style="padding:6px 8px"><a href="mailto:{{email}}" style="color:#1e40af">{{email}}</a></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Telefon</td><td style="padding:6px 0">{{phone}}</td></tr>
    </table>
    <h2 style="margin:0 0 12px;font-size:15px;color:#374151;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Rezervace</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
      <tr style="background:#eff6ff"><td style="padding:8px 0;color:#1e40af;font-weight:700;width:180px">Kód rezervace</td><td style="padding:8px 0;font-weight:700;font-size:18px;letter-spacing:0.1em;font-family:monospace;color:#1e40af">{{bookingCode}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;width:180px">Rezervace ubytování</td><td style="padding:6px 0;font-weight:600">{{accommodationType}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">Příjezd</td><td style="padding:6px 8px;font-weight:600">{{checkIn}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Odjezd</td><td style="padding:6px 0;font-weight:600">{{checkOut}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">Počet nocí</td><td style="padding:6px 8px">{{nights}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Dospělí / Děti</td><td style="padding:6px 0">{{adults}} / {{children}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">SPZ</td><td style="padding:6px 8px">{{licensePlate}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Předpokl. příjezd</td><td style="padding:6px 0">{{expectedArrival}}</td></tr>
    </table>
    <h2 style="margin:0 0 12px;font-size:15px;color:#374151;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Cena a poznámka</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
      <tr style="background:#dbeafe"><td style="padding:10px 8px;color:#1e40af;font-weight:700;font-size:15px;width:180px">Celková cena</td><td style="padding:10px 8px;font-weight:700;font-size:15px;color:#1e40af">{{totalPriceFormatted}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Poznámka zákazníka</td><td style="padding:6px 0">{{note}}</td></tr>
    </table>
    <p style="margin:0;font-size:12px;color:#9ca3af;border-top:1px solid #e2e8f0;padding-top:12px">ID rezervace: {{reservationId}}</p>
  </div>
</div>`,
  },
  CUSTOMER_CONFIRMATION: {
    subject: "Potvrzení rezervace – {{campName}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#1e40af;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;color:#ffffff;font-size:20px">🏕️ Rezervace přijata</h1>
    <p style="margin:4px 0 0;color:#bfdbfe;font-size:14px">{{campName}}</p>
  </div>
  <div style="background:#f8fafc;padding:24px 32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none">
    <p style="font-size:15px;margin:0 0 24px">Dobrý den, <strong>{{firstName}}</strong>,<br>děkujeme za vaši rezervaci. Níže najdete shrnutí.</p>
    <h2 style="margin:0 0 12px;font-size:15px;color:#374151;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Vaše rezervace</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
      <tr style="background:#eff6ff"><td style="padding:8px 0;color:#1e40af;font-weight:700;width:180px">Kód rezervace</td><td style="padding:8px 0;font-weight:700;font-size:18px;letter-spacing:0.1em;font-family:monospace;color:#1e40af">{{bookingCode}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;width:180px">Rezervace ubytování</td><td style="padding:6px 0;font-weight:600">{{accommodationType}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">Příjezd</td><td style="padding:6px 8px;font-weight:600">{{checkIn}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Odjezd</td><td style="padding:6px 0;font-weight:600">{{checkOut}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">Počet nocí</td><td style="padding:6px 8px">{{nights}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Dospělí / Děti</td><td style="padding:6px 0">{{adults}} / {{children}}</td></tr>
    </table>
    <h2 style="margin:0 0 12px;font-size:15px;color:#374151;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Cena</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
      <tr style="background:#dbeafe"><td style="padding:10px 8px;color:#1e40af;font-weight:700;font-size:15px;width:180px">Celková cena</td><td style="padding:10px 8px;font-weight:700;font-size:15px;color:#1e40af">{{totalPriceFormatted}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px" colspan="2">Platba probíhá na místě při příjezdu.</td></tr>
    </table>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#15803d">✅ Těšíme se na vás! Máte-li jakékoliv dotazy, stačí na tento e-mail odpovědět.</p>
    </div>
    <p style="margin:0;font-size:12px;color:#9ca3af;border-top:1px solid #e2e8f0;padding-top:12px">ID rezervace: {{reservationId}}</p>
  </div>
</div>`,
  },
  PENDING_CONFIRMATION: {
    subject: "Vaše rezervace čeká na potvrzení – {{campName}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#92400e;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;color:#ffffff;font-size:20px">🏕️ Rezervace přijata – čeká na potvrzení</h1>
    <p style="margin:4px 0 0;color:#fde68a;font-size:14px">{{campName}}</p>
  </div>
  <div style="background:#f8fafc;padding:24px 32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none">
    <p style="font-size:15px;margin:0 0 24px">Dobrý den, <strong>{{firstName}}</strong>,<br>obdrželi jsme vaši žádost o rezervaci. Rezervace bude aktivní po ručním potvrzení ze strany správce — budeme vás informovat e-mailem.</p>
    <h2 style="margin:0 0 12px;font-size:15px;color:#374151;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Přehled rezervace</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
      <tr style="background:#eff6ff"><td style="padding:8px 0;color:#1e40af;font-weight:700;width:180px">Kód rezervace</td><td style="padding:8px 0;font-weight:700;font-size:18px;letter-spacing:0.1em;font-family:monospace;color:#1e40af">{{bookingCode}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;width:180px">Rezervace ubytování</td><td style="padding:6px 0;font-weight:600">{{accommodationType}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">Příjezd</td><td style="padding:6px 8px;font-weight:600">{{checkIn}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Odjezd</td><td style="padding:6px 0;font-weight:600">{{checkOut}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">Počet nocí</td><td style="padding:6px 8px">{{nights}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Dospělí / Děti</td><td style="padding:6px 0">{{adults}} / {{children}}</td></tr>
    </table>
    <h2 style="margin:0 0 12px;font-size:15px;color:#374151;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Předběžná cena</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
      <tr style="background:#fef3c7"><td style="padding:10px 8px;color:#92400e;font-weight:700;font-size:15px;width:180px">Celková cena</td><td style="padding:10px 8px;font-weight:700;font-size:15px;color:#92400e">{{totalPriceFormatted}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px" colspan="2">Cena je předběžná a bude potvrzena spolu s rezervací.</td></tr>
    </table>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#92400e">⏳ Vaše rezervace čeká na potvrzení. Jakmile ji potvrdíme, obdržíte další e-mail. Máte-li dotazy, odpovězte na tento e-mail.</p>
    </div>
    <p style="margin:0;font-size:12px;color:#9ca3af;border-top:1px solid #e2e8f0;padding-top:12px">ID rezervace: {{reservationId}}</p>
  </div>
</div>`,
  },
};

function WysiwygEditor({ value, onChange, showVars = true }: { value: string; onChange: (v: string) => void; showVars?: boolean }) {
  return <WysiwygEditorShared value={value} onChange={onChange} vars={showVars ? TEMPLATE_VARS : undefined} />;
}

// --- Příplatek editor ---
interface SurchargeEditorProps {
  surcharge: Surcharge | null;
  languages: Language[];
  campId: string;
  accommodationTypes: AccommodationType[];
  onSave: () => void;
  onClose: () => void;
}

function SurchargeEditor({ surcharge, languages, campId, accommodationTypes, onSave, onClose }: SurchargeEditorProps) {
  const toast = useToast();
  const [activeLang, setActiveLang] = useState(languages[0]?.code ?? "cs");
  const [names, setNames] = useState<Record<string, string>>(() => {
    if (!surcharge) return {};
    const t = surcharge.translations as Record<string, { name: string }>;
    return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.name]));
  });
  const isOptional = true;
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    if (!surcharge) return {};
    const t = surcharge.translations as Record<string, { name: string; note?: string }>;
    return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.note ?? ""]));
  });
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    if (!surcharge) return {};
    return Object.fromEntries(surcharge.prices.map((p) => [p.languageCode, String(p.pricePerNight)]));
  });
  const [applicableTypeIds, setApplicableTypeIds] = useState<string[]>(
    (surcharge as (Surcharge & { applicableTypeIds?: string[] }) | null)?.applicableTypeIds ?? []
  );
  const [isHidden, setIsHidden] = useState<boolean>((surcharge as (Surcharge & { isHidden?: boolean }) | null)?.isHidden ?? false);
  const [saving, setSaving] = useState(false);

  const allNamesFilled = languages.every((l) => names[l.code]?.trim());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const translations = Object.fromEntries(
        Object.entries(names).filter(([, v]) => v.trim()).map(([k, v]) => [k, {
          name: v.trim(),
          ...(notes[k]?.trim() ? { note: notes[k].trim() } : {}),
        }])
      );
      let surchargeId: string;
      if (surcharge) {
        await api.put(`/camps/${campId}/surcharges/${surcharge.id}`, { isOptional, isHidden, translations, applicableTypeIds });
        surchargeId = surcharge.id;
      } else {
        const res = await api.post(`/camps/${campId}/surcharges`, { isOptional, isHidden, translations, applicableTypeIds });
        surchargeId = res.data.id;
      }
      for (const [lang, price] of Object.entries(prices)) {
        await api.put(`/camps/${campId}/surcharges/${surchargeId}/prices/${lang}`, { pricePerNight: parseFloat(price) || 0 });
      }
      toast.success("Příplatek uložen.");
      onSave();
    } catch {
      toast.error("Nepodařilo se uložit příplatek.");
    } finally {
      setSaving(false);
    }
  };

  const lang = languages.find((l) => l.code === activeLang);
  const sym = lang?.currencySymbol ?? "";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-12 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold">{surcharge ? "Upravit příplatek" : "Nový příplatek"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><i className="fa-regular fa-xmark text-lg" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div>
            <div className="flex gap-1 border-b border-gray-200 mb-4">
              {languages.map((l) => {
                const filled = !!(names[l.code]?.trim());
                return (
                  <button key={l.code} type="button" onClick={() => setActiveLang(l.code)}
                    className={`px-3 py-1.5 text-sm border-b-2 transition-colors flex items-center gap-1.5 ${activeLang === l.code ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}>
                    <Flag code={l.code} /> {l.name}
                    {filled && <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Název</label>
                <input className="input" value={names[activeLang] ?? ""} onChange={(e) => setNames({ ...names, [activeLang]: e.target.value })} placeholder="Např. Turistická daň, Pes…" />
              </div>
              <div>
                <label className="label">Cena / noc {sym && <span className="text-gray-400">({sym})</span>}</label>
                <input className="input" type="number" min="0" step="0.01"
                  value={prices[activeLang] ?? ""}
                  onChange={(e) => setPrices({ ...prices, [activeLang]: e.target.value })}
                  placeholder="0" />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Poznámka <span className="text-gray-400 font-normal">(nepovinné — zobrazí se v formuláři po najetí na <code>i</code>)</span></label>
            <input className="input" value={notes[activeLang] ?? ""} onChange={(e) => setNotes({ ...notes, [activeLang]: e.target.value })} placeholder="Např. cena za jednoho psa za noc…" />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-red-600" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} />
            <span className="text-sm font-medium text-gray-700">Nezobrazovat ve formuláři <span className="text-gray-400 font-normal">(příplatek bude skrytý pro zákazníky)</span></span>
          </label>

          {!isHidden && accommodationTypes.length > 0 && (
            <div>
              <label className="label">Zobrazit pro typy ubytování <span className="text-gray-400 font-normal">(prázdné = všechny)</span></label>
              <div className="flex flex-wrap gap-2 mt-1">
                {accommodationTypes.map((t) => {
                  const tr = t.translations as Record<string, { name: string }>;
                  const name = tr.cs?.name ?? tr[Object.keys(tr)[0]]?.name ?? t.id;
                  const checked = applicableTypeIds.includes(t.id);
                  return (
                    <label key={t.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-colors ${checked ? "bg-blue-50 border-blue-300 text-blue-800" : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"}`}>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={(e) => setApplicableTypeIds(e.target.checked ? [...applicableTypeIds, t.id] : applicableTypeIds.filter((id) => id !== t.id))}
                      />
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                        {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </span>
                      {name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button className="btn-primary" type="submit" disabled={saving || !allNamesFilled} title={!allNamesFilled ? "Vyplňte název ve všech jazycích" : undefined}>
              {saving ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ukládám…</> : <><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit</>}
            </button>
            <button className="btn-secondary" type="button" onClick={onClose}><i className="fa-regular fa-xmark mr-1.5" />Zrušit</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Typ ubytování editor ---
interface TypeEditorProps {
  type: AccommodationType | null;
  languages: Language[];
  campId: string;
  hideAdults: boolean;
  hideChildren: boolean;
  onSave: () => void;
  onClose: () => void;
}

function AccommodationTypeEditor({ type, languages, campId, hideAdults, hideChildren, onSave, onClose }: TypeEditorProps) {
  const toast = useToast();
  const [activeLang, setActiveLang] = useState(languages[0]?.code ?? "cs");
  const [names, setNames] = useState<Record<string, string>>(() => {
    if (!type) return {};
    const t = type.translations as Record<string, { name: string; shortDescription?: string; longDescription?: string }>;
    return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.name]));
  });
  const [shortDescriptions, setShortDescriptions] = useState<Record<string, string>>(() => {
    if (!type) return {};
    const t = type.translations as Record<string, { name: string; shortDescription?: string; longDescription?: string }>;
    return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.shortDescription ?? ""]));
  });
  const [longDescriptions, setLongDescriptions] = useState<Record<string, string>>(() => {
    if (!type) return {};
    const t = type.translations as Record<string, { name: string; shortDescription?: string; longDescription?: string }>;
    return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.longDescription ?? ""]));
  });
  const [capacity, setCapacity] = useState(type?.capacity ?? 1);
  const [maxAdults, setMaxAdults] = useState<number | "">(type?.maxAdults ?? "");
  const [maxChildren, setMaxChildren] = useState<number | "">(type?.maxChildren ?? "");
  const [prices, setPrices] = useState<Record<string, { pricePerNight: string; adultPricePerNight: string; childPricePerNight: string }>>(() => {
    if (!type) return {};
    return Object.fromEntries(type.prices.map((p) => [p.languageCode, { pricePerNight: String(p.pricePerNight), adultPricePerNight: String(p.adultPricePerNight), childPricePerNight: String(p.childPricePerNight) }]));
  });
  const [useDynamicPricing, setUseDynamicPricing] = useState(type?.useDynamicPricing ?? false);
  // fromNights: sorted list of "od noci" values (e.g. [1, 3, 5])
  const [fromNights, setFromNights] = useState<number[]>(() => {
    if (!type?.nightTiers?.length) return [1];
    return type.nightTiers.map((t) => t.fromNight);
  });
  // tierPrices: tierId → lang → price string (for existing tiers)
  // For new/unsaved tiers we key by fromNight
  const [tierPrices, setTierPrices] = useState<Record<string, Record<string, string>>>(() => {
    if (!type?.nightTiers?.length) return {};
    return Object.fromEntries(type.nightTiers.map((t) => [
      String(t.fromNight),
      Object.fromEntries(t.prices.map((p) => [p.languageCode, String(p.pricePerNight)])),
    ]));
  });
  const [saving, setSaving] = useState(false);

  const getPrice = (lang: string) => prices[lang] ?? { pricePerNight: "0", adultPricePerNight: "0", childPricePerNight: "0" };
  const setPrice = (lang: string, field: "pricePerNight" | "adultPricePerNight" | "childPricePerNight", val: string) => {
    setPrices((prev) => ({ ...prev, [lang]: { ...getPrice(lang), [field]: val } }));
  };
  const getTierPrice = (fromNight: number, lang: string) => tierPrices[String(fromNight)]?.[lang] ?? "0";
  const setTierPrice = (fromNight: number, lang: string, val: string) => {
    setTierPrices((prev) => ({ ...prev, [String(fromNight)]: { ...(prev[String(fromNight)] ?? {}), [lang]: val } }));
  };

  const addTier = () => {
    const last = fromNights[fromNights.length - 1] ?? 0;
    setFromNights((prev) => [...prev, last + 1]);
  };
  const removeTier = (idx: number) => {
    if (fromNights.length <= 1) return;
    const removed = fromNights[idx];
    setFromNights((prev) => prev.filter((_, i) => i !== idx));
    setTierPrices((prev) => { const n = { ...prev }; delete n[String(removed)]; return n; });
  };
  const updateFromNight = (idx: number, val: number) => {
    setFromNights((prev) => prev.map((v, i) => i === idx ? val : v));
  };

  const tiersValid = () => {
    if (!useDynamicPricing) return true;
    const sorted = [...fromNights].sort((a, b) => a - b);
    if (sorted[0] !== 1) return false;
    for (let i = 1; i < sorted.length; i++) if (sorted[i] <= sorted[i - 1]) return false;
    // All tier prices filled for all languages
    for (const fn of fromNights) {
      for (const l of languages) {
        const v = parseFloat(getTierPrice(fn, l.code));
        if (isNaN(v) || v < 0) return false;
      }
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const translations = Object.fromEntries(
        Object.entries(names).filter(([, v]) => v.trim()).map(([k, v]) => [k, {
          name: v.trim(),
          ...(shortDescriptions[k]?.trim() ? { shortDescription: shortDescriptions[k].trim() } : {}),
          ...(longDescriptions[k]?.trim() ? { longDescription: longDescriptions[k].trim() } : {}),
        }])
      );
      const numericPrices = Object.fromEntries(
        Object.entries(prices).map(([lang, p]) => [lang, {
          pricePerNight: parseFloat(p.pricePerNight) || 0,
          adultPricePerNight: parseFloat(p.adultPricePerNight) || 0,
          childPricePerNight: parseFloat(p.childPricePerNight) || 0,
        }])
      );
      const typePayload = { translations, capacity, maxAdults: maxAdults === "" ? null : maxAdults, maxChildren: maxChildren === "" ? null : maxChildren };
      const typeId = type ? type.id : (await api.post(`/camps/${campId}/accommodation-types`, typePayload)).data.id;
      if (type) await api.put(`/camps/${campId}/accommodation-types/${type.id}`, typePayload);
      for (const [lang, p] of Object.entries(numericPrices)) {
        await api.put(`/camps/${campId}/accommodation-types/${typeId}/prices/${lang}`, p);
      }
      // Save dynamic pricing tiers
      const tiersRes = await api.put(`/camps/${campId}/accommodation-types/${typeId}/night-tiers`, { useDynamicPricing, fromNights: useDynamicPricing ? fromNights : [] });
      if (useDynamicPricing) {
        const savedTiers: { id: string; fromNight: number }[] = tiersRes.data.nightTiers ?? [];
        for (const tier of savedTiers) {
          for (const l of languages) {
            const priceVal = parseFloat(getTierPrice(tier.fromNight, l.code)) || 0;
            await api.put(`/camps/${campId}/accommodation-types/${typeId}/night-tiers/${tier.id}/prices/${l.code}`, { pricePerNight: priceVal });
          }
        }
      }
      toast.success("Typ ubytování uložen.");
      onSave();
    } catch {
      toast.error("Nepodařilo se uložit typ ubytování.");
    } finally {
      setSaving(false);
    }
  };

  const allNamesFilled = languages.every((l) => names[l.code]?.trim());

  const lang = languages.find((l) => l.code === activeLang);
  const sym = lang?.currencySymbol ?? "";
  const p = getPrice(activeLang);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-12 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold">{type ? "Upravit typ ubytování" : "Nový typ ubytování"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><i className="fa-regular fa-xmark text-lg" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Kapacita */}
          <div>
            <label className="label">Kapacita (počet míst)</label>
            <input className="input max-w-xs" type="number" min="-1" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
            <div className="text-xs text-gray-400 mt-1 space-y-0.5">
              <p><code className="bg-gray-100 px-1 rounded">0</code> = vypnuto — typ se nezobrazí v rezervačním formuláři</p>
              <p><code className="bg-gray-100 px-1 rounded">-1</code> = neomezená kapacita — vždy dostupný</p>
              <p><code className="bg-gray-100 px-1 rounded">1+</code> = maximální počet souběžných rezervací pro dané termíny</p>
            </div>
          </div>

          {/* Kapacita lůžek */}
          {(!hideAdults || !hideChildren) && (
            <div>
              <label className="label">Kapacita lůžek <span className="text-gray-400 font-normal">(nepovinné)</span></label>
              <div className="flex gap-3">
                {!hideAdults && (
                  <div className="flex-1">
                    <label className="label">Dospělí</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      placeholder="bez limitu"
                      value={maxAdults}
                      onChange={(e) => setMaxAdults(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>
                )}
                {!hideChildren && (
                  <div className="flex-1">
                    <label className="label">Děti</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      placeholder="bez limitu"
                      value={maxChildren}
                      onChange={(e) => setMaxChildren(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Typ ceny */}
          <div>
            <label className="label">Typ ceny</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setUseDynamicPricing(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${!useDynamicPricing ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"}`}>
                Cena za noc
              </button>
              <button type="button" onClick={() => setUseDynamicPricing(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${useDynamicPricing ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"}`}>
                Dynamická cena
              </button>
            </div>
          </div>

          {/* Hladiny — pouze Od noci, mimo jazyk */}
          {useDynamicPricing && (
            <div className="border border-blue-200 rounded-xl p-4 space-y-3 bg-blue-50">
              <p className="text-sm font-medium text-blue-800">Cenové hladiny <span className="text-xs font-normal text-blue-600">(první hladina musí být od 1 noci)</span></p>
              {fromNights.map((fn, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-16">Od noci</span>
                    <input
                      className="input w-20 text-center"
                      type="number" min="1"
                      value={fn}
                      onChange={(e) => updateFromNight(idx, parseInt(e.target.value) || 1)}
                      disabled={idx === 0}
                    />
                  </div>
                  {idx > 0 && (
                    <button type="button" onClick={() => removeTier(idx)} className="text-red-400 hover:text-red-600 text-sm">
                      <i className="fa-regular fa-trash" />
                    </button>
                  )}
                  {idx === fromNights.length - 1 && <span className="text-xs text-gray-400 ml-auto">a více nocí</span>}
                </div>
              ))}
              <button type="button" onClick={addTier} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
                <i className="fa-regular fa-plus" /> Přidat hladinu
              </button>
              {fromNights[0] !== 1 && <p className="text-xs text-red-500">První hladina musí začínat od 1 noci.</p>}
            </div>
          )}

          {/* Záložky per jazyk — název + ceny dohromady */}
          <div>
            <div className="flex gap-1 border-b border-gray-200 mb-4">
              {languages.map((l) => {
                const filled = !!(names[l.code]?.trim());
                return (
                  <button key={l.code} type="button" onClick={() => setActiveLang(l.code)}
                    className={`px-3 py-1.5 text-sm border-b-2 transition-colors flex items-center gap-1.5 ${activeLang === l.code ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}>
                    <Flag code={l.code} /> {l.name}
                    {filled && <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Název</label>
                <input className="input" value={names[activeLang] ?? ""} onChange={(e) => setNames({ ...names, [activeLang]: e.target.value })} placeholder="Např. Karavan, Stan, Chata…" />
              </div>
              <div>
                <label className="label">Krátký popis <span className="text-gray-400 font-normal">(nepovinné — zobrazí se pod cenou v rezervačním formuláři)</span></label>
                <input className="input" value={shortDescriptions[activeLang] ?? ""} onChange={(e) => setShortDescriptions({ ...shortDescriptions, [activeLang]: e.target.value })} placeholder="Např. vhodné pro 2 osoby, s připojením na elektřinu…" />
              </div>
              <div>
                <label className="label">Podrobný popis <span className="text-gray-400 font-normal">(nepovinné — zobrazí se po kliknutí na <code>i</code>)</span></label>
                <WysiwygEditor key={activeLang} value={longDescriptions[activeLang] ?? ""} onChange={(v) => setLongDescriptions({ ...longDescriptions, [activeLang]: v })} showVars={false} />
              </div>
              {useDynamicPricing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="label">Ceny dle počtu nocí {sym && <span className="text-gray-400">({sym})</span>}</label>
                    {fromNights.map((fn, idx) => (
                      <div key={fn} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-32 shrink-0">
                          {idx < fromNights.length - 1 ? `Od ${fn} ${fn === 1 ? "noci" : fn < 5 ? "nocí" : "nocí"}` : `Od ${fn} nocí a více`}
                        </span>
                        <input
                          className="input w-32"
                          type="number" min="0" step="0.01"
                          value={getTierPrice(fn, activeLang)}
                          onChange={(e) => setTierPrice(fn, activeLang, e.target.value)}
                        />
                        <span className="text-sm text-gray-400">{sym} / noc</span>
                      </div>
                    ))}
                  </div>
                  {(!hideAdults || !hideChildren) && (
                    <div className="grid grid-cols-2 gap-3">
                      {!hideAdults && (
                        <div>
                          <label className="label">Dospělý / noc {sym && <span className="text-gray-400">({sym})</span>}</label>
                          <input className="input" type="number" min="0" step="0.01" value={p.adultPricePerNight} onChange={(e) => setPrice(activeLang, "adultPricePerNight", e.target.value)} />
                        </div>
                      )}
                      {!hideChildren && (
                        <div>
                          <label className="label">Dítě / noc {sym && <span className="text-gray-400">({sym})</span>}</label>
                          <input className="input" type="number" min="0" step="0.01" value={p.childPricePerNight} onChange={(e) => setPrice(activeLang, "childPricePerNight", e.target.value)} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">Cena / noc {sym && <span className="text-gray-400">({sym})</span>}</label>
                    <input className="input" type="number" min="0" step="0.01" value={p.pricePerNight} onChange={(e) => setPrice(activeLang, "pricePerNight", e.target.value)} />
                  </div>
                  {!hideAdults && (
                    <div>
                      <label className="label">Dospělý / noc {sym && <span className="text-gray-400">({sym})</span>}</label>
                      <input className="input" type="number" min="0" step="0.01" value={p.adultPricePerNight} onChange={(e) => setPrice(activeLang, "adultPricePerNight", e.target.value)} />
                    </div>
                  )}
                  {!hideChildren && (
                    <div>
                      <label className="label">Dítě / noc {sym && <span className="text-gray-400">({sym})</span>}</label>
                      <input className="input" type="number" min="0" step="0.01" value={p.childPricePerNight} onChange={(e) => setPrice(activeLang, "childPricePerNight", e.target.value)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button className="btn-primary" type="submit" disabled={saving || !allNamesFilled || !tiersValid()} title={!allNamesFilled ? "Vyplňte název ve všech jazycích" : !tiersValid() ? "Opravte cenové hladiny" : undefined}>
              {saving ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ukládám…</> : <><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit</>}
            </button>
            <button className="btn-secondary" type="button" onClick={onClose}><i className="fa-regular fa-xmark mr-1.5" />Zrušit</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const BOOKING_CONDITIONS = `iCal synchronizace je na Booking.com dostupná pouze pokud nemovitost:
• je otevřená a rezervovatelná
• nemá napojený Connectivity provider (channel manager jako Prievio apod.)
• má max. 20 typů pokojů, každý s max. 1 jednotkou

Změny v Booking.com se synchronizují přibližně každou hodinu. Booking.com si náš export stahuje obvykle do 30 minut až několika hodin.`;

// --- Booking záložka ---
function BookingTab({ camp, campId, onRefresh, onHelp }: { camp: Camp; campId: string; onRefresh: () => void; onHelp: () => void }) {
  const toast = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [regeneratingHash, setRegeneratingHash] = useState(false);
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const [icalUrls, setIcalUrls] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const t of camp.accommodationTypes ?? []) map[t.id] = (t as any).bookingIcalUrl ?? "";
    return map;
  });

  const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
  const campHash = (camp as any).bookingExportHash as string | null | undefined;

  const handleSave = async (typeId: string) => {
    setSaving(typeId);
    try {
      await api.put(`/camps/${campId}/accommodation-types/${typeId}/booking`, { bookingIcalUrl: icalUrls[typeId] || null });
      toast.success("Uloženo.");
      onRefresh();
    } catch { toast.error("Nepodařilo se uložit."); } finally { setSaving(null); }
  };

  const handleSync = async (typeId: string) => {
    setSyncing(typeId);
    try {
      const res = await api.post(`/camps/${campId}/accommodation-types/${typeId}/booking/sync`);
      const { added, updated, removed } = res.data;
      toast.success(`Sync dokončen: +${added} přidáno, ~${updated} aktualizováno, -${removed} smazáno`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Sync selhal.");
    } finally {
      setSyncing(null);
      onRefresh();
    }
  };

  const handleToggleExport = async (typeId: string, enabled: boolean) => {
    if (enabled && !campHash) { toast.error("Nejprve vygenerujte exportní hash objektu."); return; }
    try {
      await api.put(`/camps/${campId}/accommodation-types/${typeId}/booking`, { bookingExportEnabled: enabled });
      toast.success(enabled ? "Export aktivován." : "Export deaktivován.");
      onRefresh();
    } catch { toast.error("Nepodařilo se změnit stav."); }
  };

  const handleRegenerateHash = async (isFirst: boolean) => {
    if (!isFirst && !confirm("Přegenerovat hash? Všechny exportní URL přestanou fungovat.")) return;
    setRegeneratingHash(true);
    try {
      await api.post(`/camps/${campId}/booking/regenerate-hash`);
      toast.success(isFirst ? "Hash vygenerován." : "Hash přegenerován.");
      onRefresh();
    } catch { toast.error("Nepodařilo se přegenerovat hash."); } finally { setRegeneratingHash(false); }
  };

  const types = (camp.accommodationTypes ?? []) as (AccommodationType & { bookingIcalUrl?: string | null; bookingExportEnabled?: boolean })[];

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Podmínky + nápověda — jedna linie */}
      <div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
            onClick={() => setConditionsOpen((v) => !v)}
          >
            <i className={`fa-regular fa-chevron-${conditionsOpen ? "up" : "down"} text-[10px]`} />
            Podmínky iCal synchronizace s Booking.com
          </button>
          <button type="button" onClick={onHelp} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
            <i className="fa-regular fa-circle-question" />
            Nápověda k integraci
          </button>
        </div>
        {conditionsOpen && (
          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 whitespace-pre-line">
            {BOOKING_CONDITIONS}
          </div>
        )}
      </div>

      {/* Hash na úrovni objektu */}
      <div className="card p-5">
        <h4 className="font-semibold text-gray-900 mb-1">Exportní hash objektu</h4>
        <p className="text-xs text-gray-400 mb-3">
          Jeden sdílený hash pro všechny exportní URL tohoto objektu. Přegenerováním se zneplatní všechny stávající URL.
        </p>
        {campHash ? (
          <div className="flex items-center gap-2">
            <input
              className="input flex-1 font-mono text-xs text-gray-400 bg-gray-50"
              readOnly
              value={campHash}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 whitespace-nowrap text-gray-600"
              disabled={regeneratingHash}
              onClick={() => handleRegenerateHash(false)}
            >
              {regeneratingHash ? "Generuji…" : "Přegenerovat"}
            </button>
          </div>
        ) : (
          <button type="button" className="btn-secondary" disabled={regeneratingHash} onClick={() => handleRegenerateHash(true)}>
            {regeneratingHash ? "Generuji…" : "Vygenerovat hash"}
          </button>
        )}
      </div>

      {/* Per typ */}
      {types.map((type) => {
        const name = (type.translations as any)?.cs?.name ?? (type.translations as any)?.[Object.keys(type.translations as any)[0]]?.name ?? "Typ ubytování";
        const exportUrl = campHash ? `${apiBase}/api/public/ical/${type.id}/${campHash}` : null;
        return (
          <div key={type.id} className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">{name}</h4>
              {user?.isSuperAdmin && (type as any).bookingIcalUrl && (
                <Tooltip text="Spustit synchronizaci nyní" position="left">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-40"
                    disabled={syncing === type.id}
                    onClick={() => handleSync(type.id)}
                  >
                    <i className={`fa-regular fa-arrows-rotate ${syncing === type.id ? "animate-spin" : ""}`} />
                  </button>
                </Tooltip>
              )}
            </div>

            {/* Import */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Import z Booking.com (iCal URL)</label>
              <p className="text-xs text-gray-400 mb-2">Najdete v extranetu Booking.com: Kalendář → Synchronizovat → Exportovat kalendář</p>
              <div className="flex gap-2">
                <input
                  className="input flex-1 font-mono text-sm"
                  placeholder="https://ical.booking.com/v1/export?t=..."
                  value={icalUrls[type.id] ?? ""}
                  onChange={(e) => setIcalUrls((prev) => ({ ...prev, [type.id]: e.target.value }))}
                />
                <button type="button" className="btn-primary whitespace-nowrap" disabled={saving === type.id} onClick={() => handleSave(type.id)}>
                  {saving === type.id ? "Ukládám…" : "Uložit"}
                </button>
              </div>
            </div>

            {/* Export */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Export do Booking.com</label>
              <p className="text-xs text-gray-400 mb-3">Tuto URL zadejte v extranetu Booking.com: Kalendář → Synchronizovat → Importovat kalendář</p>
              {exportUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input className="input flex-1 font-mono text-xs text-gray-500 bg-gray-50" readOnly value={exportUrl} onClick={(e) => (e.target as HTMLInputElement).select()} />
                    <button type="button" className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50" onClick={() => navigator.clipboard.writeText(exportUrl).then(() => toast.success("Zkopírováno!"))}>
                      <i className="fa-regular fa-copy" />
                    </button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded" checked={!!type.bookingExportEnabled} onChange={(e) => handleToggleExport(type.id, e.target.checked)} />
                    <span className="text-sm text-gray-700">Aktivní</span>
                  </label>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Nejprve vygenerujte exportní hash objektu výše.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Hlavní stránka ---
export default function CampDetailPage() {
  useTitle("Detail objektu");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuth();
  const toast = useToast();
  const [camp, setCamp] = useState<Camp | null>(null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const location = useLocation();
  const [tab, setTab] = useState<Tab>((location.state as { tab?: Tab } | null)?.tab ?? "settings");
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTested, setSmtpTested] = useState(false);
  const [useCustomSmtp, setUseCustomSmtp] = useState(false);
  const [hideAdults, setHideAdults] = useState(false);
  const [hideChildren, setHideChildren] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editTpl, setEditTpl] = useState<EmailTemplate | null>(null);
  const [tplBody, setTplBody] = useState("");
  const [tplSubject, setTplSubject] = useState("");
  const [tplKey, setTplKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpIntegraceOpen, setHelpIntegraceOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoLang, setInfoLang] = useState("");
  const [previewModal, setPreviewModal] = useState<{ title: string; subject?: string; html: string } | null>(null);
  const [infoValues, setInfoValues] = useState<Record<string, string>>({});
  const [savingInfo, setSavingInfo] = useState(false);
  const [smsNotifyCustomer, setSmsNotifyCustomer] = useState(false);
  const [smsNotifyAdmin, setSmsNotifyAdmin] = useState(false);
  const [smsAdminPhones, setSmsAdminPhones] = useState("");
  const [smsTemplates, setSmsTemplates] = useState<Record<string, string>>({});
  const [smsCredit, setSmsCredit] = useState<{ currentCredit: number; currency: string } | null>(null);
  const [smsCreditLoading, setSmsCreditLoading] = useState(false);
  const [smsPhoneError, setSmsPhoneError] = useState("");
  const [smsLengthHelpOpen, setSmsLengthHelpOpen] = useState(false);
  const [smsTestOpen, setSmsTestOpen] = useState(false);
  const [smsTestPhone, setSmsTestPhone] = useState("");
  const [smsTestLang, setSmsTestLang] = useState("");
  const [smsTestSending, setSmsTestSending] = useState(false);
  const [smsTestResult, setSmsTestResult] = useState<{ ok: boolean; message: string; detail?: Record<string, unknown> } | null>(null);

  // Accommodation type editor
  const [editType, setEditType] = useState<AccommodationType | null | "new">(null);
  const [translationsType, setTranslationsType] = useState<AccommodationType | null>(null);
  const [typeOrder, setTypeOrder] = useState<string[]>([]);
  const [surchargeOrder, setSurchargeOrder] = useState<string[]>([]);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);

  const moveType = (id: string, dir: -1 | 1) => {
    setTypeOrder((prev) => {
      const next = [...prev];
      const idx = next.indexOf(id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      api.put(`/camps/${camp?.id}/accommodation-types/reorder`, { order: next }).catch(() => toast.error("Nepodařilo se uložit pořadí."));
      return next;
    });
  };

  const moveSurcharge = (id: string, dir: -1 | 1) => {
    setSurchargeOrder((prev) => {
      const next = [...prev];
      const idx = next.indexOf(id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      api.put(`/camps/${camp?.id}/surcharges/reorder`, { order: next }).catch(() => toast.error("Nepodařilo se uložit pořadí."));
      return next;
    });
  };

  // Surcharge editor
  const [editSurcharge, setEditSurcharge] = useState<Surcharge | null | "new">(null);

  const load = async () => {
    const [campRes, langRes, tplRes] = await Promise.all([
      api.get(`/camps/${id}`),
      api.get("/languages"),
      api.get(`/email-templates/${id}`),
    ]);
    setCamp(campRes.data);
    setTypeOrder(campRes.data.accommodationTypes?.map((t: AccommodationType) => t.id) ?? []);
    setSurchargeOrder(campRes.data.surcharges?.map((s: Surcharge) => s.id) ?? []);
    setUseCustomSmtp(campRes.data.useCustomSmtp ?? false);
    setHideAdults(campRes.data.hideAdults ?? false);
    setHideChildren(campRes.data.hideChildren ?? false);
    setInfoValues(campRes.data.info ?? {});
    setSmsNotifyCustomer(campRes.data.smsNotifyCustomer ?? false);
    setSmsNotifyAdmin(campRes.data.smsNotifyAdmin ?? false);
    setSmsAdminPhones((campRes.data.smsAdminPhones ?? []).join(", "));
    setSmsTemplates((campRes.data.smsTemplates ?? {}) as Record<string, string>);
    setInfoLang(langRes.data[0]?.code ?? "cs");
    setLanguages(langRes.data);
    setTemplates(tplRes.data);
    setOrgSlug(campRes.data.organization?.slug ?? null);
  };

  useEffect(() => { load(); }, [id]);

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    try {
      const res = await api.put(`/camps/${id}`, { info: infoValues });
      setCamp(res.data);
      toast.success("Informace byly uloženy.");
    } catch {
      toast.error("Nepodařilo se uložit.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!camp) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const checkboxFields = ["requiresConfirmation"];
    const data: Record<string, unknown> = {};
    fd.forEach((v, k) => {
      if (checkboxFields.includes(k)) data[k] = v === "on";
      else data[k] = v;
    });
    checkboxFields.forEach((k) => { if (!(k in data)) data[k] = false; });
    if (!data.name) data.name = camp.name;
    data.hideAdults = hideAdults;
    data.hideChildren = hideChildren;
    data.smsNotifyCustomer = smsNotifyCustomer;
    data.smsNotifyAdmin = smsNotifyAdmin;
    data.smsTemplates = smsTemplates;
    if (smsNotifyAdmin && smsAdminPhones.trim()) {
      const phones = smsAdminPhones.split(",").map((p: string) => p.trim()).filter(Boolean);
      const invalid = phones.find((p: string) => !/^\+[1-9]\d{6,14}$/.test(p));
      if (invalid) {
        setSmsPhoneError(`Neplatný formát čísla: ${invalid}. Použijte formát +420123456789.`);
        setSaving(false);
        return;
      }
      data.smsAdminPhones = phones;
    } else {
      data.smsAdminPhones = [];
    }
    try {
      const res = await api.put(`/camps/${id}`, data);
      setCamp(res.data);
      setSmsNotifyCustomer(res.data.smsNotifyCustomer ?? false);
      setSmsNotifyAdmin(res.data.smsNotifyAdmin ?? false);
      setSmsAdminPhones((res.data.smsAdminPhones ?? []).join(", "));
      setSmsTemplates((res.data.smsTemplates ?? {}) as Record<string, string>);
      toast.success("Nastavení bylo uloženo.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Nepodařilo se uložit.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSms = async () => {
    if (!/^\+[1-9]\d{6,14}$/.test(smsTestPhone.trim())) {
      setSmsTestResult({ ok: false, message: "Neplatný formát čísla. Použijte formát +420123456789." });
      return;
    }
    setSmsTestSending(true);
    setSmsTestResult(null);
    try {
      const res = await api.post(`/camps/${id}/test-sms`, { phone: smsTestPhone.trim(), lang: smsTestLang || undefined });
      const r = res.data?.response;
      setSmsTestResult({ ok: true, message: "SMS byla odeslána.", detail: r ?? undefined });
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Odeslání selhalo.";
      // Extract "detail" from embedded JSON in error string
      let msg = raw;
      try {
        const jsonMatch = raw.match(/\{.*\}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          msg = parsed.detail ?? raw;
        }
      } catch { /* noop */ }
      setSmsTestResult({ ok: false, message: msg });
    } finally {
      setSmsTestSending(false);
    }
  };

  const handleSaveSMTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    fd.forEach((v, k) => { data[k] = k === "smtpPort" ? Number(v) : v; });
    data.useCustomSmtp = useCustomSmtp;
    if (data.useCustomSmtp) {
      const missing = ["smtpHost", "smtpPort", "smtpUser", "smtpFrom", "smtpReplyTo"].filter((k) => !data[k]);
      const hasPassword = !!(fd.get("smtpPassword") || (camp as unknown as Record<string,string>).smtpPasswordEncrypted);
      if (missing.length > 0 || !hasPassword) {
        toast.error("Vyplňte všechna SMTP pole (host, port, uživatel, heslo, odesílatel, reply-to).");
        setSaving(false);
        return;
      }
    }
    try {
      const res = await api.put(`/camps/${id}`, data);
      setCamp(res.data);
      setUseCustomSmtp(res.data.useCustomSmtp ?? false);
      setHideAdults(res.data.hideAdults ?? false);
      setHideChildren(res.data.hideChildren ?? false);
      toast.success("SMTP nastavení bylo uloženo.");
    } catch {
      toast.error("Nepodařilo se uložit SMTP nastavení.");
    } finally {
      setSaving(false);
    }
  };

  const smtpFormRef = useRef<HTMLFormElement>(null);

  const handleTestSmtp = async () => {
    if (!smtpFormRef.current) return;
    setTestingSmtp(true);
    const fd = new FormData(smtpFormRef.current);
    const payload: Record<string, unknown> = {
      host: fd.get("smtpHost") || undefined,
      port: fd.get("smtpPort") ? Number(fd.get("smtpPort")) : undefined,
      user: fd.get("smtpUser") || undefined,
      password: fd.get("smtpPassword") || undefined,
    };
    try {
      await api.post(`/camps/${id}/test-smtp`, payload);
      setSmtpTested(true);
      toast.success("Připojení k SMTP serveru bylo úspěšné.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Test SMTP připojení selhal.");
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleDeleteCamp = async () => {
    if (!confirm(`Opravdu smazat objekt „${camp?.name}"? Tato akce je nevratná.`)) return;
    try {
      await api.delete(`/camps/${id}`);
      toast.success("Objekt byl smazán.");
      navigate("/camps");
    } catch {
      toast.error("Nepodařilo se smazat objekt.");
    }
  };

  const handleDeleteType = async (typeId: string) => {
    if (!confirm("Smazat typ ubytování?")) return;
    try {
      await api.delete(`/camps/${id}/accommodation-types/${typeId}`);
      toast.success("Typ smazán.");
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Nepodařilo se smazat.");
    }
  };

  const handleDeleteSurcharge = async (surchargeId: string) => {
    if (!confirm("Smazat příplatek?")) return;
    await api.delete(`/camps/${id}/surcharges/${surchargeId}`);
    toast.success("Příplatek smazán.");
    load();
  };

  const openEditTpl = (tpl: EmailTemplate) => { setEditTpl(tpl); setTplSubject(tpl.subject); setTplBody(tpl.body); };

  const handleSaveTpl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTpl) return;
    await api.put(`/email-templates/${id}/${editTpl.type}/${editTpl.languageCode}`, { subject: tplSubject, body: tplBody });
    setEditTpl(null);
    toast.success("Šablona uložena.");
    load();
  };

  if (!camp) return <div className="p-8 text-gray-500">Načítám…</div>;

  const embedUrl = orgSlug
    ? `${import.meta.env.VITE_FORM_BASE_URL}/form/${orgSlug}/${camp.slug}`
    : `${import.meta.env.VITE_FORM_BASE_URL}/form/${camp.slug}`;

  const bookingEnabled = !!(camp as any)?.organization?.bookingEnabled;

  const tabs: { key: Tab; label: string }[] = [
    { key: "settings", label: "Nastavení" },
    { key: "types", label: "Typy ubytování" },
    { key: "surcharges", label: "Příplatky" },
    { key: "emails", label: "E-mailové šablony" },
    { key: "embed", label: "Vložení na web" },
    { key: "sms", label: "SMS" },
    { key: "smtp", label: "SMTP" },
    ...(bookingEnabled ? [{ key: "booking" as Tab, label: "Booking" }] : []),
  ];

  const SMS_VAR_EXAMPLES: Record<string, string> = {
    "{bookingCode}": "ABC123",
    "{fullName}": "Petr Novak",
    "{firstName}": "Petr",
    "{lastName}": "Novak",
  };

  const renderSmsHighlight = (text: string) => {
    const combined = /(\{(?:bookingCode|fullName|firstName|lastName)\})|([ěščřžýáíéúůóďťňĚŠČŘŽÝÁÍÉÚŮÓĎŤŇ])|( {2,})|(\r\n|\r|\n)/g;
    const tokens: { type: string; value: string }[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = combined.exec(text)) !== null) {
      if (m.index > last) tokens.push({ type: "text", value: text.slice(last, m.index) });
      if (m[1]) tokens.push({ type: "variable", value: m[1] });
      else if (m[2]) tokens.push({ type: "diacritic", value: m[2] });
      else if (m[3]) tokens.push({ type: "spaces", value: m[3] });
      else if (m[4]) tokens.push({ type: "newline", value: m[4] });
      last = m.index + m[0].length;
    }
    if (last < text.length) tokens.push({ type: "text", value: text.slice(last) });

    return tokens.map((tok, i) => {
      if (tok.type === "variable") return <span key={i} className="bg-blue-500/30 text-blue-200 rounded px-0.5">{SMS_VAR_EXAMPLES[tok.value] ?? tok.value}</span>;
      if (tok.type === "diacritic") return <span key={i} className="bg-amber-500/40 text-amber-200 rounded">{tok.value}</span>;
      if (tok.type === "spaces") return <span key={i} className="bg-red-500/30 text-red-200 rounded">{tok.value}</span>;
      if (tok.type === "newline") return <span key={i} className="bg-purple-500/30 text-purple-200 rounded px-0.5">↵{"\n"}</span>;
      return <span key={i}>{tok.value}</span>;
    });
  };

  const getTypeName = (t: AccommodationType) => {
    const tr = t.translations as Record<string, { name: string }>;
    return tr.cs?.name ?? tr[Object.keys(tr)[0]]?.name ?? "—";
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{camp.name}</h1>
          <button onClick={() => setHelpOpen(true)} className="text-gray-400 hover:text-blue-500 transition-colors shrink-0" title="Nápověda"><i className="fa-regular fa-circle-question text-lg" /></button>
        </div>
        {helpOpen && <HelpModal topic="objekty" onClose={() => setHelpOpen(false)} />}
        {helpIntegraceOpen && <HelpModal topic="integrace" onClose={() => setHelpIntegraceOpen(false)} />}
        <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary shrink-0">
          <i className="fa-regular fa-arrow-up-right-from-square sm:mr-1.5" /><span className="hidden sm:inline">Otevřít formulář</span>
        </a>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Settings */}
      {tab === "settings" && (
        <>
        <form onSubmit={handleSaveSettings} className="card p-6 space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Název objektu</label>
              <input className="input" name="name" defaultValue={camp.name} required />
            </div>
            <div className="col-span-2">
              <label className="label">Notifikační e-mail správce</label>
              <input className="input" name="notificationEmail" defaultValue={camp.notificationEmail} placeholder="jan@example.cz, petra@example.cz"
                onBlur={(e) => { e.target.value = e.target.value.split(",").map((s) => s.trim()).filter(Boolean).join(", "); }} />
              <p className="text-xs text-gray-400 mt-1">Více e-mailů oddělte čárkou.</p>
            </div>
          </div>
          <hr />
          <h3 className="font-semibold text-gray-700">Rezervace</h3>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" name="requiresConfirmation" defaultChecked={(camp as unknown as Record<string, unknown>).requiresConfirmation !== false} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Vyžadovat ruční potvrzení</p>
              <p className="text-xs text-gray-500">Pokud vypnuto, rezervace jsou automaticky potvrzeny ihned po odeslání.</p>
            </div>
          </label>
          <hr />
          <h3 className="font-semibold text-gray-700">Formulář — osoby</h3>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" name="hideAdults" checked={hideAdults} onChange={(e) => setHideAdults(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Skrýt volbu a cenu dospělého</p>
              <p className="text-xs text-gray-500">Zákazník v rezervačním formuláři neuvidí výběr počtu dospělých. Cena za dospělého nebude zobrazena v nastavení cen.</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" name="hideChildren" checked={hideChildren} onChange={(e) => setHideChildren(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Skrýt volbu a cenu dítěte</p>
              <p className="text-xs text-gray-500">Zákazník v rezervačním formuláři neuvidí výběr počtu dětí. Cena za dítě nebude zobrazena v nastavení cen.</p>
            </div>
          </label>
          <div className="flex items-center justify-between pt-2">
            {can("camps_edit") && (
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ukládám…</> : <><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit změny</>}
              </button>
            )}
            {can("camps_delete") && (
              <button type="button" className="btn-danger" onClick={handleDeleteCamp}><i className="fa-regular fa-trash mr-1.5" />Smazat objekt</button>
            )}
          </div>
        </form>

        {/* Informace o objektu — modal */}
        {infoOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-8" onClick={() => setInfoOpen(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90dvh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-1.5"><Flag code={infoLang} /> {languages.find((l) => l.code === infoLang)?.name ?? infoLang.toUpperCase()} — Informace o objektu</h3>
                <button type="button" onClick={() => setInfoOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <WysiwygEditor
                  key={`info-${infoLang}`}
                  value={infoValues[infoLang] ?? ""}
                  onChange={(html) => setInfoValues((prev) => ({ ...prev, [infoLang]: html }))}
                  showVars={false}
                />
              </div>
              {can("camps_edit") && (
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
                  <button type="button" className="btn-secondary" onClick={() => setInfoOpen(false)}>Zrušit</button>
                  <button type="button" className="btn-primary" onClick={handleSaveInfo} disabled={savingInfo}>
                    {savingInfo ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ukládám…</> : <><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Informace o objektu — karta */}
        <div className="card p-5 max-w-2xl mt-4">
          <h3 className="font-semibold mb-3"><i className="fa-regular fa-circle-info mr-2" />Informace o objektu</h3>
          <div className="space-y-2">
            {languages.map((l) => (
              <div key={l.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium flex items-center gap-1.5"><Flag code={l.code} /> {l.name}</span>
                <div className="flex gap-2 items-center flex-wrap">
                  {infoValues[l.code] ? <span className="text-xs text-green-600"><i className="fa-regular fa-check mr-1" />nastaveno</span> : <span className="text-xs text-gray-400">prázdné</span>}
                  {infoValues[l.code] && (
                    <button className="btn-secondary text-xs py-1" onClick={() => setPreviewModal({ title: `${l.name} — Informace o objektu`, html: infoValues[l.code] })}>
                      <i className="fa-regular fa-eye mr-1" />Náhled
                    </button>
                  )}
                  {can("camps_edit") && (
                    <button className="text-xs py-1 px-2 rounded-lg border border-yellow-400 text-yellow-700 hover:bg-yellow-50 transition-colors font-medium" onClick={() => { setInfoLang(l.code); setInfoOpen(true); }}>
                      <i className="fa-regular fa-pen mr-1" />Upravit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        </>
      )}

      {/* Typy ubytování */}
      {tab === "types" && (
        <div className="max-w-2xl space-y-4">
          {/* Překlady modal */}
          {translationsType && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-8" onClick={() => setTranslationsType(null)}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
                  <h2 className="font-semibold text-gray-900">Překlady — {(translationsType.translations as any)?.cs?.name ?? translationsType.id}</h2>
                  <button className="text-gray-400 hover:text-gray-700 text-xl leading-none" onClick={() => setTranslationsType(null)}>×</button>
                </div>
                <div className="px-6 py-5 space-y-6">
                  {languages.map((lang) => {
                    const t = (translationsType.translations as Record<string, { name?: string; shortDescription?: string; longDescription?: string }>)[lang.code];
                    return (
                      <div key={lang.code} className="space-y-2 bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5"><Flag code={lang.code} /> {lang.name}</p>
                        {t?.name ? (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900">{t.name}</p>
                            {t.shortDescription && <p className="text-xs text-gray-500">{t.shortDescription}</p>}
                            {t.longDescription && (
                              <div className="text-xs text-gray-600 border border-gray-100 rounded-lg p-3 prose prose-xs max-w-none" dangerouslySetInnerHTML={{ __html: t.longDescription }} />
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Bez překladu</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Editor modal */}
          {editType !== null && (
            <AccommodationTypeEditor
              type={editType === "new" ? null : editType}
              languages={languages}
              campId={id!}
              hideAdults={hideAdults}
              hideChildren={hideChildren}
              onSave={() => { setEditType(null); load(); }}
              onClose={() => setEditType(null)}
            />
          )}

          {camp.accommodationTypes?.length === 0 && (
            <div className="card p-8 text-center text-gray-400">
              <p className="text-lg mb-1">Žádné typy ubytování</p>
              <p className="text-sm">Přidejte první typ (např. karavan, stan, chata…)</p>
            </div>
          )}

          {[...(camp.accommodationTypes ?? [])].sort((a, b) => {
            const ai = typeOrder.indexOf(a.id);
            const bi = typeOrder.indexOf(b.id);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
          }).map((t) => {
            const cs = languages.find((l) => l.code === "cs");
            const csPrice = t.prices.find((p) => p.languageCode === "cs") ?? t.prices[0];
            return (
              <div
                key={t.id}
                className={`card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${dragOverId === t.id && dragId.current !== t.id ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
                draggable={can("camps_edit")}
                onDragStart={() => { dragId.current = t.id; }}
                onDragOver={(e) => { e.preventDefault(); setDragOverId(t.id); }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={() => {
                  if (!dragId.current || dragId.current === t.id) return;
                  setTypeOrder((prev) => {
                    const next = [...prev];
                    const from = next.indexOf(dragId.current!);
                    const to = next.indexOf(t.id);
                    next.splice(from, 1);
                    next.splice(to, 0, dragId.current!);
                    api.put(`/camps/${id}/accommodation-types/reorder`, { order: next }).then(() => toast.success("Pořadí uloženo.")).catch(() => toast.error("Nepodařilo se uložit pořadí."));
                    return next;
                  });
                  dragId.current = null;
                  setDragOverId(null);
                }}
              >
                <div className="flex items-center gap-3">
                  {can("camps_edit") && (<>
                    <i className="fa-regular fa-grip-dots-vertical text-gray-300 cursor-grab text-lg hidden sm:block" />
                    <div className="flex flex-col sm:hidden">
                      <button type="button" className="text-gray-400 hover:text-gray-600 leading-none py-0.5" onClick={() => moveType(t.id, -1)}><i className="fa-regular fa-chevron-up text-xs" /></button>
                      <button type="button" className="text-gray-400 hover:text-gray-600 leading-none py-0.5" onClick={() => moveType(t.id, 1)}><i className="fa-regular fa-chevron-down text-xs" /></button>
                    </div>
                  </>)}
                  <div>
                    <p className="font-semibold text-gray-900">{getTypeName(t)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Kapacita: {t.capacity} míst
                      {(t.maxAdults != null || t.maxChildren != null) && (
                        <span className="ml-1">
                          ({[t.maxAdults != null && !hideAdults ? t.maxAdults : null, t.maxChildren != null && !hideChildren ? t.maxChildren : null].filter(v => v != null).join("/")})
                        </span>
                      )}
                    </p>
                    {t.useDynamicPricing && t.nightTiers?.length ? (
                      <p className="text-xs text-gray-400">
                        <span className="text-blue-600 font-medium">Dynamická cena</span> · od {Math.min(...t.nightTiers.flatMap((tier) => tier.prices.filter((p) => p.languageCode === "cs").map((p) => p.pricePerNight)))} {cs?.currencySymbol ?? "Kč"} / noc
                        {!hideAdults && csPrice && <> · dospělý {csPrice.adultPricePerNight}</>}
                        {!hideChildren && csPrice && <> · dítě {csPrice.childPricePerNight}</>}
                      </p>
                    ) : csPrice && (
                      <p className="text-xs text-gray-400">
                        {csPrice.pricePerNight} {cs?.currencySymbol ?? "Kč"} / noc · dospělý {csPrice.adultPricePerNight} · dítě {csPrice.childPricePerNight}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs" onClick={() => setTranslationsType(t)} title="Překlady"><i className="fa-regular fa-language" /></button>
                  {can("camps_edit") && (<>
                    <button className="btn-secondary text-xs" onClick={() => setEditType(t)}><i className="fa-regular fa-pen mr-1" />Upravit</button>
                    <button className="btn-danger text-xs" onClick={() => handleDeleteType(t.id)}><i className="fa-regular fa-trash mr-1" />Smazat</button>
                  </>)}
                </div>
              </div>
            );
          })}

          {can("camps_edit") && (
            <button className="btn-primary" onClick={() => setEditType("new")}><i className="fa-regular fa-plus mr-1.5" />Přidat typ ubytování</button>
          )}
        </div>
      )}

      {/* SMS */}
      {tab === "sms" && (
        !(camp as any).organization?.goSmsClientId ? (
          <div className="card p-6 max-w-2xl">
            <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 flex items-start gap-3">
              <i className="fa-regular fa-triangle-exclamation text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">GoSMS není nastaveno</p>
                <p className="text-sm text-orange-700 mt-0.5">Nejprve nastavte API přístupové údaje GoSMS v nastavení organizace.</p>
              </div>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSaveSettings} className="card p-6 space-y-5 max-w-2xl">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={smsNotifyCustomer} onChange={(e) => setSmsNotifyCustomer(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">SMS notifikace zákazníkovi</p>
              <p className="text-xs text-gray-500">Zákazník dostane SMS při potvrzení rezervace. Telefon se bere z rezervace.</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={smsNotifyAdmin} onChange={(e) => setSmsNotifyAdmin(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">SMS notifikace správci</p>
              <p className="text-xs text-gray-500">Správce dostane SMS při potvrzení rezervace.</p>
            </div>
          </label>
          {smsNotifyAdmin && (
            <div>
              <label className="label">Telefonní čísla správce</label>
              <input
                className="input"
                value={smsAdminPhones}
                onChange={(e) => { setSmsAdminPhones(e.target.value); setSmsPhoneError(""); }}
                placeholder="+420123456789, +420987654321"
                onBlur={(e) => { e.target.value = e.target.value.split(",").map((s) => s.trim()).filter(Boolean).join(", "); setSmsAdminPhones(e.target.value); }}
              />
              <p className="text-xs text-gray-400 mt-1">Více čísel oddělte čárkou. Každé číslo musí být s mezinárodní předvolbou (+420…).</p>
              {smsPhoneError && <p className="text-xs text-red-600 mt-1">{smsPhoneError}</p>}
            </div>
          )}
          <hr />
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-semibold text-gray-900">Text SMS zprávy</p>
              <button type="button" className="text-xs text-gray-400 hover:text-gray-600 underline" onClick={() => setSmsLengthHelpOpen(true)}>Jak funguje délka SMS?</button>
            </div>
            <div className="text-xs text-gray-400 mb-3 space-y-0.5">
              <div className="flex flex-col gap-y-0.5">
                {([
                  ["{bookingCode}", "kód rezervace", "ABC123"],
                  ["{fullName}", "celé jméno", "Petr Novak"],
                  ["{firstName}", "jméno", "Petr"],
                  ["{lastName}", "příjmení", "Novak"],
                ] as [string, string, string][]).map(([key, desc, example]) => (
                  <div key={key} className="flex items-center gap-x-3">
                    <div className="w-[7rem] shrink-0">
                      <Tooltip text={example}>
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => { navigator.clipboard.writeText(key); toast.success(`Zkopírováno: ${key}`); }}
                        >
                          <code className="bg-gray-100 hover:bg-blue-100 hover:text-blue-700 transition-colors px-1 rounded cursor-pointer">{key}</code>
                        </button>
                      </Tooltip>
                    </div>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
              <div className="pt-0.5"><i className="fa-regular fa-circle-info mr-1" />Hodnoty proměnných jsou automaticky zbaveny diakritiky</div>
            </div>
            {(() => {
              const missing = languages.filter((l) => !(smsTemplates[l.code] ?? "").trim());
              const stripDiacritics = (s: string) => s
                .replace(/á/g,"a").replace(/Á/g,"A").replace(/č/g,"c").replace(/Č/g,"C")
                .replace(/ď/g,"d").replace(/Ď/g,"D").replace(/é/g,"e").replace(/É/g,"E")
                .replace(/ě/g,"e").replace(/Ě/g,"E").replace(/í/g,"i").replace(/Í/g,"I")
                .replace(/ň/g,"n").replace(/Ň/g,"N").replace(/ó/g,"o").replace(/Ó/g,"O")
                .replace(/ř/g,"r").replace(/Ř/g,"R").replace(/š/g,"s").replace(/Š/g,"S")
                .replace(/ť/g,"t").replace(/Ť/g,"T").replace(/ú/g,"u").replace(/Ú/g,"U")
                .replace(/ů/g,"u").replace(/Ů/g,"U").replace(/ý/g,"y").replace(/Ý/g,"Y")
                .replace(/ž/g,"z").replace(/Ž/g,"Z");
              return (
                <div className="space-y-3">
                  {missing.length > 0 && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
                      <i className="fa-regular fa-triangle-exclamation" />
                      Chybí šablona pro: {missing.map((l) => l.name).join(", ")}
                    </div>
                  )}
                  {languages.map((l) => {
                    const val = smsTemplates[l.code] ?? "";
                    const isUcs2 = /[ěščřžýáíéúůóďťňĚŠČŘŽÝÁÍÉÚŮÓĎŤŇ]/.test(val);
                    const limit = isUcs2 ? 70 : 160;
                    const smsCount = Math.max(1, Math.ceil(val.length / limit));
                    const over = smsCount > 1;
                    const isEmpty = !val.trim();
                    return (
                      <div key={l.code} className={`rounded-lg border p-3 space-y-2 ${isEmpty ? "border-amber-300 bg-amber-50" : "border-gray-200"}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Flag code={l.code} /> {l.name}</span>
                          <span className="text-xs text-gray-400 font-mono">{l.code}</span>
                          {l.isDefault && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">výchozí</span>}
                          {isEmpty && <span className="text-xs text-amber-600 ml-auto"><i className="fa-regular fa-triangle-exclamation mr-1" />Nevyplněno</span>}
                        </div>
                        <textarea
                          className="input min-h-[72px] resize-y w-full"
                          value={val}
                          onChange={(e) => setSmsTemplates((prev) => ({ ...prev, [l.code]: e.target.value }))}
                          placeholder="Vaše rezervace byla potvrzena."
                          maxLength={1000}
                        />
                        <div className="flex items-start justify-between mt-1">
                          <Tooltip text="Nahradí diakritiku v textu pro správný formát">
                            <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => setSmsTemplates((prev) => ({ ...prev, [l.code]: stripDiacritics(val) }))}>
                              <i className="fa-regular fa-text-slash mr-1" />Nahradit diakritiku
                            </button>
                          </Tooltip>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className={`text-xs font-mono ${over ? "text-amber-600" : "text-gray-400"}`}>
                              {val.length} znaků / {smsCount} SMS
                            </span>
                            {isUcs2 ? (
                              <span className="text-xs text-amber-600">UCS2 — max 70 zn.</span>
                            ) : (
                              <span className="text-xs text-gray-400">GSM — max 160 zn.</span>
                            )}
                            {/\{(bookingCode|fullName|firstName|lastName)\}/.test(val) && (
                              <span className="text-xs text-amber-600">Délka se může lišit dle hodnot proměnných</span>
                            )}
                          </div>
                        </div>
                        {val.length > 0 && (() => {
                          const resolved = val
                            .replace(/\{bookingCode\}/g, "ABC123")
                            .replace(/\{fullName\}/g, "Petr Novak")
                            .replace(/\{firstName\}/g, "Petr")
                            .replace(/\{lastName\}/g, "Novak");
                          const isUcs2r = /[ěščřžýáíéúůóďťňĚŠČŘŽÝÁÍÉÚŮÓĎŤŇ]/.test(resolved);
                          const limitr = isUcs2r ? 70 : 160;
                          const countr = Math.max(1, Math.ceil(resolved.length / limitr));
                          return (
                            <div className="mt-2">
                              <div className="flex items-center justify-between bg-gray-700 text-gray-300 rounded-t-lg px-3 py-1.5 text-xs">
                                <span>Náhled</span>
                                <span className="flex items-center gap-2 text-[10px]">
                                  <span className="bg-blue-500/30 text-blue-200 rounded px-1">proměnná</span>
                                  <span className="bg-amber-500/40 text-amber-200 rounded px-1">diakritika</span>
                                  <span className="bg-purple-500/30 text-purple-200 rounded px-1">↵ nový řádek</span>
                                  <span className="bg-red-500/30 text-red-200 rounded px-1">více mezer</span>
                                </span>
                              </div>
                              <pre className="text-xs bg-gray-900 text-gray-100 p-3 whitespace-pre-wrap font-mono">{renderSmsHighlight(val)}</pre>
                              <div className="flex items-center justify-between bg-gray-800 text-gray-400 rounded-b-lg px-3 py-1.5 text-xs font-mono">
                                <span>{isUcs2r ? "UCS2" : "GSM"}</span>
                                <span>{resolved.length} zn. / {countr} SMS</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          {can("camps_edit") && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-3">
                <button type="button" className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors" onClick={() => { const hasAny = Object.values(smsTemplates).some((v) => v.trim()); if (!hasAny) { toast.error("Nejdříve vyplňte alespoň jednu SMS šablonu."); return; } setSmsTestOpen((v) => !v); setSmsTestResult(null); if (!smsTestPhone) setSmsTestPhone(smsAdminPhones.split(",")[0]?.trim() ?? ""); if (!smsTestLang) setSmsTestLang(languages.find((l) => l.isDefault)?.code ?? languages[0]?.code ?? ""); }}>
                  <i className="fa-regular fa-paper-plane mr-1.5" />Testovací SMS
                </button>
                <button className="btn-primary ml-auto" type="submit" disabled={saving}>
                  {saving ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ukládám…</> : <><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit změny</>}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors" disabled={smsCreditLoading} onClick={async () => { const orgId = (camp as any).organization?.id; if (!orgId) return; setSmsCreditLoading(true); try { const r = await api.get(`/organizations/${orgId}/gosms-credit`); setSmsCredit(r.data); } catch { toast.error("Nepodařilo se načíst kredit z GoSMS."); } finally { setSmsCreditLoading(false); } }}>
                  {smsCreditLoading ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Načítám…</> : <><i className="fa-regular fa-wallet mr-1.5" />Načíst kredit</>}
                </button>
                {smsCredit && <span className="text-sm text-gray-700">Kredit: <strong>{smsCredit.currentCredit} {smsCredit.currency}</strong></span>}
              </div>
            </div>
          )}
          {smsTestOpen && (
            <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-700">Odeslat testovací SMS</p>
              <div className="flex items-center gap-2">
                <select className="input w-auto" value={smsTestLang} onChange={(e) => { setSmsTestLang(e.target.value); setSmsTestResult(null); }}>
                  {languages.map((l) => <option key={l.code} value={l.code}>{l.name}{l.isDefault ? " (výchozí)" : ""}</option>)}
                </select>
                <input
                  type="tel"
                  className="input flex-1"
                  placeholder="+420123456789"
                  value={smsTestPhone}
                  onChange={(e) => { setSmsTestPhone(e.target.value); setSmsTestResult(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleTestSms(); } }}
                />
                <button type="button" className="btn-primary shrink-0" onClick={handleTestSms} disabled={smsTestSending}>
                  {smsTestSending ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Odesílám…</> : <><i className="fa-regular fa-paper-plane mr-1.5" />Odeslat</>}
                </button>
              </div>
              <p className="text-xs text-gray-400">Text zprávy: <em>{(smsTemplates[smsTestLang] || Object.values(smsTemplates).find((v) => v.trim()) || "Vaše rezervace byla potvrzena.").replace(/\{bookingCode\}/g, "ABC123").replace(/\{fullName\}/g, "Petr Novak").replace(/\{firstName\}/g, "Petr").replace(/\{lastName\}/g, "Novak")}</em></p>
              {smsTestResult && (
                <div className={`text-sm rounded-lg p-3 space-y-2 ${smsTestResult.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                  <div className="flex items-center gap-2 font-medium">
                    <i className={`fa-regular ${smsTestResult.ok ? "fa-circle-check" : "fa-circle-xmark"}`} />
                    {smsTestResult.message}
                  </div>
                  {smsTestResult.ok && smsTestResult.detail && (() => {
                    const r = smsTestResult.detail as Record<string, unknown>;
                    const stats = r.stats as Record<string, unknown> | undefined;
                    const info = r.sendingInfo as Record<string, unknown> | undefined;
                    return (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-700 pt-1 border-t border-green-200">
                        {stats?.price !== undefined && <span>Cena: <strong>{String(stats.price)} {String(stats.currency ?? "")}</strong></span>}
                        {stats?.smsCount !== undefined && <span>Počet SMS: <strong>{String(stats.smsCount)}</strong></span>}
                        {stats?.hasDiacritics !== undefined && <span>Diakritika: <strong>{stats.hasDiacritics ? "ano (UCS2)" : "ne (GSM)"}</strong></span>}
                        {stats?.recipientsCount !== undefined && <span>Příjemci: <strong>{String(stats.recipientsCount)}</strong></span>}
                        {info?.status !== undefined && <span>Stav: <strong>{String(info.status)}</strong></span>}
                        {info?.sendStart !== undefined && <span>Odesláno: <strong>{new Date(String(info.sendStart)).toLocaleString("cs-CZ")}</strong></span>}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </form>
        )
      )}

      {/* SMTP */}
      {tab === "smtp" && (
        <form ref={smtpFormRef} onSubmit={handleSaveSMTP} className="card p-6 space-y-4 max-w-2xl">
          <p className="text-sm text-gray-500">Ve výchozím nastavení se e-maily odesílají přes systémový SMTP server. Pokud chcete použít vlastní, zaškrtněte níže.</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="useCustomSmtp"
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
              checked={useCustomSmtp}
              onChange={(e) => setUseCustomSmtp(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">Použít vlastní SMTP nastavení</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ display: useCustomSmtp ? "" : "none" }}>
            <div><label className="label">SMTP Host</label><input className="input" name="smtpHost" defaultValue={(camp as unknown as Record<string,string>).smtpHost ?? ""} onChange={() => setSmtpTested(false)} /></div>
            <div><label className="label">SMTP Port</label><input className="input" name="smtpPort" type="number" defaultValue={(camp as unknown as Record<string,number>).smtpPort ?? 587} onChange={() => setSmtpTested(false)} /></div>
            <div><label className="label">SMTP Uživatel</label><input className="input" name="smtpUser" defaultValue={(camp as unknown as Record<string,string>).smtpUser ?? ""} onChange={() => setSmtpTested(false)} /></div>
            <div><label className="label">SMTP Heslo</label><input className="input" name="smtpPassword" type="password" autoComplete="new-password" placeholder="Ponechte prázdné pro zachování" onChange={() => setSmtpTested(false)} /></div>
            <div className="col-span-2"><label className="label">Odesílatel (From)</label><input className="input" name="smtpFrom" defaultValue={(camp as unknown as Record<string,string>).smtpFrom ?? ""} placeholder="Název kempu <email@domena.cz>" onChange={() => setSmtpTested(false)} /></div>
            <div className="col-span-2"><label className="label">Reply-To <span className="text-gray-400 font-normal text-xs">(adresa pro odpovědi zákazníků)</span></label><input className="input" name="smtpReplyTo" defaultValue={(camp as unknown as Record<string,string>).smtpReplyTo ?? ""} placeholder="info@kempmylnska.cz" onChange={() => setSmtpTested(false)} /></div>
          </div>
          {can("camps_edit") && (
            <div className="flex gap-2 items-center">
              {useCustomSmtp && (
                <button className={smtpTested ? "btn-secondary" : "btn-primary"} type="button" disabled={testingSmtp} onClick={handleTestSmtp}>
                  {testingSmtp ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Testuji…</> : smtpTested ? <><i className="fa-regular fa-check mr-1.5" />Připojení ověřeno</> : <><i className="fa-regular fa-plug mr-1.5" />Ověřit připojení před uložením</>}
                </button>
              )}
              {(!useCustomSmtp || smtpTested) && (
                <button className="btn-primary" type="submit" disabled={saving}>
                  {saving ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ukládám…</> : <><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit SMTP</>}
                </button>
              )}
            </div>
          )}
        </form>
      )}

      {/* Surcharges */}
      {tab === "surcharges" && (
        <div className="max-w-2xl space-y-4">
          {editSurcharge !== null && (
            <SurchargeEditor
              surcharge={editSurcharge === "new" ? null : editSurcharge}
              languages={languages}
              campId={id!}
              accommodationTypes={camp?.accommodationTypes ?? []}
              onSave={() => { setEditSurcharge(null); load(); }}
              onClose={() => setEditSurcharge(null)}
            />
          )}

          {camp.surcharges.length === 0 && (
            <div className="card p-8 text-center text-gray-400">
              <p className="text-lg mb-1">Žádné příplatky</p>
              <p className="text-sm">Přidejte příplatek (např. turistická daň, pes…)</p>
            </div>
          )}

          {[...camp.surcharges].sort((a: Surcharge, b: Surcharge) => {
            const ai = surchargeOrder.indexOf(a.id);
            const bi = surchargeOrder.indexOf(b.id);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
          }).map((s: Surcharge) => {
            const t = s.translations as Record<string, { name: string }>;
            const csPrice = s.prices.find((p) => p.languageCode === "cs") ?? s.prices[0];
            return (
              <div
                key={s.id}
                className={`card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${dragOverId === s.id && dragId.current !== s.id ? "ring-2 ring-blue-400 ring-offset-1" : ""} ${(s as Surcharge & { isHidden?: boolean }).isHidden ? "opacity-50 bg-gray-50" : ""}`}
                draggable={can("camps_edit")}
                onDragStart={() => { dragId.current = s.id; }}
                onDragOver={(e) => { e.preventDefault(); setDragOverId(s.id); }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={() => {
                  if (!dragId.current || dragId.current === s.id) return;
                  setSurchargeOrder((prev) => {
                    const next = [...prev];
                    const from = next.indexOf(dragId.current!);
                    const to = next.indexOf(s.id);
                    next.splice(from, 1);
                    next.splice(to, 0, dragId.current!);
                    api.put(`/camps/${id}/surcharges/reorder`, { order: next }).then(() => toast.success("Pořadí uloženo.")).catch(() => toast.error("Nepodařilo se uložit pořadí."));
                    return next;
                  });
                  dragId.current = null;
                  setDragOverId(null);
                }}
              >
                <div className="flex items-center gap-3">
                  {can("camps_edit") && (<>
                    <i className="fa-regular fa-grip-dots-vertical text-gray-300 cursor-grab text-lg hidden sm:block" />
                    <div className="flex flex-col sm:hidden">
                      <button type="button" className="text-gray-400 hover:text-gray-600 leading-none py-0.5" onClick={() => moveSurcharge(s.id, -1)}><i className="fa-regular fa-chevron-up text-xs" /></button>
                      <button type="button" className="text-gray-400 hover:text-gray-600 leading-none py-0.5" onClick={() => moveSurcharge(s.id, 1)}><i className="fa-regular fa-chevron-down text-xs" /></button>
                    </div>
                  </>)}
                  <div>
                    <p className="font-semibold text-gray-900">{t.cs?.name ?? t[Object.keys(t)[0]]?.name ?? "—"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(s as Surcharge & { isHidden?: boolean }).isHidden && <span className="text-amber-500 block">Skryto ve formuláři</span>}
                      {csPrice ? `${csPrice.pricePerNight} Kč / noc` : ""}
                      {(() => {
                        const ids = (s as Surcharge & { applicableTypeIds?: string[] }).applicableTypeIds;
                        const allTypes = camp.accommodationTypes ?? [];
                        const names = !ids?.length
                          ? "vše"
                          : ids.map((tid) => {
                              const at = allTypes.find((at) => at.id === tid);
                              const tr = at?.translations as Record<string, { name: string }> | undefined;
                              return tr?.cs?.name ?? tr?.[Object.keys(tr ?? {})[0]]?.name ?? tid;
                            }).join(", ");
                        return <span className="block">Volitelné pro: {names}</span>;
                      })()}
                    </p>
                  </div>
                </div>
                {can("camps_edit") && (
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs" onClick={() => setEditSurcharge(s)}><i className="fa-regular fa-pen mr-1" />Upravit</button>
                    <button className="btn-danger text-xs" onClick={() => handleDeleteSurcharge(s.id)}><i className="fa-regular fa-trash mr-1" />Smazat</button>
                  </div>
                )}
              </div>
            );
          })}

          {can("camps_edit") && (
            <button className="btn-primary" onClick={() => setEditSurcharge("new")}><i className="fa-regular fa-plus mr-1.5" />Přidat příplatek</button>
          )}
        </div>
      )}

      {/* Email templates */}
      {tab === "emails" && (
        <div className={`space-y-4 ${editTpl ? "" : "max-w-2xl"}`}>
          {editTpl ? (
            <form onSubmit={handleSaveTpl} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button type="button" className="text-gray-400 hover:text-gray-600 shrink-0" onClick={() => setEditTpl(null)}><i className="fa-regular fa-arrow-left mr-1" />Zpět</button>
                  <h3 className="font-semibold flex items-center gap-1.5 flex-wrap">{editTpl.type === "ADMIN_NOTIFICATION" ? "Notifikace správci" : <><span>Potvrzení zákazníkovi —</span> <Flag code={editTpl.languageCode} /> <span>{editTpl.languageCode.toUpperCase()}</span></>}</h3>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn-primary" type="submit"><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit šablonu</button>
                  <button className="btn-secondary" type="button" onClick={() => setEditTpl(null)}><i className="fa-regular fa-xmark mr-1.5" />Zrušit</button>
                </div>
              </div>
              <div className="flex justify-end">
              <button className="btn-secondary text-xs" type="button" onClick={() => {
                if (!editTpl) return;
                const def = DEFAULT_TEMPLATES[editTpl.type];
                if (!def) return;
                if (!confirm("Obnovit výchozí šablonu? Současný obsah bude nahrazen. Změna se uloží až po kliknutí na Uložit šablonu.")) return;
                setTplSubject(def.subject);
                setTplBody(def.body);
                setTplKey((k) => k + 1);
              }}><i className="fa-regular fa-rotate-left mr-1.5" />Obnovit výchozí šablonu</button>
              </div>
              <div className="max-w-2xl">
                <label className="label">Předmět</label>
                <input className="input w-full" value={tplSubject} onChange={(e) => setTplSubject(e.target.value)} required />
              </div>
              <div><label className="label">Tělo e-mailu</label><WysiwygEditor key={tplKey} value={tplBody} onChange={setTplBody} /></div>
            </form>
          ) : (
            <>
              <div className="card p-5">
                <h3 className="font-semibold mb-1"><i className="fa-regular fa-envelope-open-text mr-2" />Notifikace správci</h3>
                <p className="text-xs text-gray-400 mb-3">Odesílá se vždy při každé nové rezervaci na notifikační e-mail objektu, bez ohledu na ruční potvrzení.</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2">
                  <span className="text-sm font-medium flex items-center gap-1.5"><Flag code="cs" /> Česky (výchozí)</span>
                  <div className="flex gap-2 items-center flex-wrap">
                    {(() => {
                      const tpl = templates.find((t) => t.type === "ADMIN_NOTIFICATION" && t.languageCode === "cs");
                      return (<>
                        {tpl ? <span className="text-xs text-green-600"><i className="fa-regular fa-check mr-1" />nastavena</span> : <span className="text-xs text-gray-400">chybí</span>}
                        {tpl && (
                          <button className="btn-secondary text-xs py-1" onClick={() => setPreviewModal({ title: "Notifikace správci", subject: tpl.subject, html: tpl.body })}>
                            <i className="fa-regular fa-eye mr-1" />Náhled
                          </button>
                        )}
                        {can("templates_edit") && (
                          <button className="text-xs py-1 px-2 rounded-lg border border-yellow-400 text-yellow-700 hover:bg-yellow-50 transition-colors font-medium" onClick={() => openEditTpl(tpl ?? { id: "", campId: id!, type: "ADMIN_NOTIFICATION", languageCode: "cs", subject: "", body: "" })}>
                            {tpl ? <><i className="fa-regular fa-pen mr-1" />Upravit</> : <><i className="fa-regular fa-plus mr-1" />Vytvořit</>}
                          </button>
                        )}
                      </>);
                    })()}
                  </div>
                </div>
              </div>
              {(camp as unknown as Record<string, unknown>).requiresConfirmation && (
                <div className="card p-5">
                  <h3 className="font-semibold mb-1"><i className="fa-regular fa-clock mr-2" />Nepotvrzená rezervace</h3>
                  <p className="text-xs text-gray-400 mb-3">Odesílá se zákazníkovi po odeslání rezervace a zákazník je informován, že rezervace čeká na potvrzení správcem.</p>
                  <div className="space-y-2">
                    {languages.map((lang) => {
                      const tpl = templates.find((t) => t.type === "PENDING_CONFIRMATION" && t.languageCode === lang.code);
                      return (
                        <div key={lang.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                          <span className="text-sm font-medium flex items-center gap-1.5"><Flag code={lang.code} /> {lang.name}</span>
                          <div className="flex gap-2 items-center flex-wrap">
                            {tpl ? <span className="text-xs text-green-600"><i className="fa-regular fa-check mr-1" />nastavena</span> : <span className="text-xs text-gray-400">chybí</span>}
                            {tpl && (
                              <button className="btn-secondary text-xs py-1" onClick={() => setPreviewModal({ title: `${lang.name} — Nepotvrzená rezervace`, subject: tpl.subject, html: tpl.body })}>
                                <i className="fa-regular fa-eye mr-1" />Náhled
                              </button>
                            )}
                            {can("templates_edit") && (
                              <button className="text-xs py-1 px-2 rounded-lg border border-yellow-400 text-yellow-700 hover:bg-yellow-50 transition-colors font-medium" onClick={() => openEditTpl(tpl ?? { id: "", campId: id!, type: "PENDING_CONFIRMATION", languageCode: lang.code, subject: "", body: "" })}>
                                {tpl ? <><i className="fa-regular fa-pen mr-1" />Upravit</> : <><i className="fa-regular fa-plus mr-1" />Vytvořit</>}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="card p-5">
                <h3 className="font-semibold mb-1"><i className="fa-regular fa-envelope mr-2" />Potvrzení o rezervaci zákazníkovi</h3>
                <p className="text-xs text-gray-400 mb-3">Odesílá se zákazníkovi ihned po rezervaci, protože není vyžadováno potvrzení rezervace.</p>
                <div className="space-y-2">
                  {languages.map((lang) => {
                    const tpl = templates.find((t) => t.type === "CUSTOMER_CONFIRMATION" && t.languageCode === lang.code);
                    return (
                      <div key={lang.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm font-medium flex items-center gap-1.5"><Flag code={lang.code} /> {lang.name}</span>
                        <div className="flex gap-2 items-center flex-wrap">
                          {tpl ? <span className="text-xs text-green-600"><i className="fa-regular fa-check mr-1" />nastavena</span> : <span className="text-xs text-gray-400">chybí</span>}
                          {tpl && (
                            <button className="btn-secondary text-xs py-1" onClick={() => setPreviewModal({ title: `${lang.name} — Potvrzení zákazníkovi`, subject: tpl.subject, html: tpl.body })}>
                              <i className="fa-regular fa-eye mr-1" />Náhled
                            </button>
                          )}
                          {can("templates_edit") && (
                            <button className="text-xs py-1 px-2 rounded-lg border border-yellow-400 text-yellow-700 hover:bg-yellow-50 transition-colors font-medium" onClick={() => openEditTpl(tpl ?? { id: "", campId: id!, type: "CUSTOMER_CONFIRMATION", languageCode: lang.code, subject: "", body: "" })}>
                              {tpl ? <><i className="fa-regular fa-pen mr-1" />Upravit</> : <><i className="fa-regular fa-plus mr-1" />Vytvořit</>}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Embed */}
      {tab === "embed" && (
        <div className="card p-6 max-w-2xl space-y-4">
          <h3 className="font-semibold">Vložení formuláře na web</h3>
          {(() => {
            const code = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  style="border:none;border-radius:12px;"\n></iframe>`;
            return (
              <div className="relative group">
                <pre className="rounded-xl overflow-x-auto text-sm leading-relaxed !p-0">
                  <code
                    className="hljs language-html block p-5"
                    dangerouslySetInnerHTML={{ __html: hljs.highlight(code, { language: "html" }).value }}
                  />
                </pre>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip text="Kopírovat kód" position="left">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(code).then(() => toast.success("Zkopírováno!"))}
                      className="bg-white/10 hover:bg-white/20 text-slate-200 text-xs px-2 py-1 rounded"
                    >
                      <i className="fa-regular fa-copy" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            );
          })()}
          <p className="text-xs text-gray-500 flex items-center gap-2">Přímý odkaz: <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{embedUrl}</a><Tooltip text="Kopírovat odkaz" position="top"><button type="button" onClick={() => navigator.clipboard.writeText(embedUrl).then(() => toast.success("Zkopírováno!"))} className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fa-regular fa-copy" /></button></Tooltip></p>
          <p className="text-xs text-gray-500">Pro konkrétní jazyk přidejte parametr: <code className="bg-gray-100 px-1 rounded">?lang=en</code></p>
          {languages.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Dostupné jazyky:</p>
              <div className="space-y-1">
                {languages.map((l) => (
                  <div key={l.code} className="flex items-center gap-2 text-xs text-gray-600">
                    <Flag code={l.code} />
                    <span>{l.name}{l.isDefault && <span className="ml-1 text-gray-400">(výchozí)</span>}</span>
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-500">?lang={l.code}</code>
                    <a href={`${embedUrl}?lang=${l.code}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 transition-colors">
                      <i className="fa-regular fa-arrow-up-right-from-square mr-0.5" />otevřít
                    </a>
                    <button type="button" onClick={() => navigator.clipboard.writeText(`${embedUrl}?lang=${l.code}`).then(() => toast.success("Zkopírováno!"))} className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-0.5">
                      <i className="fa-regular fa-copy mr-0.5" />kopírovat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {tab === "booking" && bookingEnabled && (
        <BookingTab camp={camp!} campId={id!} onRefresh={load} onHelp={() => setHelpIntegraceOpen(true)} />
      )}
      {previewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-8" onClick={() => setPreviewModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90dvh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">{previewModal.title}</h3>
                {previewModal.subject && <p className="text-xs text-gray-400 mt-0.5">Předmět: {previewModal.subject}</p>}
              </div>
              <button onClick={() => setPreviewModal(null)} className="text-gray-400 hover:text-gray-600"><i className="fa-regular fa-xmark text-lg" /></button>
            </div>
            <div className="overflow-y-auto p-6">
              {previewModal.html
                ? <div dangerouslySetInnerHTML={{ __html: previewModal.html }} />
                : <p className="text-gray-400 text-sm">Šablona nemá žádný obsah.</p>
              }
            </div>
          </div>
        </div>
      )}
      {smsLengthHelpOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-stretch sm:items-start justify-center sm:p-4 sm:pt-12" onClick={() => setSmsLengthHelpOpen(false)}>
          <div className="bg-white sm:rounded-2xl shadow-xl w-full sm:max-w-4xl h-full sm:h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="font-semibold text-gray-900">Délka SMS zprávy</h2>
              <button onClick={() => setSmsLengthHelpOpen(false)} className="text-gray-400 hover:text-gray-700"><i className="fa-regular fa-xmark text-lg" /></button>
            </div>
            <iframe src="https://napoveda.gosms.cz/tema/delka-sms?embed=" className="w-full flex-1 rounded-b-2xl" style={{ minHeight: 400 }} />
          </div>
        </div>
      )}
    </div>
  );
}
