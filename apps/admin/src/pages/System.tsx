import { useTitle } from "../hooks/useTitle";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../contexts/ToastContext";

interface SystemSettings {
  smtpEnabled: boolean;
}

export default function SystemPage() {
  useTitle("Systém");
  const toast = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    api.get("/system-settings").then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await api.put("/system-settings", { smtpEnabled: settings.smtpEnabled });
      setSettings(res.data);
      toast.success("Nastavení bylo uloženo.");
    } catch {
      toast.error("Nepodařilo se uložit nastavení.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOut(true);
    try {
      await api.post("/system-settings/logout-all");
      toast.success("Všichni uživatelé byli odhlášeni.");
      setLogoutConfirm(false);
    } catch {
      toast.error("Nepodařilo se odhlásit uživatele.");
    } finally {
      setLoggingOut(false);
    }
  };

  if (!settings) return <div className="p-8 text-gray-400">Načítám…</div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Systém</h1>

      {/* SMTP */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-1">E-maily (SMTP)</h2>
        <p className="text-sm text-gray-500 mb-4">Kill switch pro veškerý mailing v systému. Pokud je vypnuto, žádné e-maily se neodesílají — ani přes systémové, ani přes vlastní SMTP objektu.</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600"
            checked={settings.smtpEnabled}
            onChange={(e) => {
              if (!e.target.checked && !confirm("Opravdu vypnout odesílání e-mailů? Zákazníci ani správci nebudou dostávat žádné zprávy.")) {
                e.target.checked = true;
                return;
              }
              setSettings((s) => s ? { ...s, smtpEnabled: e.target.checked } : s);
            }}
          />
          <span className="text-sm font-medium text-gray-700">SMTP povoleno — e-maily se odesílají</span>
        </label>
        {!settings.smtpEnabled && (
          <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <i className="fa-regular fa-triangle-exclamation mr-1.5" />
            Mailing je vypnutý. Zákazníci ani správci nedostávají žádné e-maily.
          </p>
        )}
        <div className="mt-4">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ukládám…</> : <><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit</>}
          </button>
        </div>
      </div>

      {/* Správa sessions */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Správa přihlášení</h2>
        <p className="text-sm text-gray-500 mb-4">Okamžitě odhlásí všechny uživatele z administrace. Každý se bude muset přihlásit znovu.</p>
        {!logoutConfirm ? (
          <button className="text-sm px-3 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors" onClick={() => setLogoutConfirm(true)}>
            <i className="fa-regular fa-right-from-bracket mr-1.5" />Odhlásit všechny uživatele
          </button>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 flex-1">Opravdu odhlásit všechny uživatele?</p>
            <button className="text-sm px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 transition-colors" onClick={handleLogoutAll} disabled={loggingOut}>
              {loggingOut ? "Odhlasuji…" : "Ano, odhlásit"}
            </button>
            <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setLogoutConfirm(false)}>Zrušit</button>
          </div>
        )}
      </div>
    </div>
  );
}
