import { useTitle } from "../hooks/useTitle";
import { useEffect, useRef, useState } from "react";
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

function WysiwygEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInit = useRef(false);
  useEffect(() => {
    if (ref.current && !isInit.current) { ref.current.innerHTML = value; isInit.current = true; }
  }, [value]);
  const exec = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); ref.current?.focus(); if (ref.current) onChange(ref.current.innerHTML); };
  const insertVar = (v: string) => { ref.current?.focus(); document.execCommand("insertText", false, v); if (ref.current) onChange(ref.current.innerHTML); };
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <button type="button" onClick={() => exec("bold")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 font-bold"><i className="fa-regular fa-bold" /></button>
        <button type="button" onClick={() => exec("italic")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 italic"><i className="fa-regular fa-italic" /></button>
        <button type="button" onClick={() => exec("underline")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 underline"><i className="fa-regular fa-underline" /></button>
        <span className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec("formatBlock", "h2")} className="px-2 py-1 text-sm rounded hover:bg-gray-200">H2</button>
        <button type="button" onClick={() => exec("formatBlock", "h3")} className="px-2 py-1 text-sm rounded hover:bg-gray-200">H3</button>
        <button type="button" onClick={() => exec("formatBlock", "p")} className="px-2 py-1 text-sm rounded hover:bg-gray-200"><i className="fa-regular fa-paragraph" /></button>
        <span className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec("insertUnorderedList")} className="px-2 py-1 text-sm rounded hover:bg-gray-200"><i className="fa-regular fa-list-ul" /></button>
        <button type="button" onClick={() => exec("insertOrderedList")} className="px-2 py-1 text-sm rounded hover:bg-gray-200"><i className="fa-regular fa-list-ol" /></button>
        <span className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => exec("removeFormat")} className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-500"><i className="fa-regular fa-eraser" /></button>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning onInput={() => { if (ref.current) onChange(ref.current.innerHTML); }} className="min-h-64 p-4 text-sm focus:outline-none prose prose-sm max-w-none" style={{ lineHeight: 1.6 }} />
      <div className="border-t border-gray-100 bg-gray-50 p-3">
        <p className="text-xs font-medium text-gray-500 mb-2">Kliknutím vložíte proměnnou do textu:</p>
        <div className="space-y-1">
          {TEMPLATE_VARS.map((v) => (
            <button key={v.key} type="button" onClick={() => insertVar(v.key)} className="flex items-center gap-3 w-full text-left px-2 py-1 rounded hover:bg-gray-200 transition-colors">
              <code className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{v.key}</code>
              <span className="text-xs text-gray-500">{v.desc}</span>
            </button>
          ))}
        </div>
      </div>
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
        Object.entries(names).filter(([, v]) => v.trim()).map(([k, v]) => [k, { name: v.trim() }])
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
  onSave: () => void;
  onClose: () => void;
}

function AccommodationTypeEditor({ type, languages, campId, onSave, onClose }: TypeEditorProps) {
  const toast = useToast();
  const [activeLang, setActiveLang] = useState(languages[0]?.code ?? "cs");
  const [names, setNames] = useState<Record<string, string>>(() => {
    if (!type) return {};
    const t = type.translations as Record<string, { name: string }>;
    return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.name]));
  });
  const [capacity, setCapacity] = useState(type?.capacity ?? 0);
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
      const translations = Object.fromEntries(Object.entries(names).filter(([, v]) => v.trim()).map(([k, v]) => [k, { name: v.trim() }]));
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
            <input className="input max-w-xs" type="number" min="0" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Cena / noc {sym && <span className="text-gray-400">({sym})</span>}</label>
                  <input className="input" type="number" min="0" step="0.01" value={p.pricePerNight} onChange={(e) => setPrice(activeLang, "pricePerNight", e.target.value)} />
                </div>
                <div>
                  <label className="label">Dospělý / noc {sym && <span className="text-gray-400">({sym})</span>}</label>
                  <input className="input" type="number" min="0" step="0.01" value={p.adultPricePerNight} onChange={(e) => setPrice(activeLang, "adultPricePerNight", e.target.value)} />
                </div>
                <div>
                  <label className="label">Dítě / noc {sym && <span className="text-gray-400">({sym})</span>}</label>
                  <input className="input" type="number" min="0" step="0.01" value={p.childPricePerNight} onChange={(e) => setPrice(activeLang, "childPricePerNight", e.target.value)} />
                </div>
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
  const [languages, setLanguages] = useState<Language[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editTpl, setEditTpl] = useState<EmailTemplate | null>(null);
  const [tplBody, setTplBody] = useState("");
  const [tplSubject, setTplSubject] = useState("");

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
    setLanguages(langRes.data);
    setTemplates(tplRes.data);
    setOrgSlug(campRes.data.organization?.slug ?? null);
  };

  useEffect(() => { load(); }, [id]);

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
    try {
      const res = await api.put(`/camps/${id}`, data);
      setCamp(res.data);
      toast.success("SMTP nastavení bylo uloženo.");
    } catch {
      toast.error("Nepodařilo se uložit SMTP nastavení.");
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-gray-900">{camp.name}</h1>
        <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
          <i className="fa-regular fa-arrow-up-right-from-square mr-1.5" />Otevřít formulář
        </a>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Settings */}
      {tab === "settings" && (
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
        <form onSubmit={handleSaveSMTP} className="card p-6 space-y-4 max-w-2xl">
          <p className="text-sm text-gray-500">Nastavte SMTP pro odesílání e-mailů z tohoto objektu.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">SMTP Host</label><input className="input" name="smtpHost" defaultValue={(camp as unknown as Record<string,string>).smtpHost ?? ""} /></div>
            <div><label className="label">SMTP Port</label><input className="input" name="smtpPort" type="number" defaultValue={(camp as unknown as Record<string,number>).smtpPort ?? 587} /></div>
            <div><label className="label">SMTP Uživatel</label><input className="input" name="smtpUser" defaultValue={(camp as unknown as Record<string,string>).smtpUser ?? ""} /></div>
            <div><label className="label">SMTP Heslo</label><input className="input" name="smtpPassword" type="password" placeholder="Ponechte prázdné pro zachování" /></div>
            <div className="col-span-2"><label className="label">Odesílatel (From)</label><input className="input" name="smtpFrom" defaultValue={(camp as unknown as Record<string,string>).smtpFrom ?? ""} /></div>
          </div>
          {can("camps_edit") && (
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ukládám…</> : <><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit SMTP</>}
            </button>
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
              <div className="flex items-center gap-3 mb-2">
                <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => setEditTpl(null)}><i className="fa-regular fa-arrow-left mr-1" />Zpět</button>
                <h3 className="font-semibold">{editTpl.type === "ADMIN_NOTIFICATION" ? "Notifikace správci" : `Potvrzení zákazníkovi — ${FLAGS[editTpl.languageCode] ?? ""} ${editTpl.languageCode.toUpperCase()}`}</h3>
              </div>
              <div><label className="label">Předmět</label><input className="input max-w-2xl" value={tplSubject} onChange={(e) => setTplSubject(e.target.value)} required /></div>
              <div><label className="label">Tělo e-mailu</label><WysiwygEditor value={tplBody} onChange={setTplBody} /></div>
              <div className="flex gap-2 pt-2">
                <button className="btn-primary" type="submit"><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit šablonu</button>
                <button className="btn-secondary" type="button" onClick={() => setEditTpl(null)}><i className="fa-regular fa-xmark mr-1.5" />Zrušit</button>
              </div>
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
