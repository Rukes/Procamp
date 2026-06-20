import { useTitle } from "../hooks/useTitle";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

interface Settings {
  defaultLanguageCode: string;
  thousandsSeparator: string;
  decimalSeparator: string;
}

interface Language { id: string; code: string; name: string; isDefault: boolean; }

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

const formatPreview = (thousands: string, decimal: string) =>
  `1${thousands}234${decimal}56`;

export default function SystemSettingsPage() {
  useTitle("Nastavení systému");
  const { user } = useAuth();
  const toast = useToast();
  const [settings, setSettings] = useState<Settings>({ defaultLanguageCode: "cs", thousandsSeparator: " ", decimalSeparator: "," });
  const [languages, setLanguages] = useState<Language[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/system-settings").then((r) => setSettings(r.data)).catch(() => {});
    api.get("/languages").then((r) => setLanguages(r.data)).catch(() => {});
  }, []);

  if (!user?.isSuperAdmin) {
    return <div className="p-8 text-gray-500">Tato stránka je přístupná pouze super adminovi.</div>;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/system-settings", settings);
      toast.success("Nastavení systému bylo uloženo.");
    } catch {
      toast.error("Nepodařilo se uložit nastavení.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nastavení systému</h1>

      <form onSubmit={handleSave} className="card p-6 space-y-6">
        <div>
          <label className="label">Výchozí jazyk</label>
          <select
            className="input"
            value={settings.defaultLanguageCode}
            onChange={(e) => setSettings({ ...settings, defaultLanguageCode: e.target.value })}
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Jazyk, který se použije ve formuláři, pokud není specifikován jiný.</p>
        </div>

        <hr />

        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Formátování čísel</p>

          <div className="space-y-3">
            <div>
              <label className="label">Oddělovač tisíců</label>
              <select
                className="input"
                value={settings.thousandsSeparator}
                onChange={(e) => setSettings({ ...settings, thousandsSeparator: e.target.value })}
              >
                {THOUSANDS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Oddělovač desetinných míst</label>
              <select
                className="input"
                value={settings.decimalSeparator}
                onChange={(e) => setSettings({ ...settings, decimalSeparator: e.target.value })}
              >
                {DECIMAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">Náhled</p>
              <p className="text-lg font-semibold text-gray-900">{formatPreview(settings.thousandsSeparator, settings.decimalSeparator)}</p>
            </div>
          </div>
        </div>

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ukládám…</> : <><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit nastavení</>}
        </button>
      </form>
    </div>
  );
}
