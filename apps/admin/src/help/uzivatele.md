# Uživatelé

## Přidání uživatele

V sekci **Uživatelé** klikněte na **+ Nový uživatel**. Vyplňte jméno, e-mail a heslo. Tlačítkem vedle pole hesla lze vygenerovat náhodné bezpečné heslo — automaticky se zkopíruje do schránky, abyste ho mohli předat kolegovi.

## Přístupová oprávnění

Každému uživateli lze nastavit přesně ta oprávnění která potřebuje. Oprávnění jsou rozdělena do skupin:

### Rezervace
- **Zobrazení** — vidí seznam a detail rezervací
- **Vytvoření** — může vytvořit novou rezervaci v adminu
- **Úprava** — může upravit rezervaci a změnit její stav
- **Smazání** — může trvale smazat rezervaci

### Objekty
- **Zobrazení** — vidí objekty a jejich nastavení
- **Vytvoření** — může přidat nový objekt
- **Úprava** — může upravit nastavení objektu, ceny, příplatky a e-mailové šablony
- **Smazání** — může trvale smazat objekt

### Blokace
- **Zobrazení** — vidí seznam blokací termínů
- **Vytvoření a úprava** — může přidávat a upravovat blokace
- **Smazání** — může trvale smazat blokaci

### Správa
- **Správa uživatelů** — může přidávat a upravovat ostatní uživatele
- **Nastavení organizace** — přístup k nastavení organizace, fakturačním údajům a jazykům

## Přístup k objektům

V modalu uživatele lze zaškrtnout konkrétní objekty ke kterým má mít přístup. Uživatel pak vidí pouze rezervace a objekty z tohoto výběru.

Pokud není zaškrtnut žádný objekt, uživatel má přístup ke všem objektům organizace.

Uživatel s oprávněním **Nastavení organizace** vždy vidí vše bez ohledu na výběr objektů.

## Automatické odhlášení při změně nastavení

Pokud správce změní uživateli **heslo**, **oprávnění** nebo **přiřazené objekty**, systém automaticky zneplatní jeho aktuální přihlášení. Uživatel bude při příštím požadavku odhlášen a musí se přihlásit znovu. Toto je bezpečnostní opatření zabraňující přístupu s odvolanými právy.

Smazaný uživatel je odhlášen okamžitě — jeho token přestane fungovat.

## Nastavení vlastního účtu

Každý uživatel může v sekci **Nastavení** (odkaz dole v levém menu) změnit své heslo a přihlašovací e-mail.
