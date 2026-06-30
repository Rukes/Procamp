/**
 * Generátor testovacích blokací.
 * Použití: npx tsx prisma/seed-blockings.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const camps = await prisma.camp.findMany({
    include: { accommodationTypes: true },
  });

  if (camps.length === 0) {
    console.error("❌  Žádné objekty nenalezeny.");
    process.exit(1);
  }

  const blockings = [
    { offsetStart: 5,  nights: 3,  reason: "Údržba sociálního zařízení" },
    { offsetStart: 15, nights: 2,  reason: "Soukromá akce" },
    { offsetStart: 25, nights: 5,  reason: "Rekonstrukce příjezdové cesty" },
    { offsetStart: -5, nights: 2,  reason: "Uzavřeno — technická závada" },
    { offsetStart: 40, nights: 7,  reason: "Firemní akce — celý areál" },
  ];

  let created = 0;

  for (const camp of camps) {
    for (let i = 0; i < blockings.length; i++) {
      const b = blockings[i % blockings.length];
      const dateFrom = addDays(today, b.offsetStart + i * 2);
      const dateTo = addDays(dateFrom, b.nights);

      // Část blokací per-objekt, část per-typ
      const type = camp.accommodationTypes[i % camp.accommodationTypes.length] ?? null;

      await prisma.blockedPeriod.create({
        data: {
          campId: camp.id,
          accommodationTypeId: type && i % 2 === 0 ? type.id : null,
          dateFrom,
          dateTo,
          reason: b.reason,
          source: "manual",
        },
      });
      created++;
    }
  }

  console.log(`✅  Vytvořeno ${created} blokací pro ${camps.length} objektů.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
