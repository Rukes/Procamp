# Changelog

## 25. 6. 2026

- **Globální vyhledávání** — Spotlight-style fulltext search přístupný přes ⌘K / Ctrl+K nebo tlačítko Hledat v postranním menu; prohledává rezervace (jméno, kód, e-mail, telefon, poznámky), objekty, uživatele a blokace; výsledky jsou barevně odlišeny písmenovými odznaky (R/O/U/B), navigace klávesami ↑↓ a Enter, postupné vysouvání při otevření a zavření
- **Vlajky jazyků** — emoji vlajky nahrazeny SVG vlajkami z knihovny `flag-icons`; zobrazují se správně na všech platformách včetně Windows; vlajky jsou viditelné v přepínači jazyka formuláře, v nastavení objektu (SMS šablony) a na stránce Jazyky
- **Kód rezervace** — každá rezervace dostane unikátní 5místný alfanumerický kód (např. `A3X7T`); nové rezervace ho získají automaticky, existující rezervace jsou postupně doplněny sekvenčně při startu serveru; kód je viditelný jako druhý sloupec v seznamu rezervací, prominentně v detailu rezervace a v kalendářovém výpisu; dostupný jako proměnná `{{bookingCode}}` ve všech e-mailových šablonách a `{bookingCode}` v SMS šabloně; přidán do fulltextového vyhledávání; výchozí šablony e-mailů aktualizovány
- **SMS šablona per jazyk** — text SMS zprávy se nyní nastavuje zvlášť pro každý jazyk objektu; zákazník dostane SMS ve svém jazyce (podle jazyka rezervace); chybějící šablony jsou zvýrazněny oranžově s upozorněním
- **Náhled e-mailové šablony** — tlačítko Náhled u každé jazykové varianty šablony otevře modal s renderovaným obsahem; editor šablony se otevírá na plnou šířku
- **Náhled informací o objektu** — tlačítko Náhled u každého jazyka v sekci Informace o objektu
- **Integrace GoSMS** — SMS notifikace zákazníkovi a/nebo správci při potvrzení rezervace; nastavení API přihlašovacích údajů v detailu organizace (záložka GoSMS), ID kanálu, tlačítko pro načtení kreditu a výpis dostupných kanálů
- **SMS šablona** — textarea v nastavení objektu s počítadlem znaků, indikátorem kódování (GSM 160 zn. / UCS2 70 zn.) a tlačítkem pro nahrazení diakritiky
- **SMS notifikace zákazníkovi** — checkbox v nastavení objektu; telefon se bere z rezervace; při ručním vytvoření rezervace v adminu dostupný checkbox „Odeslat zákazníkovi SMS"
- **SMS notifikace správci** — checkbox + pole pro telefonní čísla s validací (formát +420…, více čísel oddělených čárkou)
- **Znovu odeslat SMS** — v detailu rezervace tlačítko „SMS" (zobrazí se pouze pokud je SMS pro zákazníky povolena); možnost odeslat na jiné telefonní číslo s validací
- **Logování SMS** — každé odeslání SMS se zaznamená do activity logu včetně kompletní odpovědi z GoSMS API

## 24. 6. 2026

- **Dynamická cena typů ubytování** — místo jedné pevné ceny lze nastavit cenové hladiny podle počtu nocí (např. 1–3 noci = 800 Kč/noc, 4–6 nocí = 700 Kč/noc, 7+ nocí = 600 Kč/noc); zákazník ve formuláři vidí minimální cenu a ikonu pro otevření tabulky hladin; cena se přepočítává automaticky při výběru termínu
- **Dynamická cena v nové rezervaci (admin)** — cena při ručním vytváření rezervace se počítá dynamicky podle počtu nocí
- **Dynamická cena v logu** — cena za noc (vypočtená z hladiny) se ukládá do záznamu při vytvoření rezervace
- **Cena za noc v detailu rezervace** — pokud má typ ubytování dynamické ceny, zobrazí se v detailu rezervace efektivní cena za noc
- **Přidání jazyka kopíruje dynamické ceny** — při přidání nového jazyka s koeficientem se přepočítají i ceny všech hladin dynamické ceny
- **Zvýraznění aktivní organizace** — vybraná organizace v seznamu organizací má zelené podbarvení
- **Zvýraznění „Dynamická cena" v seznamu typů** — text je modrý a tučný pro lepší přehlednost

## 23. 6. 2026

- **Filtrování příplatků dle typu ubytování** — v editoru příplatku lze vybrat pro které typy ubytování se příplatek zobrazí; prázdný výběr = zobrazit pro všechny typy
- **Skrytí příplatku** — nová možnost „Nezobrazovat ve formuláři"; příplatek zůstane viditelný v administraci, ale zákazníci ho neuvidí; skryté příplatky jsou v seznamu utlumeny
- **Drag & drop řazení příplatků** — přetažením za úchyt, pořadí se uloží automaticky
- **Drag & drop řazení typů ubytování** — přetažením za úchyt, pořadí se projeví i ve formuláři
- **GA stav v seznamu organizací** — pokud má organizace nastavené klientské GA ID, zobrazí se zelený indikátor v přehledu
- **Google Analytics** — dvojité sledování rezervací; systémové GA ID přes `VITE_GA_ID` (env), klientské GA ID v nastavení organizace; události `begin_checkout` a `purchase`; měření návštěvnosti formuláře
- **Odeslání potvrzení na jiný e-mail** — v detailu rezervace nová možnost zadat libovolnou adresu pro opakované odeslání potvrzení
- **Trim textových polí** — jméno, e-mail, telefon, SPZ a poznámka jsou při vytvoření rezervace automaticky ořezány o mezery
- **Sjednocení WYSIWYG editorů** — všechny textové editory mají stejný toolbar (tučné, kurzíva, nadpisy, seznamy, odkaz, obrázek, HTML režim)

## 21. 6. 2026

- **Logo a favicon** — logo v postranním menu, mobilním top baru a přihlašovací stránce; favicon pro všechna zařízení; loga servována přes API
- **Informace o objektu** — WYSIWYG editor per-jazyk v nastavení objektu; zobrazí se zákazníkovi v modalu přes tlačítko „Info" ve formuláři
- **Šablona Nepotvrzená rezervace** — e-mail zákazníkovi při odeslání rezervace čekající na ruční potvrzení
- **Potvrzení rezervace správcem odesílá e-mail** — při ručním potvrzení (PENDING → CONFIRMED) se zákazníkovi automaticky odešle potvrzení
- **Stránkování — přepínač počtu záznamů** — 20 / 50 / 100 / Vše na všech tabulkách; výchozí 50
- **Fulltext vyhledávání v lozích** — hledání napříč e-mailem, ID entity a obsahem payloadu
- **Oprava přihlášení** — špatné přihlašovací údaje zobrazí chybovou hlášku; pole heslo se po neúspěchu vymaže

## 19. 6. 2026

- **SA: Všichni uživatelé** — nová stránka se seznamem všech uživatelů napříč organizacemi; Upravit, Odhlásit, Smazat
- **SA: Ověření systémového SMTP** — tlačítko pro ověření konfigurace i připojení k SMTP serveru
- **Oprávnění blokací** — samostatná oprávnění `blockings_view`, `blockings_edit`, `blockings_delete`
- **Skrýt osoby v formuláři** — checkboxy pro skrytí výběru a ceny dospělého / dítěte
- **Kontextová nápověda** — tlačítko `?` u každého nadpisu otevře příslušnou nápovědu
- **Logování rezervací** — vytvoření rezervace se zaznamenává do logu aktivit
- **Cascade smazání uživatelů** — při smazání organizace se smažou i všichni její uživatelé

## 17. 6. 2026

- **Ověření SMTP před uložením** — tlačítko pro test připojení; uložení je dostupné až po úspěšném ověření
- **Obnovit výchozí šablonu** — tlačítko pro načtení výchozí e-mailové šablony
- **Opravy e-mailových šablon** — typ ubytování jako text, formátování dat, přejmenování labelů
- **Poznámka zákazníka** — přejmenování pro odlišení od interní poznámky

## 15. 6. 2026

- **Systémový SMTP** — globální SMTP nastavený přes env proměnné; použije se pro objekty bez vlastního SMTP
- **Vlastní SMTP objektu** — možnost nastavit per-objekt SMTP včetně Reply-To
- **Stránka Systém (SA)** — kill switch pro veškerý mailing; tlačítko pro odhlášení všech uživatelů
- **E-maily při ručním vytvoření rezervace** — volba odeslat / neodeslat potvrzení zákazníkovi i správci
- **Opakované odeslání e-mailu** — v detailu rezervace možnost znovu odeslat potvrzení zákazníkovi
- **Logování e-mailů** — každé odeslání nebo selhání e-mailu se loguje
- **Přidání jazyka kopíruje data** — překlady, šablony a přepočítané ceny se automaticky zkopírují

## 13. 6. 2026

- **Blokace termínů** — uzavření termínů pro údržbu nebo soukromé akce; per-objekt nebo per-typ
- **Interní poznámka na rezervaci** — viditelná pouze správcům
- **Sdílený kalendář rezervací** — měsíční přehled s počty na dnech; na Dashboardu i v Rezervacích
- **Filtry rezervací** — filtr Příjezd od/do; export respektuje aktivní filtry
- **Formulář — ikony a UX** — ikony u polí, Font Awesome, SurchargeNote komponenta

## 11. 6. 2026

- **Responzivní design** — admin panel plně použitelný na mobilních zařízeních
- **Invalidace session** — okamžité odhlášení při změně hesla nebo oprávnění
- **Nová rezervace v menu** — zelené tlačítko `+` vedle položky Rezervace

## 9. 6. 2026

- **Multi-tenancy — Organizace** — podpora více nezávislých organizací s oddělením dat
- **hCaptcha** — ochrana přihlášení i rezervačního formuláře
- **Překlady formuláře** — 11 jazyků (cs, en, de, pl, it, es, fr, ru, uk, sk, hu)
- **Logy aktivit** — přehled všech akcí v systému s diff zobrazením změn
- **Export Excel** — export rezervací do .xlsx
- **Správa uživatelů** — modal pro vytvoření/editaci, generátor hesla
- **Moje organizace** — správa fakturačních údajů, podmínek a GDPR
