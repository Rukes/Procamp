#!/bin/bash
npx tsc prisma/seed-reservations.ts --outDir dist/seed --module commonjs --target ES2020 --moduleResolution node --esModuleInterop true --skipLibCheck true && node dist/seed/seed-reservations.js "$@"
