import { useTitle } from "../hooks/useTitle";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { useOrg } from "../contexts/OrgContext";
import WysiwygEditor from "../components/WysiwygEditor";
import Tooltip from "../components/Tooltip";
import CountrySelect from "../components/CountrySelect";

interface Organization {
  id: string;
  name: string;
  slug: string;
  billingName: string;
  country: string;
  ico: string;
  dic: string;
  address: string;
  contactPerson: string;
  billingEmail: string;
  termsText: string;
  requireTermsAcceptance: boolean;
  defaultLanguageCode: string;
  thousandsSeparator: string;
  decimalSeparator: string;
  internalNote: string | null;
  gaTrackingId?: string | null;
  goSmsClientId?: string;
  goSmsClientSecret?: string;
  goSmsChannelId?: number | null;
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

type Tab = "billing" | "settings" | "terms" | "gosms" | "superadmin";

export default function OrganizationDetailPage() {
  useTitle("Detail organizace");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedOrgId, setSelectedOrgId } = useOrg();
  const toast = useToast();
  const [org, setOrg] = useState<Organization | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [tab, setTab] = useState<Tab>("billing");
  const [form, setForm] = useState<Partial<Organization>>({});
  const [saving, setSaving] = useState(false);
  const [aresLoading, setAresLoading] = useState(false);
  const [goSmsCredit, setGoSmsCredit] = useState<{ currentCredit: number; currency: string; channels: { id: number; name: string }[] } | null>(null);
  const [goSmsCreditLoading, setGoSmsCreditLoading] = useState(false);
  const [goSmsVerifying, setGoSmsVerifying] = useState(false);
  const [goSmsVerifyResult, setGoSmsVerifyResult] = useState<"ok" | "error" | null>(null);

  const loadAres = async () => {
    if (!form.ico || form.ico.length < 6) return;
    setAresLoading(true);
    try {
      const r = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${form.ico}`);
      if (!r.ok) { toast.error("IČO nenalezeno v ARES."); return; }
      const d = await r.json();
      setForm((f) => ({
        ...f,
        billingName: d.obchodniJmeno ?? f.billingName,
        dic: d.dic ?? f.dic,
        address: d.sidlo?.textovaAdresa ?? f.address,
        country: d.sidlo?.nazevStatu ?? f.country,
      }));
      toast.success("Údaje načteny z ARES.");
    } catch {
      toast.error("Chyba při načítání z ARES.");
    } finally {
      setAresLoading(false);
    }
  };

  useEffect(() => {
    api.get(`/organizations/${id}`).then((r) => { setOrg(r.data); setForm(r.data); }).catch(() => navigate("/organizations"));
    api.get("/languages").then((r) => setLanguages(r.data)).catch(() => {});
  }, [id]);

  if (!org) return <div className="p-8 text-gray-400">Načítám…</div>;

  const set = (k: keyof Organization, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleDelete = async () => {
    if (!confirm(`Smazat organizaci „${org.name}"? Tato akce odebere vazby na kempy a uživatele.`)) return;
    try {
      await api.delete(`/organizations/${id}`);
      toast.success("Organizace smazána.");
      navigate("/organizations");
    } catch {
      toast.error("Nepodařilo se smazat organizaci.");
    }
  };

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

  const verifyGoSms = async () => {
    setGoSmsVerifying(true);
    setGoSmsVerifyResult(null);
    try {
      await api.get(`/organizations/${id}/gosms-credit`);
      setGoSmsVerifyResult("ok");
    } catch {
      setGoSmsVerifyResult("error");
    } finally {
      setGoSmsVerifying(false);
    }
  };

  const loadGoSmsCredit = async () => {
    setGoSmsCreditLoading(true);
    try {
      const r = await api.get(`/organizations/${id}/gosms-credit`);
      setGoSmsCredit(r.data);
    } catch {
      toast.error("Nepodařilo se načíst kredit z GoSMS.");
    } finally {
      setGoSmsCreditLoading(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: string; saOnly?: boolean }[] = [
    { key: "billing", label: "Fakturační údaje", icon: "fa-receipt" },
    { key: "settings", label: "Nastavení", icon: "fa-gear" },
    { key: "terms", label: "Podmínky & GDPR", icon: "fa-shield-check" },
    { key: "gosms", label: "GoSMS", icon: "fa-message-sms" },
    { key: "superadmin", label: "Super Admin", icon: "fa-shield-halved", saOnly: true },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/organizations")} className="text-gray-400 hover:text-gray-600 transition-colors">
          <i className="fa-regular fa-arrow-left" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{org._count.camps} kempů · {org._count.users} uživatelů</p>
        </div>
        {selectedOrgId !== id && (
          <button className="btn-secondary text-sm" onClick={() => setSelectedOrgId(id!)}>
            <i className="fa-regular fa-right-left mr-1.5" />Přepnout
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {tabs.filter((t) => !t.saOnly || user?.isSuperAdmin).map((t) => (
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
            <div>
              <label className="label">Odběratel</label>
              <input className="input" value={form.billingName ?? ""} onChange={(e) => set("billingName", e.target.value)} placeholder="Fakturační název firmy" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">IČO</label>
                <div className="flex gap-2">
                  <input className="input" value={form.ico ?? ""} onChange={(e) => set("ico", e.target.value)} />
                  <Tooltip text="Načíst z ARES">
                    <button type="button" onClick={loadAres} disabled={aresLoading} className="btn-secondary px-3 flex-shrink-0">
                      <i className={`fa-regular fa-rotate ${aresLoading ? "animate-spin" : ""}`} />
                    </button>
                  </Tooltip>
                </div>
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
              <CountrySelect value={form.country ?? ""} onChange={(v) => set("country", v)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Kontaktní osoba</label>
                <input className="input" value={form.contactPerson ?? ""} onChange={(e) => set("contactPerson", e.target.value)} />
              </div>
              <div>
                <label className="label">Fakturační e-mail</label>
                <input className="input" type="email" value={form.billingEmail ?? ""} onChange={(e) => set("billingEmail", e.target.value)} />
              </div>
            </div>
            {user?.isSuperAdmin && (
              <div className="border-t border-red-200 pt-5 mt-2">
                <label className="label text-red-600">Interní poznámka <span className="text-xs font-normal text-red-400">(vidí pouze SA)</span></label>
                <textarea
                  className="w-full rounded-lg border-2 border-red-400 px-3 py-2 text-sm text-gray-800 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-400 resize-y min-h-[100px]"
                  value={form.internalNote ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, internalNote: e.target.value }))}
                  placeholder="Soukromá poznámka k organizaci…"
                />
              </div>
            )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <hr />
            <div>
              <label className="label">Google Analytics ID <span className="text-gray-400 font-normal">(volitelné)</span></label>
              <input className="input font-mono" value={form.gaTrackingId ?? ""} onChange={(e) => set("gaTrackingId", e.target.value)} placeholder="G-XXXXXXXXXX" />
              <p className="text-xs text-gray-400 mt-1">Measurement ID pro sledování rezervací v Google Analytics. Pokud je vyplněno, události z rezervačního formuláře budou odesílány do vaší GA property.</p>
            </div>
          </>
        )}

        {tab === "terms" && (
          <>
            <div>
              <label className="label mb-2">Text podmínek & GDPR</label>
              <WysiwygEditor
                value={form.termsText ?? ""}
                onChange={(html) => set("termsText", html)}
              />
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                id="requireTermsAcceptance"
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={form.requireTermsAcceptance ?? false}
                onChange={(e) => setForm((f) => ({ ...f, requireTermsAcceptance: e.target.checked }))}
              />
              <div>
                <label htmlFor="requireTermsAcceptance" className="text-sm font-medium text-gray-800 cursor-pointer">Zobrazovat nutné potvrzení uživatele</label>
                <p className="text-xs text-gray-500 mt-0.5">Aktivní: zákazník musí zaškrtnout souhlas s podmínkami.</p>
                <p className="text-xs text-gray-500">Neaktivní: text podmínek se zobrazí pouze jako informace.</p>
              </div>
            </div>
          </>
        )}

        {tab === "gosms" && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 mb-2">
              <i className="fa-regular fa-circle-info mr-1.5" />Přihlašovací údaje najdete v samoobsluze GoSMS. ID kanálu lze načíst tlačítkem níže po vyplnění Client ID a Secret.
            </div>
            <div>
              <label className="label">Client ID</label>
              <input className="input font-mono" value={(form as any).goSmsClientId ?? ""} onChange={(e) => setForm((f) => ({ ...f, goSmsClientId: e.target.value }))} placeholder="váš client_id z GoSMS" />
            </div>
            <div>
              <label className="label">Client Secret</label>
              <input className="input font-mono" type="password" autoComplete="new-password" value={(form as any).goSmsClientSecret ?? ""} onChange={(e) => setForm((f) => ({ ...f, goSmsClientSecret: e.target.value }))} placeholder="váš client_secret z GoSMS" />
            </div>
            <div>
              <label className="label">ID komunikačního kanálu</label>
              <input className="input" type="number" value={(form as any).goSmsChannelId ?? ""} onChange={(e) => setForm((f) => ({ ...f, goSmsChannelId: e.target.value ? Number(e.target.value) : null }))} placeholder="např. 123" />
            </div>
            {goSmsCredit && (
              <div className="text-sm text-gray-700">
                Kredit: <strong>{goSmsCredit.currentCredit} {goSmsCredit.currency}</strong>
                {goSmsCredit.channels.length > 0 && (
                  <span className="ml-3 text-gray-500">Kanály: {goSmsCredit.channels.map((c) => `${c.name} (ID: ${c.id})`).join(", ")}</span>
                )}
              </div>
            )}
          </>
        )}

        {tab !== "gosms" && tab !== "superadmin" && (
        <div className="pt-2 flex items-center justify-between">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ukládám…</> : <><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit</>}
          </button>
          <button type="button" className="btn-danger text-sm" onClick={handleDelete}>
            <i className="fa-regular fa-trash mr-1.5" />Smazat organizaci
          </button>
        </div>
        )}
        {tab === "gosms" && (
        <div className="pt-2 flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <button type="button" className="btn-secondary" onClick={verifyGoSms} disabled={goSmsVerifying}>
              {goSmsVerifying ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ověřuji…</> : <><i className="fa-regular fa-circle-check mr-1.5" />Ověřit nastavení</>}
            </button>
            {goSmsVerifyResult === "ok" && <span className="text-sm text-green-600 flex items-center gap-1.5"><i className="fa-regular fa-circle-check" />Připojení funguje</span>}
            {goSmsVerifyResult === "error" && <span className="text-sm text-red-600 flex items-center gap-1.5"><i className="fa-regular fa-circle-xmark" />Připojení selhalo — zkontrolujte Client ID a Secret</span>}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button type="button" className="btn-secondary" onClick={loadGoSmsCredit} disabled={goSmsCreditLoading}>
              {goSmsCreditLoading ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Načítám…</> : <><i className="fa-regular fa-wallet mr-1.5" />Načíst kredit</>}
            </button>
            <button className="btn-primary ml-auto" type="submit" disabled={saving}>
              {saving ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ukládám…</> : <><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit GoSMS nastavení</>}
            </button>
          </div>
        </div>
        )}
      </form>

      {tab === "superadmin" && user?.isSuperAdmin && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-1">Export dat organizace</h3>
            <p className="text-sm text-gray-500 mb-4">
              JSON export pro účely debuggingu — organizace, objekty, uživatelé (bez hesel), blokace a rezervace za posledních 30 dní.
            </p>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              onClick={async () => {
                const res = await api.get(`/organizations/${id}/export`, { responseType: "blob" });
                const url = URL.createObjectURL(new Blob([res.data], { type: "application/json" }));
                const a = document.createElement("a");
                a.href = url;
                a.download = `org-export-${org.slug}-${new Date().toISOString().slice(0, 16).replace("T", "-")}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <i className="fa-regular fa-download" />
              Stáhnout JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
