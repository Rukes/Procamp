# E-mailové šablony

Po každé nové rezervaci systém automaticky odešle dva e-maily:
- **Potvrzení zákazníkovi** — zákazník dostane shrnutí rezervace
- **Oznámení správci** — přijde na notifikační e-mail nastavený v objektu

Texty obou e-mailů si můžete libovolně upravit.

## Úprava šablon

Otevřete detail objektu → záložka **E-mailové šablony**. Vyberte typ e-mailu a jazyk.

Editor nabízí:
- Formátování textu — tučné, kurzíva, podtržení, nadpisy, seznamy
- Vložení odkazu — označte text, klikněte na ikonu řetězu, zadejte URL
- Vložení obrázku — klikněte na ikonu obrázku, zadejte URL obrázku a volitelně URL odkazu
- Přepnutí do **HTML módu** — tlačítko `</>` v toolbaru; umožňuje přímou editaci zdrojového kódu šablony
- Tooltopy na všech tlačítkách toolbaru při hoveru
- **Obnovit výchozí šablonu** — tlačítko vpravo od pole Předmět; po potvrzení načte výchozí šablonu do editoru (obsah se přepíše, ale neuloží — uložení musíte provést ručně)

Šablony jsou oddělené pro každý jazyk — zákazník dostane e-mail ve stejném jazyce ve kterém vyplnil formulář.

## Proměnné v textu

Do textu šablony vložte proměnné ve složených závorkách — systém je při odeslání automaticky nahradí skutečnými hodnotami z rezervace. Kliknutím na proměnnou v sekci pod editorem ji vložíte přímo do textu.

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
| `{{reservationId}}` | ID rezervace |

## Opakované odeslání e-mailu

V detailu rezervace klikněte na tlačítko **E-maily** → **Znovu odeslat potvrzovací e-mail zákazníkovi**. Systém zobrazí potvrzovací dialog a po odsouhlasení odešle e-mail znovu. Každé odeslání se zaznamená do logu aktivit.

## Nastavení SMTP

E-maily se odesílají přes SMTP server. Systém podporuje dva způsoby:

**Systémový SMTP** — nastavený super adminem přes proměnné prostředí; použije se pro všechny objekty bez vlastního SMTP nastavení.

**Vlastní SMTP objektu** — v detailu objektu → záložka **Nastavení** → zaškrtněte „Použít vlastní SMTP nastavení" a vyplňte přihlašovací údaje. Pole Reply-To určuje adresu, na kterou zákazník odpoví — typicky shodná s notifikačním e-mailem objektu. Po vyplnění klikněte na **Ověřit připojení před uložením** — systém otestuje přihlášení k SMTP serveru a teprve po úspěchu se zobrazí tlačítko Uložit SMTP.

## Kill switch

Super admin může na stránce **Systém** jedním přepínačem vypnout veškerý mailing. Pokud je mailing vypnut, neodesílají se žádné e-maily bez ohledu na nastavení SMTP objektu ani systémového SMTP. V administraci se zobrazí varování.
