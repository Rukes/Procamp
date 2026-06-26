# Integrace

## Booking.com — iCal synchronizace

Integrace umožňuje obousměrnou synchronizaci obsazenosti mezi Booking.com a MůjKemp přes standardní iCal formát.

**Import (Booking.com → MůjKemp)** — systém každou hodinu automaticky stáhne iCal feed z Booking.com a na základě obsazenosti vytvoří nebo smaže blokace v MůjKemp.

**Export (MůjKemp → Booking.com)** — pro každý typ ubytování lze vygenerovat veřejnou URL, kterou zadáte do Booking.com extranetu. Booking.com si ji pravidelně stahuje (obvykle každých 30–60 minut) a blokuje termíny.

---

### Aktivace

Integraci aktivuje správce systému v detailu organizace (záložka Super Admin). Teprve po aktivaci se v detailu každého objektu zobrazí záložka **Booking**.

---

### Nastavení importu

1. V extranetu Booking.com přejděte na: **Kalendář → Synchronizovat → Exportovat kalendář**
2. Zkopírujte URL ve formátu `https://ical.booking.com/v1/export?t=…`
3. Vložte ji do pole **Import z Booking.com** u příslušného typu ubytování a uložte

Každý typ ubytování má vlastní URL — na Booking.com odpovídá každému typu pokoje.

---

### Nastavení exportu

1. Klikněte na **Vygenerovat hash** — vytvoří se sdílený bezpečnostní klíč pro celý objekt
2. U každého typu ubytování se zobrazí exportní URL — zkopírujte ji
3. V extranetu Booking.com: **Kalendář → Synchronizovat → Importovat kalendář** → vložte URL
4. Zaškrtněte **Aktivní** u daného typu — teprve pak je URL funkční

Přegenerováním hashe se zneplatní všechny stávající exportní URL najednou.

---

### Podmínky pro iCal synchronizaci na Booking.com

iCal synchronizace je dostupná pouze pokud nemovitost:

- je otevřená a rezervovatelná
- **nemá napojený Connectivity provider** (channel manager jako Prievio apod.)
- má max. 20 typů pokojů, každý s max. 1 jednotkou

Pokud máte Connectivity provider, iCal synchronizaci Booking.com nenabízí.
