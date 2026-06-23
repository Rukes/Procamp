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
  - Cena za noc (základní cena za ubytovací místo)
  - Příplatek za dospělého na noc
  - Příplatek za dítě na noc

Celková cena = (cena za noc + dospělí × příplatek + děti × příplatek + příplatky) × počet nocí

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

## Záložka: SMTP

Vlastní SMTP nastavení pro odesílání e-mailů z vašeho serveru místo systémového.

- **Použít vlastní SMTP nastavení** — zaškrtněte pokud chcete odesílat e-maily z vlastního serveru; po zaškrtnutí vyplňte: SMTP host, port, uživatel, heslo, odesílatel (From) a Reply-To; všechna pole jsou povinná
- Klikněte na **Ověřit připojení před uložením** — systém otestuje přihlášení k SMTP serveru a po úspěchu se zobrazí tlačítko Uložit
- Bez systémového ani vlastního SMTP se e-maily neodesílají

---

## Dostupnost a obsazenost

Systém automaticky hlídá obsazenost na základě kapacity typu ubytování a existujících rezervací. Zákazník v kalendáři vidí obsazené dny šedě a nemůže je vybrat.
