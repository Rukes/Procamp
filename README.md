# ProCamp — Rezervační systém pro kempingy

Webová aplikace pro správu rezervací kempů. Obsahuje:

- **Admin panel** — správa kempů, rezervací, uživatelů, e-mailových šablon a jazyků
- **Rezervační formulář** — vkládá se na web přes `<iframe>`, zákazník si rezervuje termín
- **API backend** — Node.js/Fastify, komunikuje s PostgreSQL databází

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
cd /var/www/procamp

# 2. Vytvořte soubor s proměnnými
cp .env.example .env
nano .env
```

Vyplňte `.env`:

```env
DB_PASSWORD=silne-heslo-sem
JWT_SECRET=sem-vlozit-nahodny-retezec-node-e-console.log-crypto.randomBytes-64-toString-hex
VITE_API_URL=https://api.vas-domen.cz
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
# /etc/nginx/sites-available/procamp
server {
    server_name api.vas-domen.cz;
    location / { proxy_pass http://127.0.0.1:3001; proxy_set_header Host $host; }
}
server {
    server_name admin.vas-domen.cz;
    location / { proxy_pass http://127.0.0.1:3000; }
}
server {
    server_name form.vas-domen.cz;
    add_header X-Frame-Options "";
    add_header Content-Security-Policy "frame-ancestors *";
    location / { proxy_pass http://127.0.0.1:3002; }
}
```

```bash
ln -s /etc/nginx/sites-available/procamp /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.vas-domen.cz -d admin.vas-domen.cz -d form.vas-domen.cz
```

### Aktualizace

```bash
docker compose down
docker compose up -d --build
```

### Záloha databáze

```bash
docker compose exec db pg_dump -U procamp procamp > zaloha-$(date +%Y%m%d).sql
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
CREATE DATABASE procamp;
CREATE USER procamp WITH ENCRYPTED PASSWORD 'silne-heslo-sem';
GRANT ALL PRIVILEGES ON DATABASE procamp TO procamp;
\q
```

### 3. Nahrajte kód na server

```bash
# Vytvořte složku pro aplikaci
mkdir -p /var/www/procamp
cd /var/www/procamp

# Zkopírujte celý obsah složky procamp/ na server
# Můžete použít scp z vašeho počítače:
# scp -r /cesta/k/procamp/* root@IP-SERVERU:/var/www/procamp/

# Nebo použijte git, pokud máte repozitář:
# git clone https://github.com/vas-ucet/procamp.git .
```

### 4. Nainstalujte závislosti a sestavte aplikaci

```bash
cd /var/www/procamp

# Nainstalujte všechny závislosti
pnpm install

# Sestavte sdílené typy
pnpm --filter=@procamp/shared build 2>/dev/null || true
```

### 5. Nastavte proměnné prostředí pro API

```bash
cd /var/www/procamp/apps/api

# Zkopírujte vzorový soubor
cp .env.example .env

# Upravte soubor .env — POVINNÉ změny:
nano .env
```

Do souboru `.env` vyplňte:

```env
# Připojení k databázi (heslo musí souhlasit s tím, co jste zadali v kroku 2)
DATABASE_URL="postgresql://procamp:silne-heslo-sem@localhost:5432/procamp"

# JWT tajný klíč — vygenerujte náhodný řetězec:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="sem-vložte-vygenerovaný-řetězec"

PORT=3001
```

### 6. Inicializujte databázi

```bash
cd /var/www/procamp

# Vygenerujte Prisma klienta
pnpm db:generate

# Spusťte migrace (vytvoří tabulky)
pnpm db:migrate

# Naplňte výchozí data (první admin účet, výchozí jazyk)
pnpm db:seed
```

Po spuštění seedu uvidíte:
```
✅ Super admin created: admin@procamp.cz / admin123456
⚠️  Change the password after first login!
```

> **DŮLEŽITÉ:** Po prvním přihlášení si změňte heslo! (Menu → Změna hesla)

### 7. Sestavte API

```bash
cd /var/www/procamp/apps/api
pnpm build
```

### 8. Sestavte frontend aplikace

```bash
cd /var/www/procamp

# Admin panel
pnpm --filter=admin build

# Rezervační formulář
pnpm --filter=form build
```

### 9. Nakopírujte sestavené frontendy

```bash
# Vytvořte složky
mkdir -p /var/www/procamp/admin
mkdir -p /var/www/procamp/form

# Nakopírujte sestavené soubory
cp -r /var/www/procamp/apps/admin/dist/* /var/www/procamp/admin/
cp -r /var/www/procamp/apps/form/dist/* /var/www/procamp/form/
```

### 10. Spusťte API pomocí PM2

```bash
cd /var/www/procamp

# Spusťte API
pm2 start ecosystem.config.js

# Nastavte automatický start po restartu serveru
pm2 startup
pm2 save
```

Ověřte, že API běží:
```bash
pm2 status
# Měli byste vidět: procamp-api | online
```

### 11. Nastavte Nginx

```bash
# Zkopírujte vzorový config
cp /var/www/procamp/nginx.conf.example /etc/nginx/sites-available/procamp

# Upravte config — změňte domény
nano /etc/nginx/sites-available/procamp
```

Nahraďte v souboru všechny výskyty `vas-domen.cz` vaší skutečnou doménou.

```bash
# Aktivujte konfiguraci
ln -s /etc/nginx/sites-available/procamp /etc/nginx/sites-enabled/

# Zkontrolujte správnost konfigurace
nginx -t

# Restartujte Nginx
systemctl restart nginx
```

### 12. Nastavte SSL certifikáty (HTTPS)

```bash
# Získejte SSL certifikáty pro všechny tři subdomény
certbot --nginx -d api.vas-domen.cz -d admin.vas-domen.cz -d form.vas-domen.cz
```

Certbot automaticky upraví Nginx konfiguraci pro HTTPS a nastaví automatické obnovování certifikátů.

---

## Ověření funkčnosti

Po instalaci otevřete v prohlížeči:

1. **Admin:** `https://admin.vas-domen.cz`
   - Přihlaste se: `admin@procamp.cz` / `admin123456`
   - Ihned změňte heslo

2. **API health check:** `https://api.vas-domen.cz/api/health`
   - Mělo by vrátit: `{"status":"ok"}`

3. **Formulář (demo):** `https://form.vas-domen.cz/form/nazev-kempu`
   - Nahraďte `nazev-kempu` slugem kempu, který vytvoříte v adminu

---

## První kroky v administraci

1. Přihlaste se do admin panelu
2. Změňte heslo (Přihlašovací menu → Změna hesla)
3. Přejděte do **Kempy** → **+ Nový kemp**
4. Nastavte název kempu a slug (URL identifikátor, např. `kemp-slunecni`)
5. V detailu kempu nastavte:
   - **Nastavení:** kapacity, ceny, SMTP pro e-maily
   - **Příplatky:** přidejte volitelné příplatky (elektřina apod.)
   - **E-mailové šablony:** upravte texty potvrzovacích e-mailů
6. V záložce **Vložení na web** zkopírujte `<iframe>` kód a vložte ho na vaši stránku

---

## Vložení formuláře na web

Zkopírujte iframe kód z detailu kempu (záložka „Vložení na web"):

```html
<iframe
  src="https://form.vas-domen.cz/form/nazev-kempu"
  width="100%"
  height="700"
  frameborder="0"
  style="border:none;border-radius:12px;"
></iframe>
```

Pro konkrétní jazyk přidejte parametr `?lang=en` (nebo jiný kód jazyka, který máte přidaný).

---

## Nastavení e-mailů (SMTP)

V detailu kempu → záložka **Nastavení** vyplňte SMTP údaje:

| Pole | Příklad |
|------|---------|
| SMTP Host | `smtp.vas-poskytovatel.cz` |
| SMTP Port | `587` (TLS) nebo `465` (SSL) |
| SMTP Uživatel | `info@vas-domen.cz` |
| SMTP Heslo | heslo k e-mailu |
| Odesílatel | `info@vas-domen.cz` |
| Notifikační e-mail | kam přijdou oznámení o nové rezervaci |

---

## Aktualizace aplikace

Když dostanete novou verzi kódu:

```bash
cd /var/www/procamp

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
pm2 restart procamp-api
```

---

## Správa a monitoring

```bash
# Zobrazit stav procesů
pm2 status

# Zobrazit logy API (chyby, přístupy)
pm2 logs procamp-api

# Restart API
pm2 restart procamp-api

# Záloha databáze
pg_dump -U procamp procamp > zaloha-$(date +%Y%m%d).sql
```

---

## Řešení problémů

**API nereaguje:**
```bash
pm2 logs procamp-api --lines 50
```

**Chyba databázového připojení:**
- Zkontrolujte `DATABASE_URL` v souboru `/var/www/procamp/apps/api/.env`
- Ověřte, že PostgreSQL běží: `systemctl status postgresql`

**Formulář nelze vložit do iframe:**
- Zkontrolujte, že Nginx config pro `form.vas-domen.cz` obsahuje `add_header X-Frame-Options "";`

**E-maily se neodesílají:**
- Zkontrolujte SMTP nastavení v detailu kempu
- Prohlédněte logy: `pm2 logs procamp-api | grep -i email`
