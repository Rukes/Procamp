#!/bin/sh
set -e

echo "▶ Spouštím migrace databáze…"
cd /app/apps/api
npx prisma migrate deploy

echo "▶ Spouštím seed (pouze při první instalaci)…"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst().then(u => {
  if (!u) {
    console.log('Databáze je prázdná, spouštím seed…');
    require('child_process').execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  } else {
    console.log('Databáze již obsahuje data, seed přeskočen.');
  }
}).finally(() => prisma.\$disconnect());
" 2>/dev/null || true

echo "▶ Spouštím API…"
exec node /app/apps/api/dist/index.js
