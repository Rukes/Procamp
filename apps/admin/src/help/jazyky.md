# Jazyky a měny

Formulář pro zákazníky podporuje více jazyků. Každý jazyk má vlastní měnu — zákazník z Německa uvidí ceny v eurech, zákazník z Česka v korunách.

## Podporované jazyky

| Jazyk | Kód |
|-------|-----|
| 🇨🇿 Čeština | cs |
| 🇬🇧 Angličtina | en |
| 🇩🇪 Němčina | de |
| 🇵🇱 Polština | pl |
| 🇮🇹 Italština | it |
| 🇪🇸 Španělština | es |
| 🇫🇷 Francouzština | fr |
| 🇷🇺 Ruština | ru |
| 🇺🇦 Ukrajinština | uk |
| 🇸🇰 Slovenština | sk |
| 🇭🇺 Maďarština | hu |

## Přidání jazyka

Sekce **Jazyky** → **+ Přidat jazyk**. Vyberte jazyk a nastavte:

- **Kód měny** — mezinárodní označení, např. `CZK`, `EUR`, `PLN`
- **Symbol měny** — zobrazovaný symbol, např. `Kč`, `€`, `zł`
- **Pozice symbolu** — zda se symbol zobrazí před nebo za číslem (např. `€100` nebo `100 Kč`)
- **Koeficient přepočtu cen** — číslo kterým se vynásobí všechny ceny z výchozího jazyka; příklad: pro CZK→EUR zadejte `0.04` (100 Kč = 4 €); náhled přepočtu se zobrazuje ihned

Náhled formátu ceny se zobrazí ihned při vyplňování.

### Co se automaticky zkopíruje při přidání jazyka

Po přidání nového jazyka systém automaticky zkopíruje z výchozího jazyka (čeština):

- **Překlady** typů ubytování a příplatků — texty názvů a popisů
- **Ceny** typů ubytování a příplatků — přepočítané zadaným koeficientem
- **Dynamické ceny** — pokud má typ ubytování dynamické ceny, přepočítají se koeficientem i ceny všech hladin
- **E-mailové šablony** — texty šablon pro správce i zákazníka

Po přidání systém zobrazí souhrn kolik položek bylo zkopírováno. Následně si přeložte texty a zkontrolujte ceny v detailu každého objektu.

## Výchozí jazyk

Jazyk označený jako **Výchozí** se použije pokud zákazník přijde na formulář bez specifikace jazyka v odkazu. Výchozí jazyk nelze smazat.

## Ceny pro každý jazyk

Ceny jsou nastaveny pro každý jazyk zvlášť v detailu objektu — u každého typu ubytování a příplatku. Při přidání nového jazyka jsou ceny předvyplněny přepočtem z výchozího jazyka, ale doporučujeme je zkontrolovat a případně upravit.
