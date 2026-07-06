import { useTitle } from "../hooks/useTitle";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useToast } from "../contexts/ToastContext";
import { useOrg } from "../contexts/OrgContext";
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
  city: string;
  zip: string;
  contactPerson: string;
  phone: string;
  contactEmail: string;
  billingEmail: string;
  internalNote: string | null;
  gaTrackingId: string | null;
  goSmsClientId?: string;
  goSmsChannelId?: number | null;
  hideCopyright?: boolean;
  createdAt: string;
  _count: { camps: number; users: number; languages: number };
}

const EMPTY: Omit<Organization, "id" | "createdAt" | "_count"> = {
  name: "", slug: "", billingName: "", country: "Česká republika", ico: "", dic: "", address: "", city: "", zip: "", contactPerson: "", phone: "", contactEmail: "", billingEmail: "", internalNote: null,
  gaTrackingId: null, goSmsClientId: "", goSmsChannelId: null, hideCopyright: false,
};

export default function OrganizationsPage() {
  useTitle("Organizace");
  const toast = useToast();
  const { setOrgs: setSidebarOrgs, selectedOrgId, setSelectedOrgId } = useOrg();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [modalOrg, setModalOrg] = useState<Organization | null>(null);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [aresLoading, setAresLoading] = useState(false);

  const loadAres = async () => {
    if (!form.ico || form.ico.length < 6) return;
    setAresLoading(true);
    try {
      const r = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${form.ico}`);
      if (!r.ok) { toast.error("IČO nenalezeno v ARES."); return; }
      const d = await r.json();
      const s = d.sidlo;
      const street = s ? [s.nazevUlice, [s.cisloDomovni, s.cisloOrientacni ? `/${s.cisloOrientacni}` : ""].join("")].filter(Boolean).join(" ") : "";
      const psc = s?.psc ? String(s.psc).replace(/(\d{3})(\d{2})/, "$1 $2") : "";
      setForm((f) => ({
        ...f,
        billingName: d.obchodniJmeno ?? f.billingName,
        dic: d.dic ?? f.dic,
        address: street || f.address,
        city: s?.nazevObce ?? f.city,
        zip: psc || f.zip,
        country: s?.nazevStatu ?? f.country,
      }));
      toast.success("Údaje načteny z ARES.");
    } catch {
      toast.error("Chyba při načítání z ARES.");
    } finally {
      setAresLoading(false);
    }
  };

  const load = () => api.get("/organizations").then((r) => { setOrgs(r.data); setSidebarOrgs(r.data); }).catch(() => {});
  useEffect(() => { load(); }, []);

  const closeModal = () => { setCreating(false); setModalOrg(null); setForm({ ...EMPTY }); };

  const openCreate = () => { setForm({ ...EMPTY }); setCreating(true); setModalOrg(null); };
  const openEdit = (org: Organization) => {
    setForm({ name: org.name, slug: org.slug, billingName: org.billingName, country: org.country, ico: org.ico, dic: org.dic, address: org.address, city: org.city, zip: org.zip, contactPerson: org.contactPerson, phone: org.phone, contactEmail: org.contactEmail, billingEmail: org.billingEmail, internalNote: org.internalNote, gaTrackingId: org.gaTrackingId, goSmsClientId: org.goSmsClientId ?? "", goSmsChannelId: org.goSmsChannelId ?? null, hideCopyright: org.hideCopyright ?? false });
    setModalOrg(org);
    setCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (creating) {
        await api.post("/organizations", form);
        toast.success("Organizace byla vytvořena.");
      } else {
        await api.put(`/organizations/${modalOrg!.id}`, form);
        toast.success("Organizace byla uložena.");
      }
      closeModal();
      load();
    } catch {
      toast.error("Nepodařilo se uložit organizaci.");
    }
  };

  const handleDelete = async (org: Organization) => {
    if (!confirm(`Smazat organizaci „${org.name}"? Tato akce odebere vazby na kempy a uživatele.`)) return;
    try {
      await api.delete(`/organizations/${org.id}`);
      toast.success("Organizace smazána.");
      if (selectedOrgId === org.id) setSelectedOrgId(null);
      load();
    } catch {
      toast.error("Nepodařilo se smazat organizaci.");
    }
  };

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const toSlug = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <div className="p-4 md:p-8">
      {(creating || modalOrg) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-12" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold">{creating ? "Nová organizace" : `Upravit: ${modalOrg!.name}`}</h3>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-700"><i className="fa-regular fa-xmark text-lg" /></button>
            </div>
            <div className="px-6 py-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Název organizace *</label>
                  <input className="input" value={form.name} onChange={(e) => {
                    set("name", e.target.value);
                    if (creating) set("slug", toSlug(e.target.value));
                  }} required />
                </div>
                <div>
                  <label className="label">URL slug *</label>
                  <input className="input" value={form.slug} onChange={(e) => set("slug", e.target.value)} required pattern="[a-z0-9-]+" placeholder="nazev-organizace" />
                  <p className="text-xs text-gray-400 mt-1">Použije se v URL formuláře: /<strong>{form.slug || "slug"}</strong>/kemp-slug</p>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Fakturační údaje</p>
                  <div className="space-y-3">
                    <div>
                      <label className="label">Odběratel</label>
                      <input className="input" value={form.billingName} onChange={(e) => set("billingName", e.target.value)} placeholder="Fakturační název firmy" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">IČO</label>
                        <div className="flex">
                          <input className="input !rounded-r-none" value={form.ico} onChange={(e) => set("ico", e.target.value)} placeholder="12345678" />
                          <Tooltip text="Načíst z ARES">
                            <button type="button" onClick={loadAres} disabled={aresLoading} className="btn-primary px-3 flex-shrink-0 !rounded-l-none">
                              <i className={`fa-regular fa-rotate ${aresLoading ? "animate-spin" : ""}`} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                      <div>
                        <label className="label">DIČ / VAT ID</label>
                        <input className="input" value={form.dic} onChange={(e) => set("dic", e.target.value)} placeholder="CZ12345678" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mt-3">
                    <div>
                      <label className="label">Ulice a číslo popisné</label>
                      <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Příkladová 123" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Město</label>
                        <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Praha" />
                      </div>
                      <div>
                        <label className="label">PSČ</label>
                        <input className="input" value={form.zip} onChange={(e) => set("zip", e.target.value)} placeholder="110 00" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Země</label>
                      <CountrySelect value={form.country} onChange={(v) => set("country", v)} />
                    </div>
                    <div>
                      <label className="label">Fakturační e-mail</label>
                      <input className="input" type="email" value={form.billingEmail} onChange={(e) => set("billingEmail", e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Kontaktní údaje</p>
                  <div className="space-y-3">
                    <div>
                      <label className="label">Kontaktní osoba</label>
                      <input className="input" value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Telefon</label>
                        <input className="input" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+420 123 456 789" />
                      </div>
                      <div>
                        <label className="label">E-mail pro komunikaci</label>
                        <input className="input" type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="btn-primary" type="submit"><i className="fa-regular fa-floppy-disk mr-1.5" />Uložit</button>
                  <button className="btn-secondary" type="button" onClick={closeModal}><i className="fa-regular fa-xmark mr-1.5" />Zrušit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizace</h1>
          <p className="text-sm text-gray-500 mt-1">Každá organizace má vlastní objekty, uživatele a jazyky.</p>
        </div>
        <button className="btn-primary text-sm" onClick={openCreate}><i className="fa-regular fa-plus mr-1.5" /><span className="hidden sm:inline">Nová organizace</span><span className="sm:hidden">Nová</span></button>
      </div>

      <div className="space-y-3">
        {orgs.map((org) => (
          <div key={org.id} className={`card p-5 ${selectedOrgId === org.id ? "border-green-300 bg-green-50" : ""}`}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900 text-base">{org.name}</h2>
                  {org.internalNote && (
                    <div
                      className="relative"
                      onMouseEnter={() => setOpenNoteId(org.id)}
                      onMouseLeave={() => setOpenNoteId(null)}
                      onTouchStart={(e) => { e.preventDefault(); setOpenNoteId(openNoteId === org.id ? null : org.id); }}
                    >
                      <i className="fa-regular fa-note-sticky text-xs text-red-500 cursor-pointer" />
                      {openNoteId === org.id && (
                        <div className="absolute left-0 top-5 z-50 w-72 max-w-[80vw] bg-white border border-red-200 rounded-lg shadow-lg p-3">
                          <p className="text-xs font-semibold text-red-500 mb-1.5 flex items-center gap-1.5">
                            <i className="fa-regular fa-note-sticky" /> Interní poznámka
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{org.internalNote}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{org.slug}</code>
                  <span className="text-xs text-gray-400">
                    <i className="fa-regular fa-tent mr-1" />{org._count.camps} {org._count.camps === 1 ? "objekt" : org._count.camps < 5 ? "objekty" : "objektů"}
                  </span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">
                    <i className="fa-regular fa-user mr-1" />{org._count.users} {org._count.users === 1 ? "uživatel" : org._count.users < 5 ? "uživatelé" : "uživatelů"}
                  </span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">
                    <i className="fa-regular fa-globe mr-1" />{org._count.languages} {org._count.languages === 1 ? "jazyk" : org._count.languages < 5 ? "jazyky" : "jazyků"}
                  </span>
                  {org.gaTrackingId && (
                    <>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-green-600">
                        <i className="fa-brands fa-google mr-1" />GA aktivní
                      </span>
                    </>
                  )}
                  {org.goSmsClientId && (
                    <>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-blue-600">
                        <i className="fa-regular fa-message-sms mr-1" />GoSMS aktivní{org.goSmsChannelId ? "" : " (chybí kanál)"}
                      </span>
                    </>
                  )}
                  {(org as any).icalEnabled && (
                    <>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-blue-700">
                        <i className="fa-regular fa-calendar-days mr-1" />Booking.com
                      </span>
                    </>
                  )}
                  {org.hideCopyright && (
                    <>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-orange-600">
                        <i className="fa-regular fa-eye-slash mr-1" />Bez copyrightu
                      </span>
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-2 space-y-0.5">
                  {org.ico && <p><span className="text-gray-400">IČO:</span> {org.ico}{org.dic && <span className="ml-3"><span className="text-gray-400">DIČ:</span> {org.dic}</span>}</p>}
                  {org.address && <p>{org.address}{org.country && `, ${org.country}`}</p>}
                  {org.contactPerson && <p><i className="fa-regular fa-user mr-1 text-gray-400" />{org.contactPerson}{org.billingEmail && <span className="ml-2 text-blue-600">{org.billingEmail}</span>}</p>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 self-end sm:self-start">
                {selectedOrgId !== org.id && (
                  <button className="btn-secondary text-sm py-1.5" onClick={() => { setSelectedOrgId(org.id); }}>
                    <i className="fa-regular fa-right-left sm:mr-1.5" /><span className="hidden sm:inline">Přepnout</span>
                  </button>
                )}
                <Link to={`/organizations/${org.id}`} className="btn-secondary text-sm py-1.5"><i className="fa-regular fa-gear sm:mr-1.5" /><span className="hidden sm:inline">Nastavení</span></Link>
              </div>
            </div>
          </div>
        ))}
        {orgs.length === 0 && (
          <div className="card p-12 text-center text-gray-400">
            <i className="fa-regular fa-building text-3xl mb-3 block" />
            <p>Žádné organizace. Vytvořte první kliknutím na „+ Nová organizace".</p>
          </div>
        )}
      </div>
    </div>
  );
}
