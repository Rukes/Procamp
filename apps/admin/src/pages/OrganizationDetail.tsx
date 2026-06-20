import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useToast } from "../contexts/ToastContext";
import RichTextEditor from "../components/RichTextEditor";

interface Organization {
  id: string;
  name: string;
  slug: string;
  country: string;
  ico: string;
  dic: string;
  address: string;
  contactPerson: string;
  billingEmail: string;
  termsText: string;
  defaultLanguageCode: string;
  thousandsSeparator: string;
  decimalSeparator: string;
  _count: { camps: number; users: number };
}

interface Language { id: string; code: string; name: string; }

const THOUSANDS_OPTIONS = [
  { value: " ", label: "Mezera — 1 000 000" },
  { value: ".", label: "Tečka — 1.000.000" },
  { value: ",", label: "Čárka — 1,000,000" },
  { value: "", label: "Žádný — 1000000" },
];
const DECIMAL_OPTIONS = [
  { value: ",", label: "Čárka — 1,50" },
  { value: ".", label: "Tečka — 1.50" },
];
const formatPreview = (t: string, d: string) => `1${t}234${d}56`;

type Tab = "billing" | "settings" | "terms";

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [org, setOrg] = useState<Organization | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [tab, setTab] = useState<Tab>("billing");
  const [form, setForm] = useState<Partial<Organization>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/organizations/${id}`).then((r) => { setOrg(r.data); setForm(r.data); }).catch(() => navigate("/organizations"));
    api.get("/languages").then((r) => setLanguages(r.data)).catch(() => {});
  }, [id]);

  if (!org) return <div className="p-8 text-gray-400">Načítám…</div>;

  const set = (k: keyof Organization, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/organizations/${id}`, form);
      toast.success("Uloženo.");
      setOrg({ ...org, ...form } as Organization);
    } catch {
      toast.error("Nepodařilo se uložit.");
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "billing", label: "Fakturační údaje", icon: "fa-receipt" },
    { key: "settings", label: "Nastavení", icon: "fa-gear" },
    { key: "terms", label: "Podmínky & GDPR", icon: "fa-shield-check" },
  ];

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/organizations")} className="text-gray-400 hover:text-gray-600 transition-colors">
          <i className="fa-regular fa-arrow-left" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{org._count.camps} kempů · {org._count.users} uživatelů</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <i className={`fa-regular ${t.icon} mr-1.5`} />{t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {tab === "billing" && (
          <>
            <div>
              <label className="label">Název organizace *</label>
              <input className="input" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div>
              <label className="label">URL slug *</label>
              <input className="input" value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} required pattern="[a-z0-9-]+" />
              <p className="text-xs text-gray-400 mt-1">URL formuláře: /<strong>{form.slug || "slug"}</strong>/kemp-slug</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">IČO</label>
                <input className="input" value={form.ico ?? ""} onChange={(e) => set("ico", e.target.value)} />
              </div>
              <div>
                <label className="label">DIČ</label>
                <input className="input" value={form.dic ?? ""} onChange={(e) => set("dic", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Adresa</label>
              <input className="input" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div>
              <label className="label">Země</label>
              <input className="input" value={form.country ?? ""} onChange={(e) => set("country", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Kontaktní osoba</label>
                <input className="input" value={form.contactPerson ?? ""} onChange={(e) => set("contactPerson", e.target.value)} />
              </div>
              <div>
                <label className="label">Fakturační e-mail</label>
                <input className="input" type="email" value={form.billingEmail ?? ""} onChange={(e) => set("billingEmail", e.target.value)} />
              </div>
            </div>
          </>
        )}

        {tab === "settings" && (
          <>
            <div>
              <label className="label">Výchozí jazyk formuláře</label>
              <select className="input" value={form.defaultLanguageCode ?? "cs"} onChange={(e) => set("defaultLanguageCode", e.target.value)}>
                {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">Jazyk použitý ve formuláři pokud není specifikován jiný.</p>
            </div>
            <hr />
            <p className="text-sm font-medium text-gray-700">Formátování čísel</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Oddělovač tisíců</label>
                <select className="input" value={form.thousandsSeparator ?? " "} onChange={(e) => set("thousandsSeparator", e.target.value)}>
                  {THOUSANDS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Oddělovač desetin</label>
                <select className="input" value={form.decimalSeparator ?? ","} onChange={(e) => set("decimalSeparator", e.target.value)}>
                  {DECIMAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">Náhled</p>
              <p className="text-lg font-semibold text-gray-900">{formatPreview(form.thousandsSeparator ?? " ", form.decimalSeparator ?? ",")}</p>
            </div>
          </>
        )}

        {tab === "terms" && (
          <>
            <div>
              <label className="label mb-2">Obchodní podmínky & GDPR</label>
              <p className="text-sm text-gray-500 mb-3">
                Pokud je text vyplněn, zákazník musí v posledním kroku rezervace zaškrtnout souhlas s podmínkami.
                Text bude dostupný přes odkaz „podmínkami" v rezervačním formuláři.
              </p>
              <RichTextEditor
                value={form.termsText ?? ""}
                onChange={(html) => set("termsText", html)}
              />
            </div>
          </>
        )}

        <div className="pt-2">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ukládám…</> : <><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit</>}
          </button>
        </div>
      </form>
    </div>
  );
}
