/**
 * Demo data pro organizaci.
 * Vytvoří: jazyk, 2 objekty (kemp + apartmán), typy ubytování, příplatky, blokace, rezervace.
 *
 * Použití:
 *   npx tsx prisma/seed-demo.ts <organizationId>
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FIRST_NAMES = ["Jan", "Petr", "Martin", "Tomáš", "Lukáš", "Pavel", "Ondřej", "Michal", "David", "Anna", "Eva", "Kateřina", "Jana", "Tereza", "Lucie"];
const LAST_NAMES = ["Novák", "Svoboda", "Novotný", "Dvořák", "Černý", "Procházka", "Kučera", "Veselý", "Horáček", "Blažek", "Kratochvíl", "Kovář", "Beneš", "Pokorný"];
const NOTES = ["Přijedeme po 18h", "Máme psa", "Oslava narozenin", "Potřebujeme místo u sociálního zařízení", "", "", ""];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function addDays(date: Date, days: number): Date { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function cuid(): string { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

async function main() {
  const orgId = process.argv[2];
  if (!orgId) { console.error("❌  Použití: npx tsx prisma/seed-demo.ts <organizationId>"); process.exit(1); }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) { console.error(`❌  Organizace ${orgId} nenalezena.`); process.exit(1); }
  console.log(`\n🏢  Organizace: ${org.name}\n`);

  // --- Jazyk ---
  let lang = await prisma.language.findFirst({ where: { organizationId: orgId } });
  if (!lang) {
    lang = await prisma.language.create({
      data: {
        id: cuid(), code: "cs", name: "Čeština", isDefault: true,
        currencyCode: "CZK", currencySymbol: "Kč", currencyPosition: "after",
        organizationId: orgId,
      },
    });
    console.log("✅  Jazyk: Čeština");
  } else {
    console.log(`ℹ️  Jazyk: ${lang.name} (existuje)`);
  }

  // ============================================================
  // OBJEKT 1 — Kemp Slunečná louka
  // ============================================================
  console.log("\n📍  Vytvářím Kemp Slunečná louka...");
  const kemp = await prisma.camp.create({
    data: {
      id: cuid(), name: "Kemp Slunečná louka", slug: `demo-kemp-${Date.now()}`,
      organizationId: orgId, notificationEmail: "info@kempslunecna.cz",
      requiresConfirmation: false,
    },
  });

  // Typy ubytování — kemp
  const typeStan = await prisma.accommodationType.create({
    data: {
      id: cuid(), campId: kemp.id, capacity: 8, sortOrder: 0,
      translations: { cs: { name: "Místo pro stan", description: "Travnatá parcela pro stan nebo malý karavan. Součástí je připojení na elektřinu 230V." } },
      prices: { create: [{ id: cuid(), languageCode: "cs", pricePerNight: 250, adultPricePerNight: 80, childPricePerNight: 40 }] },
    },
  });

  const typeKaravan = await prisma.accommodationType.create({
    data: {
      id: cuid(), campId: kemp.id, capacity: 6, sortOrder: 1,
      translations: { cs: { name: "Místo pro karavan", description: "Zpevněná parcela pro karavan nebo obytný vůz. Elektřina 230V, přívod vody." } },
      prices: { create: [{ id: cuid(), languageCode: "cs", pricePerNight: 380, adultPricePerNight: 80, childPricePerNight: 40 }] },
    },
  });

  const typeChalupa = await prisma.accommodationType.create({
    data: {
      id: cuid(), campId: kemp.id, capacity: 5, sortOrder: 2, maxAdults: 4, maxChildren: 3,
      translations: { cs: { name: "Dřevěná chata", description: "Útulná dřevěná chata s kuchyňkou, koupelnou a terasou. Ložnice pro 2 dospělé + 2 palandy." } },
      prices: { create: [{ id: cuid(), languageCode: "cs", pricePerNight: 890, adultPricePerNight: 0, childPricePerNight: 0 }] },
    },
  });

  console.log("  ✓ Typy ubytování: Stan, Karavan, Dřevěná chata");

  // Příplatky — kemp
  const surchargePes = await prisma.surcharge.create({
    data: {
      id: cuid(), campId: kemp.id, isOptional: true, sortOrder: 0,
      translations: { cs: { name: "Pes", description: "Za každého psa na parcele." } },
      prices: { create: [{ id: cuid(), languageCode: "cs", pricePerNight: 50 }] },
    },
  });

  await prisma.surcharge.create({
    data: {
      id: cuid(), campId: kemp.id, isOptional: true, sortOrder: 1,
      translations: { cs: { name: "Parkovací místo", description: "Vyhrazené parkovací místo u chaty." } },
      prices: { create: [{ id: cuid(), languageCode: "cs", pricePerNight: 80 }] },
      applicableTypeIds: [typeChalupa.id],
    },
  });

  await prisma.surcharge.create({
    data: {
      id: cuid(), campId: kemp.id, isOptional: false, sortOrder: 2,
      translations: { cs: { name: "Rekreační poplatek", description: "Povinný místní poplatek." } },
      prices: { create: [{ id: cuid(), languageCode: "cs", pricePerNight: 25 }] },
    },
  });

  console.log("  ✓ Příplatky: Pes, Parkovací místo, Rekreační poplatek");

  // Blokace — kemp
  const today = new Date(); today.setHours(0, 0, 0, 0);
  await prisma.blockedPeriod.createMany({
    data: [
      { id: cuid(), campId: kemp.id, accommodationTypeId: null, dateFrom: addDays(today, 8), dateTo: addDays(today, 11), reason: "Údržba areálu", source: "manual" },
      { id: cuid(), campId: kemp.id, accommodationTypeId: typeChalupa.id, dateFrom: addDays(today, 20), dateTo: addDays(today, 24), reason: "Rekonstrukce koupelny", source: "manual" },
      { id: cuid(), campId: kemp.id, accommodationTypeId: null, dateFrom: addDays(today, -4), dateTo: addDays(today, -1), reason: "Soukromá akce", source: "manual" },
    ],
  });
  console.log("  ✓ Blokace: 3");

  // Rezervace — kemp
  const kempTypes = [typeStan, typeKaravan, typeChalupa];
  const statuses = ["PENDING", "CONFIRMED", "CONFIRMED", "CONFIRMED", "CANCELLED"] as const;
  let rCount = 0;
  for (let i = 0; i < 30; i++) {
    const type = rand(kempTypes);
    const checkIn = addDays(today, randInt(-20, 40));
    const nights = randInt(1, 7);
    const checkOut = addDays(checkIn, nights);
    const adults = randInt(1, 3);
    const children = Math.random() < 0.3 ? randInt(1, 2) : 0;
    const status = rand(statuses);
    const firstName = rand(FIRST_NAMES);
    const lastName = rand(LAST_NAMES);

    const pricePerNight = type.id === typeStan.id ? 250 : type.id === typeKaravan.id ? 380 : 890;
    const totalPrice = pricePerNight * nights + adults * 80 * nights + children * 40 * nights;

    const res = await prisma.reservation.create({
      data: {
        id: cuid(), campId: kemp.id, accommodationTypeId: type.id,
        checkIn, checkOut, adults, children, status,
        firstName, lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: `+420 ${randInt(600, 799)} ${randInt(100, 999)} ${randInt(100, 999)}`,
        totalPrice,
        languageCode: "cs",
        note: Math.random() < 0.25 ? rand(NOTES.filter(Boolean)) : null,
      },
    });

    if (Math.random() < 0.3) {
      await prisma.reservationSurcharge.create({
        data: { id: cuid(), reservationId: res.id, surchargeId: surchargePes.id, priceSnapshot: 50 },
      });
    }
    rCount++;
  }
  console.log(`  ✓ Rezervace: ${rCount}`);

  // ============================================================
  // OBJEKT 2 — Apartmány Na Kopci (dynamická cena)
  // ============================================================
  console.log("\n📍  Vytvářím Apartmány Na Kopci...");
  const apt = await prisma.camp.create({
    data: {
      id: cuid(), name: "Apartmány Na Kopci", slug: `demo-apt-${Date.now()}`,
      organizationId: orgId, notificationEmail: "info@nakopci.cz",
      requiresConfirmation: true,
    },
  });

  // Typy ubytování — apartmán s dynamickou cenou
  const aptStudio = await prisma.accommodationType.create({
    data: {
      id: cuid(), campId: apt.id, capacity: 2, sortOrder: 0, maxAdults: 2, maxChildren: 1,
      useDynamicPricing: true,
      translations: { cs: { name: "Studio", description: "Moderní studio s kuchyňským koutem, koupelnou a výhledem do zahrady. Vhodné pro 2 osoby." } },
      prices: { create: [{ id: cuid(), languageCode: "cs", pricePerNight: 0, adultPricePerNight: 0, childPricePerNight: 0 }] },
    },
  });

  // Night tiers pro Studio
  const tierStudio1 = await prisma.nightTier.create({ data: { id: cuid(), accommodationTypeId: aptStudio.id, fromNight: 1 } });
  const tierStudio2 = await prisma.nightTier.create({ data: { id: cuid(), accommodationTypeId: aptStudio.id, fromNight: 4 } });
  const tierStudio3 = await prisma.nightTier.create({ data: { id: cuid(), accommodationTypeId: aptStudio.id, fromNight: 7 } });
  await prisma.nightTierPrice.createMany({
    data: [
      { id: cuid(), tierId: tierStudio1.id, languageCode: "cs", pricePerNight: 1200 },
      { id: cuid(), tierId: tierStudio2.id, languageCode: "cs", pricePerNight: 1050 },
      { id: cuid(), tierId: tierStudio3.id, languageCode: "cs", pricePerNight: 900 },
    ],
  });

  const aptDeluxe = await prisma.accommodationType.create({
    data: {
      id: cuid(), campId: apt.id, capacity: 4, sortOrder: 1, maxAdults: 4, maxChildren: 2,
      useDynamicPricing: true,
      translations: { cs: { name: "Apartmán Deluxe", description: "Prostorný apartmán se dvěma ložnicemi, obývacím pokojem a plně vybavenou kuchyní. Balkón s výhledem na les." } },
      prices: { create: [{ id: cuid(), languageCode: "cs", pricePerNight: 0, adultPricePerNight: 0, childPricePerNight: 0 }] },
    },
  });

  const tierDeluxe1 = await prisma.nightTier.create({ data: { id: cuid(), accommodationTypeId: aptDeluxe.id, fromNight: 1 } });
  const tierDeluxe2 = await prisma.nightTier.create({ data: { id: cuid(), accommodationTypeId: aptDeluxe.id, fromNight: 3 } });
  const tierDeluxe3 = await prisma.nightTier.create({ data: { id: cuid(), accommodationTypeId: aptDeluxe.id, fromNight: 6 } });
  await prisma.nightTierPrice.createMany({
    data: [
      { id: cuid(), tierId: tierDeluxe1.id, languageCode: "cs", pricePerNight: 2200 },
      { id: cuid(), tierId: tierDeluxe2.id, languageCode: "cs", pricePerNight: 1900 },
      { id: cuid(), tierId: tierDeluxe3.id, languageCode: "cs", pricePerNight: 1650 },
    ],
  });

  console.log("  ✓ Typy ubytování: Studio (dyn. cena 900–1200 Kč), Deluxe (dyn. cena 1650–2200 Kč)");

  // Příplatky — apartmán
  await prisma.surcharge.create({
    data: {
      id: cuid(), campId: apt.id, isOptional: true, sortOrder: 0,
      translations: { cs: { name: "Snídaně", description: "Kontinentální snídaně servírovaná na pokoji (8:00–10:00)." } },
      prices: { create: [{ id: cuid(), languageCode: "cs", pricePerNight: 180 }] },
    },
  });

  await prisma.surcharge.create({
    data: {
      id: cuid(), campId: apt.id, isOptional: true, sortOrder: 1,
      translations: { cs: { name: "Parkování", description: "Místo na hlídaném parkovišti." } },
      prices: { create: [{ id: cuid(), languageCode: "cs", pricePerNight: 120 }] },
    },
  });

  await prisma.surcharge.create({
    data: {
      id: cuid(), campId: apt.id, isOptional: false, sortOrder: 2,
      translations: { cs: { name: "Čištění", description: "Povinný úklidový poplatek při odjezdu." } },
      prices: { create: [{ id: cuid(), languageCode: "cs", pricePerNight: 200 }] },
    },
  });

  console.log("  ✓ Příplatky: Snídaně, Parkování, Čištění");

  // Blokace — apartmán
  await prisma.blockedPeriod.createMany({
    data: [
      { id: cuid(), campId: apt.id, accommodationTypeId: aptStudio.id, dateFrom: addDays(today, 5), dateTo: addDays(today, 9), reason: "Malování", source: "manual" },
      { id: cuid(), campId: apt.id, accommodationTypeId: null, dateFrom: addDays(today, 30), dateTo: addDays(today, 35), reason: "Uzavření na sezónu", source: "manual" },
    ],
  });
  console.log("  ✓ Blokace: 2");

  // Rezervace — apartmán
  const aptTypes = [aptStudio, aptDeluxe];
  const tierPrices: Record<string, number[]> = {
    [aptStudio.id]: [1200, 1050, 900],
    [aptDeluxe.id]: [2200, 1900, 1650],
  };

  let aCount = 0;
  for (let i = 0; i < 20; i++) {
    const type = rand(aptTypes);
    const checkIn = addDays(today, randInt(-15, 45));
    const nights = randInt(2, 10);
    const checkOut = addDays(checkIn, nights);
    const adults = randInt(1, type.id === aptStudio.id ? 2 : 4);
    const children = Math.random() < 0.2 ? 1 : 0;
    const status = rand(statuses);
    const firstName = rand(FIRST_NAMES);
    const lastName = rand(LAST_NAMES);

    const prices = tierPrices[type.id];
    const pricePerNight = nights >= 7 ? prices[2] : nights >= (type.id === aptStudio.id ? 4 : 3) ? prices[1] : prices[0];
    const totalPrice = pricePerNight * nights + 200;

    await prisma.reservation.create({
      data: {
        id: cuid(), campId: apt.id, accommodationTypeId: type.id,
        checkIn, checkOut, adults, children, status,
        firstName, lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: `+420 ${randInt(600, 799)} ${randInt(100, 999)} ${randInt(100, 999)}`,
        totalPrice,
        languageCode: "cs",
        note: Math.random() < 0.2 ? rand(NOTES.filter(Boolean)) : null,
        internalNote: Math.random() < 0.15 ? "Stálý host — sleva 10 % při příštím pobytu" : null,
      },
    });
    aCount++;
  }
  console.log(`  ✓ Rezervace: ${aCount}`);

  console.log(`\n✅  Hotovo! Vytvořeno demo pro organizaci „${org.name}":`);
  console.log(`   • Kemp Slunečná louka — 3 typy, 3 příplatky, 3 blokace, 30 rezervací`);
  console.log(`   • Apartmány Na Kopci  — 2 typy (dyn. cena), 3 příplatky, 2 blokace, 20 rezervací`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
