import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { Camp, Surcharge, EmailTemplate, Language } from "@procamp/shared";
import { useAuth } from "../contexts/AuthContext";

type Tab = "settings" | "surcharges" | "emails" | "embed";

export default function CampDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const [camp, setCamp] = useState<Camp | null>(null);
  const [tab, setTab] = useState<Tab>("settings");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editTpl, setEditTpl] = useState<EmailTemplate | null>(null);

  const load = async () => {
    const [campRes, langRes, tplRes] = await Promise.all([
      api.get(`/camps/${id}`),
      api.get("/languages"),
      api.get(`/email-templates/${id}`),
    ]);
    setCamp(campRes.data);
    setLanguages(langRes.data);
    setTemplates(tplRes.data);
  };

  useEffect(() => { load(); }, [id]);

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!camp) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    fd.forEach((v, k) => { data[k] = isNaN(Number(v)) || v === "" ? v : Number(v); });
    try {
      const res = await api.put(`/camps/${id}`, data);
      setCamp(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSurcharge = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nameCz = fd.get("name_cs") as string;
    await api.post(`/camps/${id}/surcharges`, {
      pricePerNight: Number(fd.get("price")),
      isOptional: true,
      translations: { cs: { name: nameCz } },
    });
    e.currentTarget.reset();
    load();
  };

  const handleDeleteSurcharge = async (surchargeId: string) => {
    if (!confirm("Smazat příplatek?")) return;
    await api.delete(`/camps/${id}/surcharges/${surchargeId}`);
    load();
  };

  const handleSaveTpl = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTpl) return;
    const fd = new FormData(e.currentTarget);
    await api.put(`/email-templates/${id}/${editTpl.type}/${editTpl.languageCode}`, {
      subject: fd.get("subject"), body: fd.get("body"),
    });
    setEditTpl(null);
    load();
  };

  if (!camp) return <div className="p-8 text-gray-500">Načítám…</div>;

  const embedUrl = `${window.location.origin.replace(":3000", ":3002")}/form/${camp.slug}`;

  const tabs: { key: Tab; label: string }[] = [
    { key: "settings", label: "Nastavení" },
    { key: "surcharges", label: "Příplatky" },
    { key: "emails", label: "E-mailové šablony" },
    { key: "embed", label: "Vložení na web" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{camp.name}</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Settings */}
      {tab === "settings" && (
        <form onSubmit={handleSaveSettings} className="card p-6 space-y-6 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Název kempu</label>
              <input className="input" name="name" defaultValue={camp.name} required />
            </div>
            <div className="col-span-2">
              <label className="label">Notifikační e-mail</label>
              <input className="input" name="notificationEmail" type="email" defaultValue={camp.notificationEmail} />
            </div>
          </div>

          <hr />
          <h3 className="font-semibold text-gray-700">SMTP nastavení</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">SMTP Host</label><input className="input" name="smtpHost" defaultValue={(camp as unknown as Record<string,string>).smtpHost ?? ""} /></div>
            <div><label className="label">SMTP Port</label><input className="input" name="smtpPort" type="number" defaultValue={(camp as unknown as Record<string,number>).smtpPort ?? 587} /></div>
            <div><label className="label">SMTP Uživatel</label><input className="input" name="smtpUser" defaultValue={(camp as unknown as Record<string,string>).smtpUser ?? ""} /></div>
            <div><label className="label">SMTP Heslo</label><input className="input" name="smtpPassword" type="password" placeholder="Ponechte prázdné pro zachování" /></div>
            <div className="col-span-2"><label className="label">Odesílatel (From)</label><input className="input" name="smtpFrom" defaultValue={(camp as unknown as Record<string,string>).smtpFrom ?? ""} /></div>
          </div>

          <hr />
          <h3 className="font-semibold text-gray-700">Kapacity</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Karavany (počet míst)</label><input className="input" name="caravanCapacity" type="number" min="0" defaultValue={camp.caravanCapacity} /></div>
            <div><label className="label">Stany (počet míst)</label><input className="input" name="tentCapacity" type="number" min="0" defaultValue={camp.tentCapacity} /></div>
          </div>

          <hr />
          <h3 className="font-semibold text-gray-700">Ceny (Kč za noc)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Karavan / noc</label><input className="input" name="caravanPricePerNight" type="number" min="0" defaultValue={camp.caravanPricePerNight} /></div>
            <div><label className="label">Stan / noc</label><input className="input" name="tentPricePerNight" type="number" min="0" defaultValue={camp.tentPricePerNight} /></div>
            <div><label className="label">Dospělý / noc</label><input className="input" name="adultPricePerNight" type="number" min="0" defaultValue={camp.adultPricePerNight} /></div>
            <div><label className="label">Dítě / noc</label><input className="input" name="childPricePerNight" type="number" min="0" defaultValue={camp.childPricePerNight} /></div>
          </div>

          <div className="flex gap-3 items-center">
            {can("camps_edit") && <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Ukládám…" : "Uložit změny"}</button>}
            {saved && <span className="text-sm text-green-600">✓ Uloženo</span>}
          </div>
        </form>
      )}

      {/* Surcharges */}
      {tab === "surcharges" && (
        <div className="space-y-4 max-w-2xl">
          {camp.surcharges.map((s: Surcharge) => {
            const t = s.translations as Record<string, { name: string }>;
            return (
              <div key={s.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.cs?.name}</p>
                  <p className="text-sm text-gray-500">{s.pricePerNight} Kč / noc · {s.isOptional ? "volitelný" : "povinný"}</p>
                </div>
                {can("camps_edit") && (
                  <button className="btn-danger text-xs" onClick={() => handleDeleteSurcharge(s.id)}>Smazat</button>
                )}
              </div>
            );
          })}

          {can("camps_edit") && (
            <form onSubmit={handleAddSurcharge} className="card p-5">
              <h3 className="font-semibold mb-3">Přidat příplatek</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="label">Název (CZ)</label><input className="input" name="name_cs" required /></div>
                <div><label className="label">Cena / noc (Kč)</label><input className="input" name="price" type="number" min="0" required /></div>
              </div>
              <button className="btn-primary" type="submit">Přidat</button>
            </form>
          )}
        </div>
      )}

      {/* Email templates */}
      {tab === "emails" && (
        <div className="space-y-4 max-w-3xl">
          {editTpl ? (
            <form onSubmit={handleSaveTpl} className="card p-6 space-y-4">
              <h3 className="font-semibold">
                {editTpl.type === "ADMIN_NOTIFICATION" ? "Notifikace správci" : "Potvrzení zákazníkovi"} — {editTpl.languageCode.toUpperCase()}
              </h3>
              <div>
                <label className="label">Předmět</label>
                <input className="input" name="subject" defaultValue={editTpl.subject} required />
              </div>
              <div>
                <label className="label">Tělo (HTML)</label>
                <p className="text-xs text-gray-500 mb-1">Proměnné: {`{{firstName}} {{lastName}} {{email}} {{phone}} {{accommodationType}} {{checkIn}} {{checkOut}} {{nights}} {{adults}} {{children}} {{totalPrice}} {{campName}} {{licensePlate}} {{expectedArrival}} {{note}}`}</p>
                <textarea className="input font-mono text-xs" name="body" rows={12} defaultValue={editTpl.body} required />
              </div>
              <div className="flex gap-2">
                <button className="btn-primary" type="submit">Uložit šablonu</button>
                <button className="btn-secondary" type="button" onClick={() => setEditTpl(null)}>Zrušit</button>
              </div>
            </form>
          ) : (
            <>
              {(["ADMIN_NOTIFICATION", "CUSTOMER_CONFIRMATION"] as const).map((type) => (
                <div key={type} className="card p-5">
                  <h3 className="font-semibold mb-3">{type === "ADMIN_NOTIFICATION" ? "📬 Notifikace správci" : "📧 Potvrzení zákazníkovi"}</h3>
                  <div className="space-y-2">
                    {languages.map((lang) => {
                      const tpl = templates.find((t) => t.type === type && t.languageCode === lang.code);
                      return (
                        <div key={lang.code} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <span className="text-sm font-medium">{lang.name} <span className="text-gray-400">({lang.code})</span></span>
                          <div className="flex gap-2 items-center">
                            {tpl ? <span className="text-xs text-green-600">✓ nastavena</span> : <span className="text-xs text-gray-400">chybí</span>}
                            {can("templates_edit") && (
                              <button className="btn-secondary text-xs py-1" onClick={() => setEditTpl(tpl ?? { id: "", campId: id!, type, languageCode: lang.code, subject: "", body: "" })}>
                                {tpl ? "Upravit" : "Vytvořit"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Embed */}
      {tab === "embed" && (
        <div className="card p-6 max-w-2xl space-y-4">
          <h3 className="font-semibold">Vložení formuláře na web</h3>
          <p className="text-sm text-gray-600">Zkopírujte tento kód a vložte ho na vaši webovou stránku na místo, kde chcete zobrazit rezervační formulář.</p>
          <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg overflow-x-auto">
            {`<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  style="border:none;border-radius:12px;"\n></iframe>`}
          </div>
          <p className="text-xs text-gray-500">Přímý odkaz na formulář: <a href={embedUrl} target="_blank" className="text-blue-600 hover:underline">{embedUrl}</a></p>
          <p className="text-xs text-gray-500">Pro konkrétní jazyk přidejte parametr: <code className="bg-gray-100 px-1 rounded">?lang=en</code></p>
        </div>
      )}
    </div>
  );
}
