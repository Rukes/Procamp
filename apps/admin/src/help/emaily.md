# E-mailové šablony

Po každé nové rezervaci systém automaticky odešle dva e-maily:
- **Potvrzení zákazníkovi** — zákazník dostane shrnutí rezervace
- **Oznámení vám** — přijde na notifikační e-mail nastavený v objektu

Texty obou e-mailů si můžete libovolně upravit.

## Úprava šablon

Otevřete detail objektu → záložka **E-mailové šablony**. Vyberte typ e-mailu a jazyk. Editor umožňuje formátování textu — nadpisy, tučné písmo, seznam, barvy.

Šablony jsou oddělené pro každý jazyk — zákazník dostane e-mail ve stejném jazyce ve kterém vyplnil formulář.

## Proměnné v textu

Do textu šablony vložte proměnné ve složených závorkách — systém je při odeslání automaticky nahradí skutečnými hodnotami z rezervace.

| Proměnná | Co se vloží |
|----------|-------------|
| `{{campName}}` | Název objektu |
| `{{firstName}}` | Jméno zákazníka |
| `{{lastName}}` | Příjmení zákazníka |
| `{{email}}` | E-mail zákazníka |
| `{{phone}}` | Telefon zákazníka |
| `{{accommodationType}}` | Název typu ubytování |
| `{{checkIn}}` | Datum příjezdu |
| `{{checkOut}}` | Datum odjezdu |
| `{{nights}}` | Počet nocí |
| `{{adults}}` | Počet dospělých |
| `{{children}}` | Počet dětí |
| `{{licensePlate}}` | SPZ vozidla |
| `{{expectedArrival}}` | Předpokládaný čas příjezdu |
| `{{note}}` | Poznámka zákazníka |
| `{{totalPrice}}` | Celková cena |

## Nastavení odesílání e-mailů

E-maily se odesílají přes váš vlastní e-mailový server. Nastavení SMTP (server, port, přihlašovací údaje) vyplňte v detailu objektu → záložka **Nastavení**.

Bez vyplněného SMTP nastavení se e-maily neodesílají.
