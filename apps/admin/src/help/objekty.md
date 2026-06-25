# Objekty

Objekt je kemp, chatová osada, glamping nebo jiné ubytovací zařízení. Každý objekt má vlastní rezervační formulář a vlastní nastavení e-mailů.

## Vytvoření objektu

Klikněte na **+ Nový objekt**, zadejte název, URL identifikátor (slug) a **e-mail správce** (notifikační e-mail pro oznámení o nových rezervacích). Identifikátor se použije v adrese formuláře — doporučujeme použít krátké, jednoduché označení bez diakritiky, např. `kemp-morava`.

---

## Záložka: Nastavení

### Obecné

- **Název objektu** — zobrazí se zákazníkovi v rezervačním formuláři
- **Notifikační e-mail** — na tuto adresu přijde e-mail při každé nové rezervaci; slouží také jako Reply-To při systémovém SMTP; více e-mailů oddělte čárkou

### Rezervace

- **Vyžadovat ruční potvrzení** — pokud je zapnuto, nové rezervace čekají na vaše ruční potvrzení v sekci Rezervace; pokud je vypnuto, rezervace se potvrdí automaticky okamžitě po odeslání

### Formulář — osoby

- **Skrýt volbu a cenu dospělého** — zákazník v rezervačním formuláři neuvidí výběr počtu dospělých; cena za dospělého se nezobrazí ani v nastavení cen
- **Skrýt volbu a cenu dítěte** — stejné jako výše, ale pro děti

### Informace o objektu

Text zobrazený zákazníkovi v rezervačním formuláři po kliknutí na tlačítko „Info". Lze vložit kontaktní údaje, mapku, popis objektu nebo libovolný jiný obsah. Nastavení je per-jazyk — klikněte na **Upravit** vedle příslušného jazyka, upravte obsah v editoru a uložte. Tlačítko „Info" se ve formuláři zobrazí pouze pokud je pro daný jazyk obsah vyplněn.

---

## Záložka: Typy ubytování

Každý objekt může mít více typů ubytování (např. Karavan, Stan, Chatka, Mobilheim). Pro každý typ nastavte:

- **Název** — pro každý aktivní jazyk zvlášť (zákazník uvidí překlad ve svém jazyce)
- **Krátký popis** — zobrazí se na kartičce výběru typu ve formuláři
- **Dlouhý popis** — zobrazí se v modalu po kliknutí na `?` u dané kartičky
- **Kapacita** — maximální počet míst tohoto typu; systém hlídá obsazenost a neumožní rezervaci přes kapacitu
- **Pořadí** — přetáhněte typ za ikonu ⠿ vlevo a pusťte na požadované místo; pořadí se uloží automaticky a projeví se i ve formuláři
- **Ceny** — pro každý jazyk (měnu) zvlášť:
  - Cena za noc (základní cena za ubytovací místo) — nebo dynamická cena podle hladin (viz níže)
  - Příplatek za dospělého na noc
  - Příplatek za dítě na noc

Celková cena = (cena za noc + dospělí × příplatek + děti × příplatek + příplatky) × počet nocí

### Dynamická cena (cenové hladiny)

Místo jedné pevné ceny za noc lze nastavit různé ceny podle délky pobytu. Přepněte typ na **Dynamická cena** a přidejte hladiny:

- Každá hladina je definována číslem **první noci**, od které platí (např. 1, 4, 7)
- Rozsah hladiny je automaticky určen — hladina platí od své první noci až do první noci následující hladiny minus 1
- Poslední hladina platí pro všechny delší pobyty bez omezení
- Pro každou hladinu nastavte cenu za noc pro každý aktivní jazyk

Zákazník ve formuláři vidí na kartičce typu minimální cenu a ikonu 💲 pro zobrazení tabulky všech hladin. Při výběru termínu se cena automaticky přepočítá na správnou hladinu.

---

## Záložka: Příplatky

Volitelné nebo povinné položky připočítané k ceně rezervace. Příklady: elektřina, pes, klimatizace, snídaně.

- **Název** — pro každý aktivní jazyk
- **Poznámka** — doplňující text zobrazený zákazníkovi u příplatku
- **Volitelný / povinný** — volitelné zákazník zaškrtne sám, povinné jsou vždy součástí ceny
- **Cena za noc** — pro každý jazyk (měnu) zvlášť
- **Nezobrazovat ve formuláři** — příplatek se skryje zákazníkům v rezervačním formuláři; v administraci zůstane viditelný (hodí se např. pro interní položky nebo dočasně deaktivované příplatky)
- **Zobrazit pro typy ubytování** — lze vybrat konkrétní typy, pro které se příplatek zobrazí; pokud nevyberete žádný, příplatek se zobrazí pro všechny typy
- **Pořadí** — přetáhněte příplatek za ikonu ⠿ vlevo a pusťte na požadované místo; pořadí se uloží automaticky

---

## Záložka: E-mailové šablony

Texty e-mailů pro zákazníka i pro vás. Viz sekce [E-mailové šablony](#emaily).

---

## Záložka: Vložení na web

Hotový `<iframe>` kód pro vložení na web. Viz sekce [Formulář na web](#formular).

---

## Záložka: SMS

SMS notifikace zákazníkovi nebo správci při potvrzení rezervace. Vyžaduje nastavení GoSMS API v detailu organizace (záložka GoSMS).

- **SMS notifikace zákazníkovi** — zákazník dostane SMS na číslo zadané v rezervaci
- **SMS notifikace správci** — SMS se odešle na zadaná telefonní čísla; čísla zadejte s mezinárodní předvolbou (+420…), více čísel oddělte čárkou
- **Text SMS zprávy** — společná šablona pro zákazníka i správce; počítadlo znaků zobrazuje délku a kódování (GSM max 160 zn., UCS2 max 70 zn. při použití diakritiky); tlačítko „Nahradit diakritiku" automaticky přepíše háčky a čárky na základní znaky

SMS se odešle vždy při **potvrzení** rezervace — buď okamžitě (pokud objekt nevyžaduje ruční potvrzení), nebo ve chvíli kdy správce klikne na „Potvrdit".

---

## Záložka: SMTP

Vlastní SMTP nastavení pro odesílání e-mailů z vašeho serveru místo systémového.

- **Použít vlastní SMTP nastavení** — zaškrtněte pokud chcete odesílat e-maily z vlastního serveru; po zaškrtnutí vyplňte: SMTP host, port, uživatel, heslo, odesílatel (From) a Reply-To; všechna pole jsou povinná
- Klikněte na **Ověřit připojení před uložením** — systém otestuje přihlášení k SMTP serveru a po úspěchu se zobrazí tlačítko Uložit
- Bez systémového ani vlastního SMTP se e-maily neodesílají

---

## Dostupnost a obsazenost

Systém automaticky hlídá obsazenost na základě kapacity typu ubytování a existujících rezervací. Zákazník v kalendáři vidí obsazené dny šedě a nemůže je vybrat.
