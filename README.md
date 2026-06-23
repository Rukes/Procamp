# MůjKemp.cz — Rezervační systém pro kempingy

## O projektu

Cílem rezervačního systému **MůjKemp.cz** je naprogramovat běžným pronajímatelům jednoduchý systém pouze za provozní poplatek. Vývoj obdobného systému stojí desetitisíce až statisíce korun a je následně náročný na údržbu. Systém vznikl na popud známého jako open source — je celý naprogramovaný pomocí Anthropic Claude.

Cena systému je stanovena pouze za provoz, nikoli za vývoj.

**Autor:** Samuel Kunert — [kunerts.cz](https://www.kunerts.cz/) — [samuel@kunerts.cz](mailto:samuel@kunerts.cz) — [GitHub](https://github.com/Rukes/Procamp)

Poděkování: za tvorbu grafických podkladů a loga [Štěpánu Ševčíkovi](https://grafikasevcik.cz), za pomoc se správou VPS Michalovi Řeznikovi.

---

Webová aplikace pro správu rezervací kempů. Obsahuje:

- **Admin panel** — správa kempů, rezervací, uživatelů, e-mailových šablon a jazyků
- **Rezervační formulář** — vkládá se na web přes `<iframe>`, zákazník si rezervuje termín
- **API backend** — Node.js/Fastify, komunikuje s PostgreSQL databází

---

## Co je nového (červen 2026 — aktualizace 5)

- **SA: Všichni uživatelé** — nová stránka `/all-users` v SA sekci; tabulka všech uživatelů napříč organizacemi se sloupci Jméno, E-mail, Organizace, Role; tlačítka Upravit, Odhlásit (force-logout), Smazat; vyhledávání
- **SA: Ověření systémového SMTP** — na stránce Systém nová sekce s tlačítkem „Ověřit systémový SMTP"; zobrazí zelené/červené stavy pro konfiguraci (env proměnné) i připojení (nodemailer verify)
- **Oprávnění blokací** — nová samostatná oprávnění `blockings_view`, `blockings_edit`, `blockings_delete` oddělená od rezervací; existující uživatelé migrováni skriptem (`migrate-blockings-perms.ts`) dle aktuálních rezervačních oprávnění
- **Skrýt osoby v formuláři** — v nastavení objektu nové checkboxy „Skrýt volbu a cenu dospělého" a „Skrýt volbu a cenu dítěte"; skryje výběr v rezervačním formuláři i ceny v administraci
- **Kontextová nápověda** — tlačítko `?` vedle nadpisu na každé stránce otevře modal s příslušnou nápovědou; sdílí obsah se stránkou /help — úprava `.md` souboru se projeví na obou místech
- **Logování rezervací** — při vytvoření rezervace se do logu aktivit zapíše kompletní záznam včetně organizace, objektu, kontaktních údajů, termínu, ceny a příplatků
- **Cascade smazání uživatelů** — při smazání organizace se automaticky smažou i všichni uživatelé v ní

## Co je nového (červen 2026 — aktualizace 4)

- **Ověření SMTP před uložením** — tlačítko „Ověřit připojení před uložením" testuje přihlášení k SMTP serveru přes nodemailer `verify()`; tlačítko Uložit SMTP se zobrazí až po úspěšném testu; pokud uživatel změní jakékoliv pole, test se resetuje a musí proběhnout znovu
- **Obnovit výchozí šablonu** — tlačítko v editoru e-mailové šablony (vpravo od pole Předmět); po potvrzení načte výchozí šablonu; neuloží se automaticky, uložení provede uživatel ručně
- **Opravy e-mailových šablon** — typ ubytování se nyní zobrazuje jako textový název (nikoliv `[object Object]`); datum příjezdu a odjezdu formátováno jako `22. 6. 2026`; label „Typ ubytování" přejmenován na „Rezervace ubytování" v obou šablonách
- **Poznámka zákazníka** — přejmenování v detailu rezervace pro odlišení od interní poznámky

## Co je nového (červen 2026 — aktualizace 3)

- **Systémový SMTP** — globální SMTP server nastavený přes env proměnné (`SYSTEM_SMTP_*`); použije se pro všechny objekty které nemají vlastní SMTP; bez systémového SMTP musí mít každý objekt vlastní nastavení
- **Vlastní SMTP objektu** — checkbox „Použít vlastní SMTP nastavení" v detailu objektu; pokud není zaškrtnut, použije se systémový SMTP; nová pole: **Reply-To** (adresa pro odpovědi zákazníků) — povinná při vlastním SMTP; systémový SMTP používá notifikační e-mail objektu jako reply-to automaticky
- **Stránka Systém (SA)** — kill switch pro veškerý mailing (pokud je vypnut, neodesílají se žádné e-maily); tlačítko „Odhlásit všechny uživatele" (global logout přes `globalTokenVersion`)
- **Global logout** — zvýšení `globalTokenVersion` v DB okamžitě invaliduje všechny přihlášené session
- **E-maily při ručním vytvoření rezervace** — při vytvoření rezervace v adminu lze zaškrtnout „Odeslat potvrzení zákazníkovi" (výchozí: ano) a „Odeslat potvrzení správci" (výchozí: ne)
- **Opakované odeslání e-mailu** — v detailu rezervace dropdown tlačítko „E-maily" → „Znovu odeslat potvrzovací e-mail zákazníkovi" (s potvrzením)
- **Logování e-mailů** — každé odeslání nebo selhání e-mailu se loguje do logu aktivit jako `EMAIL_SENT` / `EMAIL_FAILED` se svázáním na ID rezervace a uživatele který akci spustil
- **Lepší defaultní e-mailové šablony** — nové šablony pro správce i zákazníka s modrým headerem, sekcemi (kontakt, rezervace, cena), tabulkovým zobrazením a zvýrazněnou celkovou cenou
- **Vylepšený WYSIWYG editor šablon** — přepínání mezi vizuálním editorem a HTML zdrojovým kódem; vkládání odkazů a obrázků (s volitelným odkazem) přes inline popup; tooltopy na všech tlačítkách toolbaru; výrazné odělení sekce proměnných
- **E-mail správce povinný při vytvoření objektu** — pole Notifikační e-mail je nyní součástí formuláře nového objektu
- **Přidání jazyka kopíruje data** — při přidání nového jazyka se automaticky zkopírují překlady typů ubytování, příplatků a e-mailových šablon z výchozího jazyka; ceny se přepočtou zadaným koeficientem (např. 0,04 pro CZK→EUR); po přidání systém zobrazí souhrn co bylo zkopírováno

## Co je nového (červen 2026 — aktualizace 2)

- **Blokace termínů** — nová sekce pro uzavření termínů (údržba, soukromá akce…); blokace celého objektu nebo konkrétního typu; zákazník v formuláři blokované dny nevidí jako dostupné
- **Interní poznámka na rezervaci** — pole viditelné pouze správcům, zákazník ho nikdy nevidí; v seznamu zobrazena jako červená ikona s popoverem
- **Sdílený kalendář rezervací** — měsíční kalendář s výběrem dne, počty na dnech, tlačítko Dnes; použit na Dashboardu i v záložce Kalendář v Rezervacích
- **Dashboard** — sjednocena tabulka rezervací (poznámky, e-mail, typ, os.); na mobilu seznam nahoře, kalendář dole
- **Filtry rezervací** — přidán filtr Příjezd od/do; export respektuje všechny aktivní filtry (objekt, status, vyhledávání, datum)
- **Nový objekt jako modal** — formulář pro vytvoření objektu otevírán v modalu místo inline karty
- **Záložky objektu na mobilu** — horizontálně scrollovatelné, vhodné pro úzké displeje
- **Modaly zarovnány nahoru** — všechny modaly v admin panelu i formuláři zobrazeny nahoře obrazovky
- **Formulář — ikony** — přidány ikony ke všem polím v kontaktním kroku; nadpis prvního kroku sjednocen na „Vyberte typ rezervace" (všechny jazyky); poznámky příplatků zobrazeny přes SurchargeNote komponentu; Font Awesome přidán do formuláře

## Co je nového (červen 2026 — aktualizace)

- **Responzivní design** — admin panel plně použitelný na mobilních zařízeních; hamburger menu, scrollovatelné tabulky, přizpůsobené filtry a tlačítka
- **Bezpečnost — invalidace session** — při změně hesla, oprávnění nebo přiřazených objektů uživatele (administrátorem) dojde k okamžitému odhlášení upraveného uživatele (`tokenVersion` mechanismus); smazaný uživatel je odhlášen automaticky
- **Nová rezervace v menu** — zelené tlačítko `+` vedle položky Rezervace v levém menu pro rychlé vytvoření
- **Smazání organizace přesunuto** — tlačítko Smazat je nyní pouze v nastavení organizace, nikoli v přehledovém seznamu
- **Nápověda** — syntax highlighting kódu (`highlight.js`, téma github-dark-dimmed), tlačítko kopírování, responzivní mobilní menu
- **Přesměrování při změně organizace** — SA je po přepnutí organizace přesměrován na dashboard pro obnovení dat

## Co je nového (červen 2026)

- **Multi-tenancy — Organizace** — systém podporuje více nezávislých organizací; každá má vlastní kempy, uživatele a jazyky; data jsou striktně oddělena
- **Přepínač organizace** — super admin vidí v menu dropdown pro přepínání mezi organizacemi (globální pohled nebo pohled za konkrétní org)
- **URL formuláře s org slugem** — `/form/{orgSlug}/{campSlug}` — dvě organizace mohou mít stejný slug kempu bez kolize
- **GDPR & podmínky** — org může nastavit vlastní text podmínek přes WYSIWYG editor (TipTap); pokud je vyplněn, zákazník musí odsouhlasit checkbox před odesláním formuláře
- **hCaptcha** — ochrana přihlášení i rezervačního formuláře; aktivuje se nastavením `VITE_HCAPTCHA_SITE_KEY` (admin + form) a `HCAPTCHA_SECRET` (API); bez klíčů je captcha transparentně vypnuta
- **Překlady formuláře** — rezervační formulář je plně přeložen do 11 jazyků (cs, en, de, pl, it, es, fr, ru, uk, sk, hu) včetně správného formátování dat a cen podle měny jazyka
- **Nová rezervace** — výběr termínu přes kalendář (react-day-picker), automatický výběr objektu pokud existuje jen jeden, živá kalkulace ceny (příplatky, osoby, počet nocí) při ručním zadávání
- **Seznam rezervací** — virtuální stavy „Proběhla" a „Propadlá", řazení kliknutím na hlavičku, zelené zvýraznění probíhajících pobytů, ikonka poznámky s hover/toggle popoverem, filtr podle stavu včetně „Propadlá"
- **Detail rezervace** — nepovinná pole vždy zobrazena (šedé „nevyplněno"), vyplněná poznámka zvýrazněna amber boxem, označení aktuálního dne v kalendáři
- **Paginator** — na všech výpisech (rezervace 25/str, objekty/jazyky/uživatelé 20/str)
- **Správa uživatelů** — formulář nového/editovaného uživatele otevírán jako modal; generátor hesla s kopírováním do schránky
- **Oprávnění `org_admin`** — správce organizace může spravovat jazyky a nastavení své organizace (stránka Moje organizace)
- **Moje organizace** — uživatel s `org_admin` vidí a může upravovat nastavení své organizace (fakturační údaje, ARES sync, podmínky, GDPR)
- **Nastavení účtu** — každý přihlášený uživatel může změnit svůj e-mail a heslo (menu → Nastavení)
- **ARES integrace** — automatické načtení fakturačních údajů podle IČO z ares.gov.cz
- **Výběr země** — standardizovaný select s evropskými zeměmi (ČR jako první, na konci „Jiná mimo EU")
- **Rate limiting** — login endpoint je omezen na 10 pokusů za 5 minut (ochrana proti brute-force)
- **Export Excel** — opravený export rezervací do .xlsx
- **Prostředí** — URL formuláře přesunuta do `VITE_FORM_BASE_URL` env proměnné
- **Logy aktivit** — SA stránka s přehledem všech akcí (přihlášení, vytvoření, úpravy, smazání); diff zobrazení změn pole po poli (před/po); loguje se i IP adresa a rezervace z veřejného formuláře; filtrování a řazení dle sloupců
- **Auto-potvrzení rezervace** — pokud objekt nemá zapnuté `Vyžadovat potvrzení`, rezervace se vytvoří rovnou jako `CONFIRMED`
- **Správná měna v detailu rezervace** — cena se zobrazuje v měně odpovídající jazyku rezervace
- **Smazání rezervace** — tlačítko v detailu rezervace (pro uživatele s oprávněním `reservations_delete`)
- **Oprava URL formuláře v seznamu objektů** — odkaz nyní obsahuje org slug (`/form/{orgSlug}/{campSlug}`)
- **Nápověda** — in-app nápověda s vlastním layoutem a 8 tématy (MD soubory renderované přes `marked`)
- **Stránka O autorovi** — statická stránka s informacemi o projektu a autorovi
- **Přejmenování na MůjKemp.cz** — celý systém přejmenován včetně domén (`app.mujkemp.cz`, `api.mujkemp.cz`, `form.mujkemp.cz`)
- **Dynamický title** — každá stránka nastavuje `<title>` ve formátu `Stránka | MůjKemp.cz`
- **Interní poznámka organizace** — SA může u každé organizace uložit soukromou poznámku (červeně ohraničená textarea); pole se nikdy neposílá na frontend nepřihlášeným ani běžným uživatelům; v seznamu organizací se zobrazí červená ikonka s hover/touch popoverem

---

## Tech stack

| Vrstva | Technologie |
|--------|-------------|
| **Backend** | Node.js 20, Fastify 4, TypeScript |
| **ORM + databáze** | Prisma 5, PostgreSQL 16 |
| **Autentizace** | JWT, bcryptjs |
| **E-mail** | Nodemailer (konfigurovatelný SMTP per kemp) |
| **Frontend** | React 18, TypeScript, Vite 5 |
| **Styling** | Tailwind CSS 3 |
| **Formuláře** | React Hook Form + Zod |
| **Kalendář** | react-day-picker |
| **HTTP klient** | Axios |
| **Monorepo** | pnpm workspaces |
| **Kontejnerizace** | Docker + Docker Compose |
| **Web server** | Nginx (ve frontend kontejnerech) |
| **Process manager** | PM2 (pro manuální instalaci bez Dockeru) |

---

## Struktura projektu

```
procamp/
  apps/
    api/      → Backend (Node.js, Fastify, Prisma, PostgreSQL)
    admin/    → Admin panel (React, spustí se na admin.váš-doména.cz)
    form/     → Rezervační formulář (React, spustí se na form.váš-doména.cz)
  packages/
    shared/   → Sdílené TypeScript typy a validační schémata
```

---

## Nasazení pomocí Docker (doporučeno)

Nejjednodušší způsob instalace — Docker se postará o databázi, API i oba frontendy.

### Požadavky

- **Docker** a **Docker Compose** (verze 2+)
- Na VPS stačí: Ubuntu 22.04, 1–2 GB RAM

### Instalace Dockeru na VPS

```bash
curl -fsSL https://get.docker.com | sh
```

### Spuštění

```bash
# 1. Nakopírujte projekt na server a přejděte do složky
cd /var/www/mujkemp

# 2. Vytvořte soubor s proměnnými
cp .env.example .env
nano .env
```

Vyplňte `.env`:

```env
DB_PASSWORD=silne-heslo-sem
JWT_SECRET=sem-vlozit-nahodny-retezec-node-e-console.log-crypto.randomBytes-64-toString-hex
VITE_API_URL=https://api.mujkemp.cz
VITE_FORM_BASE_URL=https://form.mujkemp.cz
```

```bash
# 3. Spusťte vše jedním příkazem
docker compose up -d --build
```

Docker automaticky:
- spustí PostgreSQL databázi
- sestaví a spustí API (provede migrace + seed při prvním startu)
- sestaví a spustí admin panel na portu **3000**
- sestaví a spustí formulář na portu **3002**

### Ověření

```bash
docker compose ps          # stav kontejnerů
docker compose logs api    # logy API
```

API health check: `http://IP-SERVERU:3001/api/health`

### Nginx reverse proxy (pro vlastní doménu a HTTPS)

Nainstalujte Nginx a Certbot, pak nasměrujte domény na lokální porty:

```nginx
# /etc/nginx/sites-available/mujkemp
server {
    server_name api.mujkemp.cz;
    location / { proxy_pass http://127.0.0.1:3001; proxy_set_header Host $host; }
}
server {
    server_name app.mujkemp.cz;
    location / { proxy_pass http://127.0.0.1:3000; }
}
server {
    server_name form.mujkemp.cz;
    add_header X-Frame-Options "";
    add_header Content-Security-Policy "frame-ancestors *";
    location / { proxy_pass http://127.0.0.1:3002; }
}
```

```bash
ln -s /etc/nginx/sites-available/mujkemp /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.mujkemp.cz -d app.mujkemp.cz -d form.mujkemp.cz
```

### Aktualizace

```bash
docker compose down
docker compose up -d --build
```

### Záloha databáze

```bash
docker compose exec db pg_dump -U mujkemp mujkemp > zaloha-$(date +%Y%m%d).sql
```

---

## Manuální instalace na VPS (bez Dockeru)

### Požadavky na server (VPS)

- **OS:** Ubuntu 22.04 nebo Debian 12 (doporučeno)
- **RAM:** minimálně 1 GB (doporučeno 2 GB)
- **Node.js:** verze 20 nebo novější
- **PostgreSQL:** verze 14 nebo novější
- **Nginx**
- **PM2** (správce procesů pro Node.js)
- **Certbot** (SSL certifikáty zdarma od Let's Encrypt)

---

## Instalace krok za krokem

### 1. Připravte server

```bash
# Přihlaste se na VPS jako root nebo uživatel se sudo
ssh root@IP-ADRESA-SERVERU

# Aktualizujte systém
apt update && apt upgrade -y

# Nainstalujte Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Nainstalujte pnpm (správce balíčků)
npm install -g pnpm

# Nainstalujte PM2 (správce procesů)
npm install -g pm2

# Nainstalujte PostgreSQL
apt install -y postgresql postgresql-contrib

# Nainstalujte Nginx
apt install -y nginx

# Nainstalujte Certbot (SSL)
apt install -y certbot python3-certbot-nginx
```

### 2. Nastavte PostgreSQL databázi

```bash
# Přepněte se na uživatele postgres
sudo -u postgres psql

# Vytvořte databázi a uživatele (heslo změňte na vlastní bezpečné heslo)
CREATE DATABASE mujkemp;
CREATE USER mujkemp WITH ENCRYPTED PASSWORD 'silne-heslo-sem';
GRANT ALL PRIVILEGES ON DATABASE mujkemp TO mujkemp;
\q
```

### 3. Nahrajte kód na server

```bash
# Vytvořte složku pro aplikaci
mkdir -p /var/www/mujkemp
cd /var/www/mujkemp

# Zkopírujte celý obsah složky procamp/ na server
# Můžete použít scp z vašeho počítače:
# scp -r /cesta/k/procamp/* root@IP-SERVERU:/var/www/mujkemp/

# Nebo použijte git, pokud máte repozitář:
# git clone <URL>.git .
```

### 4. Nainstalujte závislosti a sestavte aplikaci

```bash
cd /var/www/mujkemp

# Nainstalujte všechny závislosti
pnpm install

# Sestavte sdílené typy
pnpm --filter=@procamp/shared build 2>/dev/null || true
```

### 5. Nastavte proměnné prostředí pro API

```bash
cd /var/www/mujkemp/apps/api

# Zkopírujte vzorový soubor
cp .env.example .env

# Upravte soubor .env — POVINNÉ změny:
nano .env
```

Do souboru `.env` vyplňte:

```env
# Připojení k databázi (heslo musí souhlasit s tím, co jste zadali v kroku 2)
DATABASE_URL="postgresql://mujkemp:silne-heslo-sem@localhost:5432/mujkemp"

# JWT tajný klíč — vygenerujte náhodný řetězec:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="sem-vložte-vygenerovaný-řetězec"

PORT=3001
```

### 6. Inicializujte databázi

```bash
cd /var/www/mujkemp

# Vygenerujte Prisma klienta
pnpm db:generate

# Spusťte migrace (vytvoří tabulky)
pnpm db:migrate

# Naplňte výchozí data (první admin účet, výchozí jazyk)
pnpm db:seed
```

Po spuštění seedu uvidíte:
```
✅ Super admin created: admin@mujkemp.cz / admin123456
⚠️  Change the password after first login!
```

> **DŮLEŽITÉ:** Po prvním přihlášení si změňte heslo! (Menu → Nastavení → Změna hesla)

### 7. Sestavte API

```bash
cd /var/www/mujkemp/apps/api
pnpm build
```

### 8. Sestavte frontend aplikace

```bash
cd /var/www/mujkemp

# Admin panel
pnpm --filter=admin build

# Rezervační formulář
pnpm --filter=form build
```

### 9. Nakopírujte sestavené frontendy

```bash
# Vytvořte složky
mkdir -p /var/www/mujkemp/admin
mkdir -p /var/www/mujkemp/form

# Nakopírujte sestavené soubory
cp -r /var/www/mujkemp/apps/admin/dist/* /var/www/mujkemp/admin/
cp -r /var/www/mujkemp/apps/form/dist/* /var/www/mujkemp/form/
```

### 10. Spusťte API pomocí PM2

```bash
cd /var/www/mujkemp

# Spusťte API
pm2 start ecosystem.config.js

# Nastavte automatický start po restartu serveru
pm2 startup
pm2 save
```

Ověřte, že API běží:
```bash
pm2 status
# Měli byste vidět: mujkemp-api | online
```

### 11. Nastavte Nginx

```bash
# Zkopírujte vzorový config
cp /var/www/mujkemp/nginx.conf.example /etc/nginx/sites-available/mujkemp

# Upravte config — změňte domény
nano /etc/nginx/sites-available/mujkemp
```

Nahraďte v souboru všechny výskyty `vas-domen.cz` vaší skutečnou doménou.

```bash
# Aktivujte konfiguraci
ln -s /etc/nginx/sites-available/mujkemp /etc/nginx/sites-enabled/

# Zkontrolujte správnost konfigurace
nginx -t

# Restartujte Nginx
systemctl restart nginx
```

### 12. Nastavte SSL certifikáty (HTTPS)

```bash
# Získejte SSL certifikáty pro všechny tři subdomény
certbot --nginx -d api.mujkemp.cz -d app.mujkemp.cz -d form.mujkemp.cz
```

Certbot automaticky upraví Nginx konfiguraci pro HTTPS a nastaví automatické obnovování certifikátů.

---

## Ověření funkčnosti

Po instalaci otevřete v prohlížeči:

1. **Admin:** `https://app.mujkemp.cz`
   - Přihlaste se: `admin@mujkemp.cz` / `admin123456`
   - Ihned změňte heslo

2. **API health check:** `https://api.mujkemp.cz/api/health`
   - Mělo by vrátit: `{"status":"ok"}`

3. **Formulář (demo):** `https://form.mujkemp.cz/form/{org-slug}/{kemp-slug}`
   - Nahraďte `{org-slug}` slugem organizace a `{kemp-slug}` slugem kempu

---

## První kroky v administraci

1. Přihlaste se jako super admin (`admin@mujkemp.cz` / `admin123456`)
2. Přejděte do **Organizace** → **+ Nová organizace** — vytvořte organizaci pro prvního zákazníka
3. V menu vyberte nově vytvořenou organizaci z přepínače
4. Přejděte do **Jazyky** → přidejte alespoň jeden jazyk (např. `cs` — Čeština)
5. Přejděte do **Uživatelé** → vytvořte admin účet pro zákazníka
6. Přejděte do **Objekty** → **+ Nový objekt** — nastavte název a slug kempu
7. V detailu objektu nastavte:
   - **Nastavení:** kapacity, ceny, SMTP pro e-maily
   - **Příplatky:** přidejte volitelné příplatky (elektřina apod.)
   - **E-mailové šablony:** upravte texty potvrzovacích e-mailů
8. V záložce **Vložení na web** zkopírujte `<iframe>` kód a vložte ho na stránku zákazníka

---

## Vložení formuláře na web

Zkopírujte iframe kód z detailu kempu (záložka „Vložení na web"):

```html
<iframe
  src="https://form.mujkemp.cz/form/{org-slug}/{kemp-slug}"
  width="100%"
  height="700"
  frameborder="0"
  style="border:none;border-radius:12px;"
></iframe>
```

Pro konkrétní jazyk přidejte parametr `?lang=en` (nebo jiný kód jazyka, který máte přidaný).

---

## Nastavení e-mailů (SMTP)

Systém podporuje dva způsoby odesílání e-mailů:

### 1. Systémový SMTP (doporučeno)

Nastavte globální SMTP server přes env proměnné v `apps/api/.env`:

```env
SYSTEM_SMTP_HOST="smtp.vas-provider.cz"
SYSTEM_SMTP_PORT=587
SYSTEM_SMTP_USER="info@mujkemp.cz"
SYSTEM_SMTP_PASS="heslo-sem"
SYSTEM_SMTP_FROM="MůjKemp.cz <info@mujkemp.cz>"
```

Systémový SMTP použijí automaticky všechny objekty které nemají vlastní SMTP. Reply-To se nastaví na notifikační e-mail příslušného objektu.

### 2. Vlastní SMTP objektu

V detailu objektu → záložka **Nastavení** zaškrtněte „Použít vlastní SMTP nastavení" a vyplňte:

| Pole | Příklad |
|------|---------|
| SMTP Host | `smtp.vas-poskytovatel.cz` |
| SMTP Port | `587` (TLS) nebo `465` (SSL) |
| SMTP Uživatel | `info@vas-domen.cz` |
| SMTP Heslo | heslo k e-mailu |
| Odesílatel (From) | `Kemp Mlýnská <info@kempmylnska.cz>` |
| Reply-To | `info@kempmylnska.cz` |

### Kill switch

Super admin může na stránce **Systém** jedním přepínačem vypnout veškerý mailing — e-maily se pak neodesílají bez ohledu na nastavení SMTP.

---

## Aktualizace aplikace

Když dostanete novou verzi kódu:

```bash
cd /var/www/mujkemp

# Nahrajte nový kód (nebo git pull)
pnpm install
pnpm db:migrate          # spusťte nové migrace (pokud jsou)

# Znovu sestavte
pnpm --filter=api build
pnpm --filter=admin build
pnpm --filter=form build

# Nakopírujte frontendy
cp -r apps/admin/dist/* admin/
cp -r apps/form/dist/* form/

# Restartujte API
pm2 restart mujkemp-api
```

---

## Správa a monitoring

```bash
# Zobrazit stav procesů
pm2 status

# Zobrazit logy API (chyby, přístupy)
pm2 logs mujkemp-api

# Restart API
pm2 restart mujkemp-api

# Záloha databáze
pg_dump -U mujkemp mujkemp > zaloha-$(date +%Y%m%d).sql
```

---

## Řešení problémů

**API nereaguje:**
```bash
pm2 logs mujkemp-api --lines 50
```

**Chyba databázového připojení:**
- Zkontrolujte `DATABASE_URL` v souboru `/var/www/mujkemp/apps/api/.env`
- Ověřte, že PostgreSQL běží: `systemctl status postgresql`

**Formulář nelze vložit do iframe:**
- Zkontrolujte, že Nginx config pro `form.mujkemp.cz` obsahuje `add_header X-Frame-Options "";`

**E-maily se neodesílají:**
- Zkontrolujte SMTP nastavení v detailu kempu
- Prohlédněte logy: `pm2 logs mujkemp-api | grep -i email`
