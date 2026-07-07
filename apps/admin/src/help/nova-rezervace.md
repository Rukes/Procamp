# Nová rezervace

Ruční zadání rezervace správcem. Hodí se pro telefonické nebo osobní objednávky.

![Formulář nové rezervace](/help/screenshots/nova-rezervace.png)

## Postup

Formulář je rozdělený do dvou kroků — nejprve vyberte ubytování, poté se zobrazí zbytek.

### Krok 1: Výběr ubytování

1. **Objekt** — vyberte kemp nebo ubytovací zařízení
2. **Typ ubytování** — po výběru objektu se načtou dostupné typy (karavan, stan, chatka…)

Po výběru obou polí se zobrazí zbytek formuláře.

### Krok 2: Termín a detaily

- **Termín pobytu** — klikněte na datum příjezdu a odjezdu v kalendáři; systém automaticky zobrazí počet nocí
- **Dynamická cena** — pokud má typ nastavené cenové hladiny, zobrazí se žlutá tabulka s přehledem cen; aktivní hladina (odpovídající zadanému počtu nocí) je zvýrazněna
- **Dospělí / děti** — počet osob
- **Předpokládaný příjezd** — orientační čas příjezdu
- **SPZ vozidla** — volitelné
- **Jazyk rezervace** — určuje jazyk potvrzovacího e-mailu a měnu

### Příplatky

Povinné příplatky jsou přidány automaticky. Volitelné příplatky lze zaškrtnout — vliv na celkovou cenu je vidět okamžitě v kalkulaci.

Pokud má příplatek nastavené maximální množství > 1 (např. počet psů), zobrazí se číselné pole pro výběr množství. Cena se přepočítá automaticky.

### Kontaktní údaje

Vyplňte jméno, příjmení, e-mail a telefon zákazníka. Pod polem e-mail jsou volby pro odeslání notifikací:

- **Odeslat potvrzení zákazníkovi** — zákazník dostane potvrzovací e-mail (výchozí: zapnuto)
- **Odeslat potvrzení správci** — správci přijde notifikační e-mail (výchozí: vypnuto)
- **Odeslat zákazníkovi SMS** — zobrazí se pouze pokud má objekt zapnuté SMS notifikace

### Kalkulace ceny

Pod sekcí ubytování se průběžně zobrazuje rozpis ceny — cena za noc, příplatky za osoby, příplatky a celková částka. Kalkulace se aktualizuje v reálném čase při změně termínu, osob nebo příplatků.

## Rezervace v obsazeném termínu

Pokud máte oprávnění **Vytvářet nedostupné rezervace**, systém vás upozorní červenou kartou kdy je termín blokovaný nebo kapacita plně obsazená — ale rezervaci přesto umožní vytvořit. Bez tohoto oprávnění tlačítko Uložit zůstane neaktivní.

## Stav nové rezervace

Rezervace se vytvoří jako **Potvrzená** (pokud objekt nevyžaduje ruční potvrzení), nebo jako **Čeká na potvrzení** (pokud je ruční potvrzení zapnuto v nastavení objektu).

## Kód rezervace

Každé nové rezervaci je automaticky přiřazen unikátní **5místný kód** (např. `A3X7T`). Kód je viditelný v detailu rezervace a v seznamu jako druhý sloupec. Zákazník ho dostane v potvrzovacím e-mailu — hodí se pro rychlou identifikaci při telefonické nebo osobní komunikaci.
