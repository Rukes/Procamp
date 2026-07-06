# Rezervace

## Jak to vidí zákazník

Zákazník přijde na váš web, kde je vložen rezervační formulář. Celý proces je rozdělený do přehledných kroků:

1. **Výběr typu rezervace** — zákazník si vybere typ ubytování (karavan, stan, chatka…). Při jediném typu se tento krok přeskočí.
2. **Výběr termínu** — zákazník klikne v kalendáři na datum příjezdu a odjezdu. Obsazené a blokované dny jsou automaticky šedé a nelze je vybrat.
3. **Příplatky** — zákazník zaškrtne volitelné příplatky, které chce přidat (elektřina, pes, snídaně…). Povinné příplatky jsou zahrnuté automaticky.
4. **Kontaktní údaje** — zákazník vyplní jméno, e-mail, telefon, SPZ, předpokládaný čas příjezdu a případnou poznámku.
5. **Podmínky** — pokud máte nastaveny obchodní podmínky s povinným odsouhlasením, zákazník je musí potvrdit.
6. **Shrnutí a odeslání** — zákazník vidí kompletní přehled rezervace s celkovou cenou a klikne na Odeslat.

Po odeslání zákazník okamžitě dostane potvrzovací e-mail se shrnutím. Vám přijde e-mail s oznámením o nové rezervaci.

## Seznam rezervací

![Seznam rezervací](/help/screenshots/rezervace-seznam.png)

V sekci **Rezervace** vidíte všechny rezervace seřazené od nejnovější. Seznam lze filtrovat podle objektu, stavu a data příjezdu, a seřadit kliknutím na záhlaví sloupce.

Probíhající pobyty (zákazník je právě ubytován) jsou zvýrazněny zeleně.

### Filtry

- **Hledat** — vyhledávání podle kódu rezervace, jména, e-mailu nebo telefonu
- **Objekt** — zobrazí pouze rezervace vybraného objektu
- **Status** — filtruje podle stavu rezervace
- **Příjezd od / do** — omezí výsledky na rezervace s příjezdem v zadaném rozmezí

### Stavy rezervací

| Stav | Význam |
|------|--------|
| **Čeká na potvrzení** | Rezervace čeká na vaše ruční potvrzení |
| **Potvrzena** | Potvrzená rezervace |
| **Zrušena** | Stornovaná rezervace |
| **Proběhla** | Datum odjezdu již uplynul |
| **Propadlá** | Zákazník nepřijel a datum příjezdu uplynul |

## Kalendář (časová osa)

Podrobný přehled rezervací na časové ose najdete v sekci **Kalendář** v levém menu. Umožňuje vytvářet rezervace tažením přes dny, přesouvat je drag & dropem a zobrazovat blokace. Více informací v [nápovědě ke Kalendáři](/help#kalendar).

## Zobrazení — seznam vs. kalendář

![Kalendářový přehled rezervací](/help/screenshots/rezervace-kalendar.png)

Rezervace lze přepnout mezi pohledem **seznam** a **kalendář** tlačítkem vpravo nahoře. Váš preferovaný pohled si systém zapamatuje.

V **kalendářovém pohledu** klikněte na libovolný den pro zobrazení rezervací. Dny s rezervacemi mají zelený číselný odznak. Tlačítko **Dnes** vás přepne zpět na aktuální měsíc.

## Poznámky na rezervaci

Každá rezervace může mít dvě poznámky:

- **Poznámka zákazníka** — zadává sám zákazník ve formuláři, zobrazuje se mu v potvrzovacím e-mailu
- **Interní poznámka** — viditelná pouze správcům v administraci, zákazník ji nikdy nevidí

Obě poznámky jsou viditelné v seznamu rezervací jako ikony u jména. Interní poznámka má červenou ikonu, zákaznická šedou.

## Nová rezervace

Klikněte na **+ Nová rezervace**. Vyberte objekt, typ ubytování, termín a vyplňte kontaktní údaje zákazníka. Cena se vypočítá automaticky.

Pod polem e-mail jsou dva volitelné checkboxy:
- **Odeslat potvrzení zákazníkovi** — výchozí: zaškrtnuto; zákazník dostane potvrzovací e-mail
- **Odeslat potvrzení správci** — výchozí: nezaškrtnuto; správci přijde notifikační e-mail

## Detail rezervace

![Detail rezervace](/help/screenshots/rezervace-detail.png)

Klikněte na rezervaci pro otevření detailu. V levém sloupci je nahoře zobrazen **kód rezervace** — krátký 5místný alfanumerický kód (např. `A3X7T`), který slouží pro jednoduchou identifikaci rezervace v komunikaci se zákazníkem. Kód je součástí potvrzovacích e-mailů a lze ho použít i v SMS šabloně jako `{bookingCode}`. Pokud má typ ubytování nastavené dynamické ceny, zobrazí se v sekci Ubytování řádek **Cena za noc** s efektivní cenou odpovídající délce pobytu.

V detailu lze:

- **Potvrdit nebo zrušit** rezervaci tlačítky vpravo nahoře
- **Znovu odeslat e-mail** — tlačítko **E-maily** → „Znovu odeslat potvrzovací e-mail zákazníkovi" (s potvrzením); nebo „Odeslat na jiný e-mail…" pro libovolnou adresu
- **Znovu odeslat SMS** — tlačítko **SMS** (zobrazí se jen pokud objekt má zapnuté SMS notifikace zákazníkovi); „Znovu odeslat zákazníkovi" je neaktivní pokud telefon v rezervaci není ve formátu +420…; „Odeslat na jiné číslo…" umožní zadat libovolné číslo s validací; při chybě se zobrazí konkrétní důvod z GoSMS
- **Upravit údaje** — kontaktní informace, termín, SPZ, poznámku
- **Přidat interní poznámku** — poznámka viditelná pouze pro správce
- **Smazat rezervaci** — odkaz dole vpravo; tato akce je nevratná

## Export

Tlačítko **Export** v seznamu rezervací umožňuje stáhnout data ve formátu **Excel (.xlsx)** nebo **CSV**.

Export respektuje všechny aktivní filtry — pokud filtrujete podle objektu, stavu, vyhledávání nebo data příjezdu, exportují se pouze odpovídající záznamy. Bez aktivních filtrů se exportují všechny rezervace.
