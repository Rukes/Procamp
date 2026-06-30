/**
 * Generátor testovacích rezervací.
 *
 * Použití:
 *   npx tsx prisma/seed-reservations.ts <slug-objektu> [počet]
 *
 * Příklad:
 *   npx tsx prisma/seed-reservations.ts muj-kemp 30
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FIRST_NAMES = ["Jan", "Petr", "Martin", "Tomáš", "Lukáš", "Pavel", "Jiří", "Ondřej", "Michal", "David", "Anna", "Eva", "Lenka", "Kateřina", "Jana", "Marie", "Tereza", "Petra", "Lucie", "Monika"];
const LAST_NAMES = ["Novák", "Svoboda", "Novotný", "Dvořák", "Černý", "Procházka", "Kučera", "Veselý", "Horáček", "Pospíšil", "Blažek", "Fiala", "Kratochvíl", "Kovář", "Marek", "Šimánek", "Kopecký", "Vlček", "Beneš", "Pokorný"];
const NOTES = ["Přijedeme po 18h", "Máme psa", "Potřebujeme místo v blízkosti sociálního zařízení", "Oslava narozenin", "", "", "", ""];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function main() {
  const slug = process.argv[2];
  const count = parseInt(process.argv[3] ?? "20", 10);

  if (!slug) {
    console.error("❌  Použití: npx tsx prisma/seed-reservations.ts <slug-objektu> [počet]");
    process.exit(1);
  }

  const camp = await prisma.camp.findFirst({
    where: { slug },
    include: {
      accommodationTypes: { include: { prices: true } },
      surcharges: { include: { prices: true } },
    },
  });

  if (!camp) {
    console.error(`❌  Objekt se slugem „${slug}" nebyl nalezen.`);
    process.exit(1);
  }

  if (camp.accommodationTypes.length === 0) {
    console.error(`❌  Objekt „${camp.name}" nemá žádné typy ubytování.`);
    process.exit(1);
  }

  const languages = await prisma.language.findMany();
  const lang = languages.find((l) => l.isDefault) ?? languages[0];
  if (!lang) {
    console.error(`❌  Objekt nemá přiřazený jazyk.`);
    process.exit(1);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log(`\n🏕  Objekt: ${camp.name} (${slug})`);
  console.log(`📅  Generuji ${count} rezervací v rozsahu ±1 měsíc od dnes...\n`);

  const statuses = ["PENDING", "CONFIRMED", "CONFIRMED", "CONFIRMED", "CANCELLED"];

  let created = 0;
  for (let i = 0; i < count; i++) {
    const type = rand(camp.accommodationTypes);

    // Checkn-in: náhodně -30 až +30 dní od dnes
    const checkInOffset = randInt(-30, 30);
    const checkIn = addDays(today, checkInOffset);

    // Délka pobytu: 1–7 nocí
    const nights = randInt(1, 7);
    const checkOut = addDays(checkIn, nights);

    const adults = randInt(1, 4);
    const children = Math.random() < 0.3 ? randInt(1, 3) : 0;

    const firstName = rand(FIRST_NAMES);
    const lastName = rand(LAST_NAMES);
    const status = rand(statuses);

    // Ceny z typu ubytování
    const typePrices = (type as unknown as { prices?: { languageCode: string; pricePerNight: number; adultPricePerNight: number; childPricePerNight: number }[] }).prices;
    const priceRow = typePrices?.find((p) => p.languageCode === lang.code) ?? typePrices?.[0];
    const basePrice = priceRow?.pricePerNight ?? 0;
    const adultPrice = priceRow?.adultPricePerNight ?? 0;
    const childPrice = priceRow?.childPricePerNight ?? 0;

    const personsPrice = adults * adultPrice + children * childPrice;

    // Náhodně vyber volitelné příplatky
    const optionalSurcharges = camp.surcharges.filter((s) => s.isOptional && Math.random() < 0.4);
    const mandatorySurcharges = camp.surcharges.filter((s) => !s.isOptional);
    const selectedSurcharges = [...mandatorySurcharges, ...optionalSurcharges];

    const surchargesPrice = selectedSurcharges.reduce((sum, s) => {
      const sp = s.prices.find((p) => p.languageCode === lang.code) ?? s.prices[0];
      return sum + (sp?.pricePerNight ?? 0);
    }, 0);

    const totalPrice = (basePrice + personsPrice + surchargesPrice) * nights;

    await prisma.reservation.create({
      data: {
        campId: camp.id,
        accommodationTypeId: type.id,
        checkIn,
        checkOut,
        adults,
        children,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: `+420 ${randInt(600, 799)} ${randInt(100, 999)} ${randInt(100, 999)}`,
        licensePlate: Math.random() < 0.6 ? `${rand(["1A", "2B", "3C", "AB", "BM", "KV", "PH", "UL"])}${randInt(1000, 9999)}` : null,
        expectedArrival: Math.random() < 0.5 ? `${String(randInt(14, 21)).padStart(2, "0")}:00–${String(randInt(15, 22)).padStart(2, "0")}:00` : null,
        note: Math.random() < 0.3 ? rand(NOTES.filter(Boolean)) : null,
        totalPrice,
        status,
        languageCode: lang.code,
        surcharges: {
          create: selectedSurcharges.map((s) => {
            const sp = s.prices.find((p) => p.languageCode === lang.code) ?? s.prices[0];
            return { surchargeId: s.id, priceSnapshot: sp?.pricePerNight ?? 0 };
          }),
        },
      },
    });

    created++;
    process.stdout.write(`\r  ✓ ${created}/${count} rezervací`);
  }

  console.log(`\n\n✅  Hotovo! Vytvořeno ${created} testovacích rezervací pro „${camp.name}".`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
