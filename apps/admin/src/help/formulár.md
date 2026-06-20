# Formulář na web

Rezervační formulář se vkládá na váš web jako okno (iframe). Zákazník ho vidí přímo na vašich stránkách, aniž by musel odcházet jinam.

## Kde najdu kód pro vložení

Otevřete detail objektu → záložka **Vložení na web**. Najdete tam hotový kód připravený ke zkopírování a vložení na web.

## Jak formulář vložit

Zkopírujte kód a vložte ho do HTML kódu vaší stránky na místo kde má formulář být zobrazený. Výsledný kód vypadá takto:

```html
<iframe
  src="https://form.mujkemp.cz/form/muj-kemp/kemp-morava"
  width="100%"
  height="700"
  frameborder="0"
  style="border:none;border-radius:12px;"
></iframe>
```

## Formulář v jiném jazyce

Chcete-li zákazníkům z jiné země nabídnout formulář v jejich jazyce, přidejte do adresy parametr `?lang=` s kódem jazyka:

| Jazyk | Adresa |
|-------|--------|
| Němčina | `...kemp-morava?lang=de` |
| Angličtina | `...kemp-morava?lang=en` |
| Polština | `...kemp-morava?lang=pl` |

Zákazník pak uvidí formulář ve svém jazyce a ceny v příslušné měně.

## Co zákazník v formuláři vyplňuje

1. **Termín** — výběr příjezdu a odjezdu z kalendáře (obsazené dny jsou automaticky šedé)
2. **Typ ubytování** — pokud máte více typů, zákazník si vybere; při jednom typu se tento krok přeskočí
3. **Příplatky** — zákazník zaškrtne volitelné příplatky které chce
4. **Kontaktní údaje** — jméno, e-mail, telefon, SPZ, předpokládaný čas příjezdu, poznámka
5. **Podmínky** — pokud máte nastaveny podmínky s povinným potvrzením, zákazník je musí odsouhlasit
6. **Shrnutí** — přehled rezervace s celkovou cenou a tlačítko Odeslat

Po odeslání zákazník dostane potvrzovací e-mail a vám přijde oznámení o nové rezervaci.

## Platba

Platba probíhá na místě při příjezdu — formulář není napojen na online platební bránu.
