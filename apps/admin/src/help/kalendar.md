# Kalendář

Sekce **Kalendář** zobrazuje přehlednou časovou osu všech ubytovacích jednotek. Řádky odpovídají jednotlivým typům ubytování, sloupce dnům v měsíci. Na první pohled vidíte, co je obsazeno, co blokováno a kde je volno.

![Kalendář — časová osa](/help/screenshots/kalendar.png)

## Navigace

Šipkami vlevo a vpravo přecházíte mezi měsíci. Kliknutím na název měsíce otevřete výběr konkrétního dne — po výběru se kalendář přesune na daný měsíc a den. Tlačítko **Dnes** přeskočí na aktuální měsíc a posune pohled na dnešní den (červeně zvýrazněný sloupec).

Pokud máte více objektů, vyberte požadovaný objekt výběrem vpravo nahoře.

## Vytvoření rezervace

Klikněte nebo táhněte přes libovolné dny v řádku ubytovací jednotky — funguje i přes buňky s existující rezervací. Po uvolnění myši se otevře formulář nové rezervace s předvyplněným typem ubytování a termínem. Při tažení se zobrazí tooltip s rozsahem a počtem nocí.

## Rezervace

Každá rezervace je zobrazena jako barevný blok:

| Barva | Stav |
|-------|------|
| Zelená | Potvrzena |
| Žlutá | Čeká na potvrzení |

Blok začíná v pravé polovině dne příjezdu a končí v levé polovině dne odjezdu — vizuálně odpovídá obvyklému check-in / check-out v poledne.

Najetím myší se zobrazí popover se jménem hosta, vlajkou, statusem a datumy. Kliknutím se otevře modal s plným detailem rezervace, kde ji lze potvrdit, zrušit nebo upravit.

Rezervaci lze přesunout přetažením na jiný termín ve stejném nebo jiném řádku.

## Blokace

Blokace jsou zobrazeny šedě šrafovaně. Blokace synchronizované z externích zdrojů (Booking.com) jsou zvýrazněny modře.

Najetím myší se zobrazí tooltip s důvodem a datumy. Kliknutím se otevře detail blokace.

## Rezervace a blokace přes měsíc

Pokud rezervace nebo blokace přesahuje do sousedního měsíce, blok má na straně přechodu rovný okraj bez zaoblení — vizuálně indikuje, že pokračuje v předchozím nebo následujícím měsíci. Přechodem do sousedního měsíce uvidíte druhou část bloku se stejným otevřeným okrajem.

## Více rezervací v jednom řádku

Pokud se rezervace nebo blokace v jednom řádku překrývají (různí hosté ve stejný termín), systém je automaticky rozdělí do samostatných pruhů pod sebou. Výška řádku se podle toho přizpůsobí.
