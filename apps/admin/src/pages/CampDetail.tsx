import { useTitle } from "../hooks/useTitle";
import Tooltip from "../components/Tooltip";
import HelpModal from "../components/HelpModal";
import { useEffect, useRef, useState } from "react";
import RichTextEditor from "../components/RichTextEditor";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Camp, Surcharge, EmailTemplate, Language, AccommodationType, AccommodationTypePrice } from "@procamp/shared";
// SurchargePrice used via Surcharge.prices
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

type Tab = "settings" | "types" | "smtp" | "surcharges" | "emails" | "embed";

const TEMPLATE_VARS = [
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
  { key: "{{totalPrice}}", desc: "Celková cena" },
  { key: "{{campName}}", desc: "Název objektu" },
  { key: "{{licensePlate}}", desc: "SPZ vozidla" },
  { key: "{{expectedArrival}}", desc: "Předpokládaný příjezd" },
  { key: "{{note}}", desc: "Poznámka zákazníka" },
];

const FLAGS: Record<string, string> = { cs: "🇨🇿", en: "🇬🇧", de: "🇩🇪", pl: "🇵🇱", it: "🇮🇹", es: "🇪🇸", fr: "🇫🇷", ru: "🇷🇺", uk: "🇺🇦" };

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
      <tr style="background:#dbeafe"><td style="padding:10px 8px;color:#1e40af;font-weight:700;font-size:15px;width:180px">Celková cena</td><td style="padding:10px 8px;font-weight:700;font-size:15px;color:#1e40af">{{totalPrice}} Kč</td></tr>
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
      <tr><td style="padding:6px 0;color:#6b7280;width:180px">Rezervace ubytování</td><td style="padding:6px 0;font-weight:600">{{accommodationType}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">Příjezd</td><td style="padding:6px 8px;font-weight:600">{{checkIn}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Odjezd</td><td style="padding:6px 0;font-weight:600">{{checkOut}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">Počet nocí</td><td style="padding:6px 8px">{{nights}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Dospělí / Děti</td><td style="padding:6px 0">{{adults}} / {{children}}</td></tr>
    </table>
    <h2 style="margin:0 0 12px;font-size:15px;color:#374151;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Cena</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
      <tr style="background:#dbeafe"><td style="padding:10px 8px;color:#1e40af;font-weight:700;font-size:15px;width:180px">Celková cena</td><td style="padding:10px 8px;font-weight:700;font-size:15px;color:#1e40af">{{totalPrice}} Kč</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px" colspan="2">Platba probíhá na místě při příjezdu.</td></tr>
    </table>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#15803d">✅ Těšíme se na vás! Máte-li jakékoliv dotazy, stačí na tento e-mail odpovědět.</p>
    </div>
    <p style="margin:0;font-size:12px;color:#9ca3af;border-top:1px solid #e2e8f0;padding-top:12px">ID rezervace: {{reservationId}}</p>
  </div>
</div>`,
  },
};

type Popup = { type: "link"; url: string } | { type: "image"; url: string; linkUrl: string };

function WysiwygEditor({ value, onChange, showVars = true }: { value: string; onChange: (v: string) => void; showVars?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInit = useRef(false);
  const savedRange = useRef<Range | null>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [popup, setPopup] = useState<Popup | null>(null);

  useEffect(() => {
    if (ref.current && !isInit.current) { ref.current.innerHTML = value; isInit.current = true; }
  }, [value]);
  useEffect(() => {
    if (!sourceMode && ref.current) { ref.current.innerHTML = value; }
  }, [sourceMode]);

  const exec = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); ref.current?.focus(); if (ref.current) onChange(ref.current.innerHTML); };
  const insertVar = (v: string) => {
    if (sourceMode) { onChange(value + v); return; }
    ref.current?.focus(); document.execCommand("insertText", false, v); if (ref.current) onChange(ref.current.innerHTML);
  };
  const toggleSource = () => {
    if (!sourceMode && ref.current) onChange(ref.current.innerHTML);
    if (sourceMode) isInit.current = false;
    setSourceMode((v) => !v);
  };

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreRange = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  };

  const openPopup = (type: "link" | "image") => {
    saveRange();
    setPopup(type === "link" ? { type: "link", url: "" } : { type: "image", url: "", linkUrl: "" });
  };

  const insertLink = () => {
    if (!popup || popup.type !== "link" || !popup.url) return;
    restoreRange();
    document.execCommand("createLink", false, popup.url);
    const links = ref.current?.querySelectorAll(`a[href="${popup.url}"]`);
    links?.forEach((a) => { (a as HTMLAnchorElement).target = "_blank"; (a as HTMLAnchorElement).rel = "noopener noreferrer"; });
    if (ref.current) onChange(ref.current.innerHTML);
    setPopup(null);
  };

  const insertImage = () => {
    if (!popup || popup.type !== "image" || !popup.url) return;
    restoreRange();
    const img = `<img src="${popup.url}" alt="" style="max-width:100%" />`;
    const html = popup.linkUrl ? `<a href="${popup.linkUrl}" target="_blank" rel="noopener noreferrer">${img}</a>` : img;
    document.execCommand("insertHTML", false, html);
    if (ref.current) onChange(ref.current.innerHTML);
    setPopup(null);
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50">
        {!sourceMode && <>
          <Tooltip text="Tučně"><button type="button" onClick={() => exec("bold")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 font-bold"><i className="fa-regular fa-bold" /></button></Tooltip>
          <Tooltip text="Kurzíva"><button type="button" onClick={() => exec("italic")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 italic"><i className="fa-regular fa-italic" /></button></Tooltip>
          <Tooltip text="Podtržení"><button type="button" onClick={() => exec("underline")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 underline"><i className="fa-regular fa-underline" /></button></Tooltip>
          <span className="w-px bg-gray-300 mx-1" />
          <Tooltip text="Nadpis H2"><button type="button" onClick={() => exec("formatBlock", "h2")} className="px-2 py-1 text-sm rounded hover:bg-gray-200">H2</button></Tooltip>
          <Tooltip text="Nadpis H3"><button type="button" onClick={() => exec("formatBlock", "h3")} className="px-2 py-1 text-sm rounded hover:bg-gray-200">H3</button></Tooltip>
          <Tooltip text="Odstavec"><button type="button" onClick={() => exec("formatBlock", "p")} className="px-2 py-1 text-sm rounded hover:bg-gray-200"><i className="fa-regular fa-paragraph" /></button></Tooltip>
          <span className="w-px bg-gray-300 mx-1" />
          <Tooltip text="Odrážkový seznam"><button type="button" onClick={() => exec("insertUnorderedList")} className="px-2 py-1 text-sm rounded hover:bg-gray-200"><i className="fa-regular fa-list-ul" /></button></Tooltip>
          <Tooltip text="Číslovaný seznam"><button type="button" onClick={() => exec("insertOrderedList")} className="px-2 py-1 text-sm rounded hover:bg-gray-200"><i className="fa-regular fa-list-ol" /></button></Tooltip>
          <span className="w-px bg-gray-300 mx-1" />
          <Tooltip text="Vložit odkaz"><button type="button" onClick={() => openPopup("link")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-600"><i className="fa-regular fa-link" /></button></Tooltip>
          <Tooltip text="Vložit obrázek"><button type="button" onClick={() => openPopup("image")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-600"><i className="fa-regular fa-image" /></button></Tooltip>
          <span className="w-px bg-gray-300 mx-1" />
          <Tooltip text="Odstranit formátování"><button type="button" onClick={() => exec("removeFormat")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-500"><i className="fa-regular fa-eraser" /></button></Tooltip>
          <span className="w-px bg-gray-300 mx-1" />
        </>}
        <button type="button" onClick={toggleSource} className={`px-2 py-1 text-sm rounded transition-colors ${sourceMode ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "hover:bg-gray-200 text-gray-500"}`}><i className="fa-regular fa-code" /> {sourceMode ? "WYSIWYG" : "HTML"}</button>
      </div>

      {/* Popup pro odkaz */}
      {popup?.type === "link" && (
        <div className="border-b border-blue-100 bg-blue-50 px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-blue-700 font-medium shrink-0">URL odkazu:</span>
          <input autoFocus className="input py-1 text-sm flex-1" placeholder="https://..." value={popup.url} onChange={(e) => setPopup({ ...popup, url: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertLink(); } if (e.key === "Escape") setPopup(null); }} />
          <button type="button" className="btn-primary py-1 text-xs shrink-0" onClick={insertLink}><i className="fa-regular fa-check mr-1" />Vložit</button>
          <button type="button" className="btn-secondary py-1 text-xs shrink-0" onClick={() => setPopup(null)}>Zrušit</button>
        </div>
      )}

      {/* Popup pro obrázek */}
      {popup?.type === "image" && (
        <div className="border-b border-blue-100 bg-blue-50 px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-700 font-medium shrink-0 w-28">URL obrázku:</span>
            <input autoFocus className="input py-1 text-sm flex-1" placeholder="https://...obrazek.jpg" value={popup.url} onChange={(e) => setPopup({ ...popup, url: e.target.value })} onKeyDown={(e) => { if (e.key === "Escape") setPopup(null); }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-700 font-medium shrink-0 w-28">Odkaz (volitelný):</span>
            <input className="input py-1 text-sm flex-1" placeholder="https://..." value={popup.linkUrl} onChange={(e) => setPopup({ ...popup, linkUrl: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertImage(); } if (e.key === "Escape") setPopup(null); }} />
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-primary py-1 text-xs" onClick={insertImage}><i className="fa-regular fa-check mr-1" />Vložit obrázek</button>
            <button type="button" className="btn-secondary py-1 text-xs" onClick={() => setPopup(null)}>Zrušit</button>
          </div>
        </div>
      )}

      {sourceMode
        ? <textarea className="w-full min-h-64 max-h-96 p-4 text-xs font-mono focus:outline-none resize-none" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
        : <div ref={ref} contentEditable suppressContentEditableWarning onInput={() => { if (ref.current) onChange(ref.current.innerHTML); }} className="min-h-[32rem] max-h-[48rem] overflow-y-auto p-4 text-sm focus:outline-none prose prose-sm max-w-none" style={{ lineHeight: 1.6 }} />
      }
      {showVars && (
        <div className="border-t-2 border-gray-300 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Proměnné — kliknutím vložíte do textu</p>
          <div className="space-y-1">
            {TEMPLATE_VARS.map((v) => (
              <button key={v.key} type="button" onClick={() => insertVar(v.key)} className="flex items-center gap-3 w-full text-left px-2 py-1 rounded hover:bg-gray-200 transition-colors">
                <code className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{v.key}</code>
                <span className="text-xs text-gray-500">{v.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Příplatek editor ---
interface SurchargeEditorProps {
  surcharge: Surcharge | null;
  languages: Language[];
  campId: string;
  onSave: () => void;
  onClose: () => void;
}

function SurchargeEditor({ surcharge, languages, campId, onSave, onClose }: SurchargeEditorProps) {
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
        await api.put(`/camps/${campId}/surcharges/${surcharge.id}`, { isOptional, translations });
        surchargeId = surcharge.id;
      } else {
        const res = await api.post(`/camps/${campId}/surcharges`, { isOptional, translations });
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
                    {FLAGS[l.code] ?? "🌐"} {l.name}
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
  const [prices, setPrices] = useState<Record<string, { pricePerNight: string; adultPricePerNight: string; childPricePerNight: string }>>(() => {
    if (!type) return {};
    return Object.fromEntries(type.prices.map((p) => [p.languageCode, { pricePerNight: String(p.pricePerNight), adultPricePerNight: String(p.adultPricePerNight), childPricePerNight: String(p.childPricePerNight) }]));
  });
  const [saving, setSaving] = useState(false);

  const getPrice = (lang: string) => prices[lang] ?? { pricePerNight: "0", adultPricePerNight: "0", childPricePerNight: "0" };
  const setPrice = (lang: string, field: "pricePerNight" | "adultPricePerNight" | "childPricePerNight", val: string) => {
    setPrices((prev) => ({ ...prev, [lang]: { ...getPrice(lang), [field]: val } }));
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
      if (type) {
        await api.put(`/camps/${campId}/accommodation-types/${type.id}`, { translations, capacity });
        for (const [lang, p] of Object.entries(numericPrices)) {
          await api.put(`/camps/${campId}/accommodation-types/${type.id}/prices/${lang}`, p);
        }
      } else {
        const res = await api.post(`/camps/${campId}/accommodation-types`, { translations, capacity });
        const newId = res.data.id;
        for (const [lang, p] of Object.entries(numericPrices)) {
          await api.put(`/camps/${campId}/accommodation-types/${newId}/prices/${lang}`, p);
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
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

          {/* Záložky per jazyk — název + ceny dohromady */}
          <div>
            <div className="flex gap-1 border-b border-gray-200 mb-4">
              {languages.map((l) => {
                const filled = !!(names[l.code]?.trim());
                return (
                  <button key={l.code} type="button" onClick={() => setActiveLang(l.code)}
                    className={`px-3 py-1.5 text-sm border-b-2 transition-colors flex items-center gap-1.5 ${activeLang === l.code ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}>
                    {FLAGS[l.code] ?? "🌐"} {l.name}
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
                <RichTextEditor value={longDescriptions[activeLang] ?? ""} onChange={(v) => setLongDescriptions({ ...longDescriptions, [activeLang]: v })} />
              </div>
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
            </div>
          </div>

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

// --- Hlavní stránka ---
export default function CampDetailPage() {
  useTitle("Detail objektu");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuth();
  const toast = useToast();
  const [camp, setCamp] = useState<Camp | null>(null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("settings");
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
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoLang, setInfoLang] = useState("");
  const [infoValues, setInfoValues] = useState<Record<string, string>>({});
  const [savingInfo, setSavingInfo] = useState(false);

  // Accommodation type editor
  const [editType, setEditType] = useState<AccommodationType | null | "new">(null);

  // Surcharge editor
  const [editSurcharge, setEditSurcharge] = useState<Surcharge | null | "new">(null);

  const load = async () => {
    const [campRes, langRes, tplRes] = await Promise.all([
      api.get(`/camps/${id}`),
      api.get("/languages"),
      api.get(`/email-templates/${id}`),
    ]);
    setCamp(campRes.data);
    setUseCustomSmtp(campRes.data.useCustomSmtp ?? false);
    setHideAdults(campRes.data.hideAdults ?? false);
    setHideChildren(campRes.data.hideChildren ?? false);
    setInfoValues(campRes.data.info ?? {});
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
    data.hideAdults = hideAdults;
    data.hideChildren = hideChildren;
    try {
      const res = await api.put(`/camps/${id}`, data);
      setCamp(res.data);
      toast.success("Nastavení bylo uloženo.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Nepodařilo se uložit.");
    } finally {
      setSaving(false);
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

  const tabs: { key: Tab; label: string }[] = [
    { key: "settings", label: "Nastavení" },
    { key: "types", label: "Typy ubytování" },
    { key: "surcharges", label: "Příplatky" },
    { key: "emails", label: "E-mailové šablony" },
    { key: "embed", label: "Vložení na web" },
    { key: "smtp", label: "SMTP" },
  ];

  const getTypeName = (t: AccommodationType) => {
    const tr = t.translations as Record<string, { name: string }>;
    return tr.cs?.name ?? tr[Object.keys(tr)[0]]?.name ?? "—";
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{camp.name}</h1>
          <button onClick={() => setHelpOpen(true)} className="text-gray-400 hover:text-blue-500 transition-colors" title="Nápověda"><i className="fa-regular fa-circle-question text-lg" /></button>
        </div>
        {helpOpen && <HelpModal topic="objekty" onClose={() => setHelpOpen(false)} />}
        <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
          <i className="fa-regular fa-arrow-up-right-from-square mr-1.5" />Otevřít formulář
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
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90dvh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">{FLAGS[infoLang] ?? "🌐"} {languages.find((l) => l.code === infoLang)?.name ?? infoLang.toUpperCase()} — Informace o objektu</h3>
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
              <div key={l.code} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium">{FLAGS[l.code] ?? "🌐"} {l.name}</span>
                <div className="flex gap-2 items-center">
                  {infoValues[l.code] ? <span className="text-xs text-green-600"><i className="fa-regular fa-check mr-1" />nastaveno</span> : <span className="text-xs text-gray-400">prázdné</span>}
                  {can("camps_edit") && (
                    <button className="btn-secondary text-xs py-1" onClick={() => { setInfoLang(l.code); setInfoOpen(true); }}>
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

          {camp.accommodationTypes?.map((t) => {
            const cs = languages.find((l) => l.code === "cs");
            const csPrice = t.prices.find((p) => p.languageCode === "cs") ?? t.prices[0];
            return (
              <div key={t.id} className="card p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{getTypeName(t)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Kapacita: {t.capacity} míst</p>
                  {csPrice && (
                    <p className="text-xs text-gray-400">
                      {csPrice.pricePerNight} {cs?.currencySymbol ?? "Kč"} / noc · dospělý {csPrice.adultPricePerNight} · dítě {csPrice.childPricePerNight}
                    </p>
                  )}
                </div>
                {can("camps_edit") && (
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs" onClick={() => setEditType(t)}><i className="fa-regular fa-pen mr-1" />Upravit</button>
                    <button className="btn-danger text-xs" onClick={() => handleDeleteType(t.id)}><i className="fa-regular fa-trash mr-1" />Smazat</button>
                  </div>
                )}
              </div>
            );
          })}

          {can("camps_edit") && (
            <button className="btn-primary" onClick={() => setEditType("new")}><i className="fa-regular fa-plus mr-1.5" />Přidat typ ubytování</button>
          )}
        </div>
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
            <div><label className="label">SMTP Heslo</label><input className="input" name="smtpPassword" type="password" placeholder="Ponechte prázdné pro zachování" onChange={() => setSmtpTested(false)} /></div>
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

          {camp.surcharges.map((s: Surcharge) => {
            const t = s.translations as Record<string, { name: string }>;
            const csPrice = s.prices.find((p) => p.languageCode === "cs") ?? s.prices[0];
            return (
              <div key={s.id} className="card p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{t.cs?.name ?? t[Object.keys(t)[0]]?.name ?? "—"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {csPrice ? `${csPrice.pricePerNight} Kč / noc` : ""}
                  </p>
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
        <div className="space-y-4">
          {editTpl ? (
            <form onSubmit={handleSaveTpl} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => setEditTpl(null)}><i className="fa-regular fa-arrow-left mr-1" />Zpět</button>
                  <h3 className="font-semibold">{editTpl.type === "ADMIN_NOTIFICATION" ? "Notifikace správci" : `Potvrzení zákazníkovi — ${FLAGS[editTpl.languageCode] ?? ""} ${editTpl.languageCode.toUpperCase()}`}</h3>
                </div>
                <div className="flex gap-2">
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
                <h3 className="font-semibold mb-3"><i className="fa-regular fa-envelope-open-text mr-2" />Notifikace správci</h3>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-sm font-medium">Česky (výchozí)</span>
                    <p className="text-xs text-gray-400 mt-0.5">Odesílá se vždy v češtině na notifikační e-mail objektu.</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {(() => {
                      const tpl = templates.find((t) => t.type === "ADMIN_NOTIFICATION" && t.languageCode === "cs");
                      return (<>
                        {tpl ? <span className="text-xs text-green-600"><i className="fa-regular fa-check mr-1" />nastavena</span> : <span className="text-xs text-gray-400">chybí</span>}
                        {can("templates_edit") && (
                          <button className="btn-secondary text-xs py-1" onClick={() => openEditTpl(tpl ?? { id: "", campId: id!, type: "ADMIN_NOTIFICATION", languageCode: "cs", subject: "", body: "" })}>
                            {tpl ? <><i className="fa-regular fa-pen mr-1" />Upravit</> : <><i className="fa-regular fa-plus mr-1" />Vytvořit</>}
                          </button>
                        )}
                      </>);
                    })()}
                  </div>
                </div>
              </div>
              <div className="card p-5">
                <h3 className="font-semibold mb-3"><i className="fa-regular fa-envelope mr-2" />Potvrzení zákazníkovi</h3>
                <div className="space-y-2">
                  {languages.map((lang) => {
                    const tpl = templates.find((t) => t.type === "CUSTOMER_CONFIRMATION" && t.languageCode === lang.code);
                    return (
                      <div key={lang.code} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm font-medium">{FLAGS[lang.code] ?? "🌐"} {lang.name}</span>
                        <div className="flex gap-2 items-center">
                          {tpl ? <span className="text-xs text-green-600"><i className="fa-regular fa-check mr-1" />nastavena</span> : <span className="text-xs text-gray-400">chybí</span>}
                          {can("templates_edit") && (
                            <button className="btn-secondary text-xs py-1" onClick={() => openEditTpl(tpl ?? { id: "", campId: id!, type: "CUSTOMER_CONFIRMATION", languageCode: lang.code, subject: "", body: "" })}>
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
          <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg overflow-x-auto whitespace-pre">
            {`<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  style="border:none;border-radius:12px;"\n></iframe>`}
          </div>
          <p className="text-xs text-gray-500">Přímý odkaz: <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{embedUrl}</a></p>
          <p className="text-xs text-gray-500">Pro konkrétní jazyk přidejte parametr: <code className="bg-gray-100 px-1 rounded">?lang=en</code></p>
          {languages.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Dostupné jazyky:</p>
              <div className="space-y-1">
                {languages.map((l) => (
                  <div key={l.code} className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{FLAGS[l.code] ?? "🌐"}</span>
                    <span>{l.name}</span>
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-500">?lang={l.code}</code>
                    <a href={`${embedUrl}?lang=${l.code}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 transition-colors">
                      <i className="fa-regular fa-arrow-up-right-from-square mr-0.5" />otevřít
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
