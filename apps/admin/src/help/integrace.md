# Integrace externích kalendářů

![Nastavení integrace v organizaci](/help/screenshots/integrace.png)

Ubysoft podporuje obousměrnou synchronizaci obsazenosti s externími portály (Booking.com, Airbnb a dalšími) přes standardní iCal formát.

**Import (portál → Ubysoft)** — systém každých 30 minut automaticky stáhne iCal feed z portálu a vytvoří nebo smaže odpovídající blokace v Ubysoftu.

**Export (Ubysoft → portál)** — pro každé napojení lze vygenerovat veřejnou URL, kterou zadáte do extranetu portálu. Portál si ji pravidelně stahuje a blokuje termíny.

---

## Aktivace

Integraci aktivuje správce systému v detailu organizace (záložka Super Admin → **Povolit iCal integrace**). Teprve po aktivaci se v detailu každého objektu zobrazí záložka **iCal integrace**.

---

## Přidání napojení

1. V záložce **iCal integrace** u objektu vyberte typ ubytování
2. Klikněte na **Přidat napojení**
3. Vyberte portál (Booking.com, Airbnb…)
4. Vyplňte **Import URL** — iCal feed z extranetu portálu
5. Zkopírujte **Export URL** a zadejte ji do extranetu portálu

Každý typ ubytování může mít napojení na více portálů zároveň.

---

## Import URL

Kde najít import URL v extranetu portálu:

- **Booking.com** — Kalendář → Synchronizovat → Exportovat kalendář → URL ve formátu `https://ical.booking.com/v1/export?t=…`
- **Airbnb** — Kalendář → Exportovat kalendář → zkopírovat odkaz

---

## Export URL

Exportní URL je unikátní pro každé napojení. Zadejte ji do extranetu portálu jako „import kalendáře".

Pomocí tlačítka **↺** vedle URL lze hash přegenerovat — stávající URL tím přestane fungovat a je potřeba aktualizovat ji v portálu.

### Co exportovat

| Nastavení | Co portál dostane |
|-----------|-------------------|
| **Vše kromě daného portálu** | Naše rezervace + blokace ze všech ostatních zdrojů (ostatní portály, manuální blokace) — doporučené, zabraňuje dvojímu obsazení |
| **Vlastní rezervace + manuální blokace** | Pouze to co vzniklo přímo v Ubysoftu, bez blokací z jiných portálů — vhodné pokud portál má vlastní propojení s ostatními kanály |

---

## Podmínky pro iCal synchronizaci na Booking.com

iCal synchronizace je dostupná pouze pokud nemovitost:

- je otevřená a rezervovatelná
- **nemá napojený Connectivity provider** (channel manager jako Prievio apod.)
- má max. 20 typů pokojů, každý s max. 1 jednotkou

Pokud máte Connectivity provider, iCal synchronizaci Booking.com nenabízí.
