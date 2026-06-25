import { useTitle } from "../hooks/useTitle";
import { useEffect, useState, useMemo } from "react";
import HelpModal from "../components/HelpModal";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Camp, AccommodationType, Language, Surcharge, formatPrice, getEffectivePricePerNight } from "@procamp/shared";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { ARRIVAL_TIMES } from "../utils/arrivalTimes";
import { DayPicker, DateRange } from "react-day-picker";
import { format, isBefore, startOfDay } from "date-fns";
import { cs } from "date-fns/locale";
import "react-day-picker/dist/style.css";

export default function ReservationNewPage() {
  useTitle("Nová rezervace");
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [campId, setCampId] = useState("");
  const [types, setTypes] = useState<AccommodationType[]>([]);
  const [surcharges, setSurcharges] = useState<Surcharge[]>([]);
  const [selectedSurchargeIds, setSelectedSurchargeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const handleRangeSelect = (r: DateRange | undefined) => {
    setRange(r);
    const checkIn = r?.from ? format(r.from, "yyyy-MM-dd") : "";
    const checkOut = r?.to ? format(r.to, "yyyy-MM-dd") : "";

    setForm((f) => ({ ...f, checkIn, checkOut }));
  };

  const nights = range?.from && range?.to
    ? Math.round((range.to.getTime() - range.from.getTime()) / 86400000)
    : 0;

  const [form, setForm] = useState({
    accommodationTypeId: "",
    checkIn: "",
    checkOut: "",
    adults: 1,
    children: 0,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    licensePlate: "",
    expectedArrival: "",
    note: "",
    internalNote: "",
    languageCode: "cs",
  });
  const [sendCustomer, setSendCustomer] = useState(true);
  const [sendAdmin, setSendAdmin] = useState(false);
  const [sendCustomerSms, setSendCustomerSms] = useState(false);
  const [campSmsEnabled, setCampSmsEnabled] = useState(false);
  const [availWarnings, setAvailWarnings] = useState<{ booked: number; capacity: number; blocks: { reason?: string; dateFrom: string; dateTo: string }[] } | null>(null);

  useEffect(() => {
    api.get("/camps").then((r) => { setCamps(r.data); if (r.data.length === 1) setCampId(r.data[0].id); }).catch(() => {});
    api.get("/languages").then((r) => setLanguages(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!campId) { setTypes([]); setSurcharges([]); return; }
    api.get(`/camps/${campId}/accommodation-types`).then((r) => setTypes(r.data)).catch(() => {});
    api.get(`/camps/${campId}`).then((r) => {
      const s: Surcharge[] = r.data.surcharges ?? [];
      setSurcharges(s);
      setSelectedSurchargeIds(s.filter((x) => !x.isOptional).map((x) => x.id));
      setCampSmsEnabled(r.data.smsNotifyCustomer ?? false);
    }).catch(() => {});
    setForm((f) => ({ ...f, accommodationTypeId: "" }));
    setAvailWarnings(null);
  }, [campId]);

  useEffect(() => {
    const { checkIn, checkOut, accommodationTypeId } = form;
    if (!checkIn || !checkOut || !campId || !accommodationTypeId) {
      setAvailWarnings(null);
      return;
    }
    let cancelled = false;
    api.post("/reservations/check-availability", { campId, accommodationTypeId, checkIn, checkOut })
      .then((res) => { if (!cancelled) setAvailWarnings(res.data.available ? null : res.data); })
      .catch(() => { if (!cancelled) setAvailWarnings(null); });
    return () => { cancelled = true; };
  }, [form.checkIn, form.checkOut, form.accommodationTypeId, campId]);

  const getTypeName = (t: AccommodationType) => {
    const tr = t.translations as Record<string, { name: string }>;
    return tr.cs?.name ?? tr[Object.keys(tr)[0]]?.name ?? t.id;
  };

  const langObj = useMemo(
    () => languages.find((l) => l.code === form.languageCode) ?? languages[0],
    [languages, form.languageCode]
  );

  const selectedType = useMemo(
    () => types.find((t) => t.id === form.accommodationTypeId) ?? null,
    [types, form.accommodationTypeId]
  );

  const priceRow = useMemo(() => {
    if (!selectedType) return null;
    return selectedType.prices.find((p) => p.languageCode === form.languageCode) ?? selectedType.prices[0] ?? null;
  }, [selectedType, form.languageCode]);

  const breakdown = useMemo(() => {
    if (!priceRow || nights === 0) return null;
    const base = getEffectivePricePerNight(selectedType!, form.languageCode, nights);
    const adultPrice = priceRow.adultPricePerNight ?? 0;
    const childPrice = priceRow.childPricePerNight ?? 0;
    const personsTotal = form.adults * adultPrice + form.children * childPrice;

    const activeSurcharges = surcharges.filter((s) => selectedSurchargeIds.includes(s.id));
    const surchargeLines = activeSurcharges.map((s) => {
      const sp = (s.prices ?? []).find((p) => p.languageCode === form.languageCode) ?? (s.prices ?? [])[0];
      const price = sp?.pricePerNight ?? 0;
      const name = (s.translations as Record<string, { name: string }>)?.[form.languageCode]?.name
        ?? (s.translations as Record<string, { name: string }>)?.cs?.name ?? "Příplatek";
      return { name, pricePerNight: price, total: price * nights };
    });

    const surchargesTotal = surchargeLines.reduce((a, b) => a + b.total, 0);
    const total = (base + personsTotal) * nights + surchargesTotal;

    const lines: { label: string; amount: number }[] = [];
    if (base > 0 && langObj) lines.push({ label: `${getTypeName(selectedType!)} — ${formatPrice(base, langObj)} × ${nights} nocí`, amount: base * nights });
    if (adultPrice > 0 && form.adults > 0 && langObj) lines.push({ label: `${form.adults}× dospělý — ${formatPrice(adultPrice, langObj)} × ${nights} nocí`, amount: form.adults * adultPrice * nights });
    if (childPrice > 0 && form.children > 0 && langObj) lines.push({ label: `${form.children}× dítě — ${formatPrice(childPrice, langObj)} × ${nights} nocí`, amount: form.children * childPrice * nights });
    surchargeLines.forEach((s) => langObj && lines.push({ label: `${s.name} — ${formatPrice(s.pricePerNight, langObj)} × ${nights} nocí`, amount: s.total }));

    return { lines, total };
  }, [priceRow, selectedType, nights, form.adults, form.children, form.languageCode, selectedSurchargeIds, surcharges, langObj]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/reservations", {
        campId,
        ...form,
        selectedSurchargeIds,
        sendCustomerEmail: sendCustomer,
        sendAdminEmail: sendAdmin,
        sendCustomerSms: sendCustomerSms,
        force: availWarnings != null && can("reservations_force_create"),
      });
      toast.success("Rezervace byla vytvořena.");
      navigate(`/reservations/${res.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg === "No availability for selected dates" ? "Kapacita pro vybrané datum je obsazena." : "Nepodařilo se vytvořit rezervaci.");
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const toggleSurcharge = (id: string) => {
    setSelectedSurchargeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const optionalSurcharges = surcharges.filter((s) => s.isOptional);
  const mandatorySurcharges = surcharges.filter((s) => !s.isOptional);

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/reservations")} className="text-gray-400 hover:text-gray-600 transition-colors">
          <i className="fa-regular fa-arrow-left text-lg" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Nová rezervace</h1>
          <button onClick={() => setHelpOpen(true)} className="text-gray-400 hover:text-blue-500 transition-colors" title="Nápověda"><i className="fa-regular fa-circle-question text-lg" /></button>
        </div>
        {helpOpen && <HelpModal topic="nova-rezervace" onClose={() => setHelpOpen(false)} />}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Krok 1: Objekt + typ */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Ubytování</h2>
          <div>
            <label className="label">Objekt</label>
            <select className="input" value={campId} onChange={(e) => setCampId(e.target.value)} required>
              <option value="">— vyberte objekt —</option>
              {camps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {campId && types.length > 0 && (
            <div>
              <label className="label">Typ ubytování</label>
              <select className="input" value={form.accommodationTypeId} onChange={(e) => set("accommodationTypeId", e.target.value)} required>
                <option value="">— vyberte typ —</option>
                {types.map((t) => <option key={t.id} value={t.id}>{getTypeName(t)}</option>)}
              </select>
            </div>
          )}
          {campId && types.length === 0 && <p className="text-sm text-gray-400">Načítám typy ubytování…</p>}
        </div>

        {/* Krok 2: Zbytek — zobrazí se až po výběru objektu + typu */}
        {campId && form.accommodationTypeId && (<>
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Termín a detaily</h2>
          <div>
            <label className="label">Termín pobytu</label>
            <div className="flex justify-center border border-gray-200 rounded-xl p-2 overflow-x-auto">
              <DayPicker
                mode="range"
                selected={range}
                onSelect={handleRangeSelect}
                disabled={(d) => isBefore(d, startOfDay(new Date()))}
                numberOfMonths={window.innerWidth < 640 ? 1 : 2}
                locale={cs}
                modifiersStyles={{
                  selected: { backgroundColor: "#2563eb", color: "#fff", borderRadius: "0.5rem" },
                  range_middle: { backgroundColor: "#dbeafe", color: "#1e40af", borderRadius: 0 },
                  today: { fontWeight: "bold" },
                }}
              />
            </div>
            {nights > 0 && (
              <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mt-2 text-center">
                {format(range!.from!, "d. M.", { locale: cs })} – {format(range!.to!, "d. M. yyyy", { locale: cs })} · <strong>{nights} {nights === 1 ? "noc" : nights < 5 ? "noci" : "nocí"}</strong>
              </p>
            )}
            {availWarnings && (
              <div className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 space-y-1">
                <p className="text-sm font-medium text-red-700"><i className="fa-regular fa-triangle-exclamation mr-1.5" />Upozornění — termín není volně dostupný</p>
                {availWarnings.blocks.length > 0 && availWarnings.blocks.map((b, i) => (
                  <p key={i} className="text-xs text-red-600">
                    <i className="fa-regular fa-ban mr-1" />Blokace {format(new Date(b.dateFrom), "d. M.", { locale: cs })}–{format(new Date(b.dateTo), "d. M. yyyy", { locale: cs })}{b.reason ? `: ${b.reason}` : ""}
                  </p>
                ))}
                {availWarnings.capacity > 0 && availWarnings.booked >= availWarnings.capacity && (
                  <p className="text-xs text-red-600"><i className="fa-regular fa-users mr-1" />Kapacita obsazena ({availWarnings.booked}/{availWarnings.capacity})</p>
                )}
                {can("reservations_force_create")
                  ? <p className="text-xs text-red-500 pt-1">Rezervaci lze i přesto vytvořit — máte oprávnění Vytvářet nedostupné rezervace.</p>
                  : <p className="text-xs text-red-500 pt-1">Rezervaci v tomto termínu nelze vytvořit.</p>
                }
              </div>
            )}
            {selectedType?.useDynamicPricing && (selectedType as AccommodationType & { nightTiers?: { fromNight: number; prices: { languageCode: string; pricePerNight: number }[] }[] }).nightTiers?.length ? (() => {
              const tiers = (selectedType as AccommodationType & { nightTiers: { fromNight: number; prices: { languageCode: string; pricePerNight: number }[] }[] }).nightTiers;
              return (
                <div className="mt-3 rounded-xl border border-yellow-300 bg-yellow-50 p-3">
                  <p className="text-xs font-medium text-yellow-800 mb-2"><i className="fa-regular fa-circle-info mr-1.5" />Dynamická cena</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse border border-yellow-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-yellow-100">
                          {tiers.map((tier, idx) => {
                            const isLast = idx === tiers.length - 1;
                            const toNight = isLast ? null : tiers[idx + 1].fromNight - 1;
                            const label = isLast
                              ? `${tier.fromNight}+ nocí`
                              : toNight === tier.fromNight
                                ? `${tier.fromNight}. noc`
                                : `${tier.fromNight}–${toNight} nocí`;
                            return <th key={tier.fromNight} className="text-center font-medium text-yellow-700 py-1.5 px-3 border border-yellow-200 text-xs">{label}</th>;
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {tiers.map((tier) => {
                            const p = tier.prices.find((x) => x.languageCode === form.languageCode) ?? tier.prices[0];
                            const price = p?.pricePerNight;
                            const isActive = nights > 0 && (() => {
                              const si = tiers.indexOf(tier);
                              const isLast = si === tiers.length - 1;
                              return nights >= tier.fromNight && (isLast || nights < tiers[si + 1].fromNight);
                            })();
                            return (
                              <td key={tier.fromNight} className={`text-center font-semibold py-2 px-3 border border-yellow-200 text-sm ${isActive ? "bg-yellow-200 text-yellow-900" : "text-gray-700"}`}>
                                {price !== undefined && langObj ? `${langObj.currencyPosition === "before" ? langObj.currencySymbol + " " : ""}${price}${langObj.currencyPosition !== "before" ? " " + langObj.currencySymbol : ""}` : "—"}
                                <span className="text-xs font-normal text-gray-400"> /noc</span>
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })() : null}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Dospělí</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => set("adults", Math.max(1, form.adults - 1))} className="btn-secondary px-3 py-2 text-lg leading-none">−</button>
                <input className="input text-center" type="number" min="1" value={form.adults} onChange={(e) => set("adults", Math.max(1, Number(e.target.value)))} required />
                <button type="button" onClick={() => set("adults", form.adults + 1)} className="btn-secondary px-3 py-2 text-lg leading-none">+</button>
              </div>
            </div>
            <div>
              <label className="label">Děti</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => set("children", Math.max(0, form.children - 1))} className="btn-secondary px-3 py-2 text-lg leading-none">−</button>
                <input className="input text-center" type="number" min="0" value={form.children} onChange={(e) => set("children", Math.max(0, Number(e.target.value)))} />
                <button type="button" onClick={() => set("children", form.children + 1)} className="btn-secondary px-3 py-2 text-lg leading-none">+</button>
              </div>
            </div>
            <div>
              <label className="label">Předpokládaný příjezd</label>
              <select className="input" value={form.expectedArrival} onChange={(e) => set("expectedArrival", e.target.value)}>
                <option value="">— nevím —</option>
                {ARRIVAL_TIMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">SPZ vozidla</label>
              <input className="input" value={form.licensePlate} onChange={(e) => set("licensePlate", e.target.value)} placeholder="1AB 2345" />
            </div>
          </div>
          <div>
            <label className="label">Jazyk rezervace</label>
            <select className="input" value={form.languageCode} onChange={(e) => set("languageCode", e.target.value)}>
              {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>

          {/* Příplatky */}
          {surcharges.length > 0 && (
            <div>
              <label className="label">Příplatky</label>
              <div className="space-y-2">
                {mandatorySurcharges.map((s) => {
                  const name = (s.translations as Record<string, { name: string }>)?.[form.languageCode]?.name
                    ?? (s.translations as Record<string, { name: string }>)?.cs?.name ?? "Příplatek";
                  const sp = (s.prices ?? []).find((p) => p.languageCode === form.languageCode) ?? (s.prices ?? [])[0];
                  return (
                    <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                      <span className="text-gray-700">{name}</span>
                      <div className="flex items-center gap-2">
                        {langObj && sp && <span className="text-gray-500">{formatPrice(sp.pricePerNight, langObj)} / noc</span>}
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Povinný</span>
                      </div>
                    </div>
                  );
                })}
                {optionalSurcharges.map((s) => {
                  const name = (s.translations as Record<string, { name: string }>)?.[form.languageCode]?.name
                    ?? (s.translations as Record<string, { name: string }>)?.cs?.name ?? "Příplatek";
                  const sp = (s.prices ?? []).find((p) => p.languageCode === form.languageCode) ?? (s.prices ?? [])[0];
                  const checked = selectedSurchargeIds.includes(s.id);
                  return (
                    <label key={s.id} className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm cursor-pointer transition-colors ${checked ? "bg-blue-50" : "bg-gray-50 hover:bg-gray-100"}`}>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={checked} onChange={() => toggleSurcharge(s.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                        <span className="text-gray-700">{name}</span>
                      </div>
                      {langObj && sp && <span className="text-gray-500">{formatPrice(sp.pricePerNight, langObj)} / noc</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Průběžná kalkulace */}
        {breakdown && langObj && (
          <div className="card p-6 bg-blue-50 border border-blue-100">
            <h2 className="font-semibold text-gray-800 mb-3"><i className="fa-regular fa-calculator mr-2 text-blue-600" />Kalkulace ceny</h2>
            <div className="space-y-1.5 text-sm">
              {breakdown.lines.map((line, i) => (
                <div key={i} className="flex justify-between text-gray-600">
                  <span>{line.label}</span>
                  <span className="font-medium tabular-nums">{formatPrice(line.amount, langObj)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-blue-200 mt-3 pt-3 flex justify-between font-bold text-gray-900 text-base">
              <span>Celkem</span>
              <span>{formatPrice(breakdown.total, langObj)}</span>
            </div>
          </div>
        )}

        {/* Kontakt */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Kontaktní údaje</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Jméno</label>
              <input className="input" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
            </div>
            <div>
              <label className="label">Příjmení</label>
              <input className="input" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" checked={sendCustomer} onChange={(e) => setSendCustomer(e.target.checked)} />
                  Odeslat potvrzení zákazníkovi
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" checked={sendAdmin} onChange={(e) => setSendAdmin(e.target.checked)} />
                  Odeslat potvrzení správci
                </label>
                {campSmsEnabled && (
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" checked={sendCustomerSms} onChange={(e) => setSendCustomerSms(e.target.checked)} />
                    Odeslat zákazníkovi SMS
                  </label>
                )}
              </div>
            </div>
            <div>
              <label className="label">Telefon</label>
              <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label">Poznámka zákazníka</label>
            <textarea className="input" rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} />
          </div>
          <div>
            <label className="label text-red-600"><i className="fa-regular fa-lock mr-1.5" />Interní poznámka</label>
            <textarea className="input border-red-200 focus:border-red-400 focus:ring-red-200" rows={3} value={form.internalNote} onChange={(e) => set("internalNote", e.target.value)} placeholder="Viditelná pouze pro správce" />
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-primary" type="submit" disabled={saving || !campId || !form.accommodationTypeId || !form.checkIn || !form.checkOut || (!!availWarnings && !can("reservations_force_create"))}>
            {saving ? <><i className="fa-regular fa-spinner-third fa-spin mr-1.5" />Ukládám…</> : <><i className="fa-regular fa-floppy-disk mr-1.5" />Vytvořit rezervaci</>}
          </button>
          <button className="btn-secondary" type="button" onClick={() => navigate("/reservations")}>
            <i className="fa-regular fa-xmark mr-1.5" />Zrušit
          </button>
        </div>
        </>)}
      </form>
    </div>
  );
}
