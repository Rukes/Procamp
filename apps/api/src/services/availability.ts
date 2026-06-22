import { PrismaClient } from "@prisma/client";

export async function checkAvailability(
  prisma: PrismaClient,
  campId: string,
  accommodationTypeId: string,
  checkIn: Date,
  checkOut: Date,
  excludeReservationId?: string,
): Promise<{ available: boolean; capacity: number; booked: number }> {
  const accType = await prisma.accommodationType.findUniqueOrThrow({ where: { id: accommodationTypeId } });
  const capacity = accType.capacity;
  if (capacity === 0) return { available: false, capacity, booked: 0 };
  if (capacity === -1) return { available: true, capacity, booked: 0 };

  const overlapping = await prisma.reservation.count({
    where: {
      campId,
      accommodationTypeId,
      status: { in: ["PENDING", "CONFIRMED"] },
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      AND: [
        { checkIn: { lt: checkOut } },
        { checkOut: { gt: checkIn } },
      ],
    },
  });

  const blocked = await (prisma as any).blockedPeriod.count({
    where: {
      campId,
      OR: [{ accommodationTypeId }, { accommodationTypeId: null }],
      AND: [{ dateFrom: { lt: checkOut } }, { dateTo: { gt: checkIn } }],
    },
  });

  return { available: overlapping < capacity && blocked === 0, capacity, booked: overlapping };
}

export async function getOccupiedDates(
  prisma: PrismaClient,
  campId: string,
  accommodationTypeId: string,
): Promise<string[]> {
  const accType = await prisma.accommodationType.findUniqueOrThrow({ where: { id: accommodationTypeId } });
  const capacity = accType.capacity;
  if (capacity === 0) return []; // vypnuto — žádné termíny nenabídneme (ale type bude skrytý)
  if (capacity === -1) return []; // neomezeno — nikdy obsazeno

  const reservations = await prisma.reservation.findMany({
    where: { campId, accommodationTypeId, status: { in: ["PENDING", "CONFIRMED"] } },
    select: { checkIn: true, checkOut: true },
  });

  const dayCount: Record<string, number> = {};
  for (const r of reservations) {
    const cur = new Date(r.checkIn);
    const end = new Date(r.checkOut);
    while (cur < end) {
      const key = cur.toISOString().slice(0, 10);
      dayCount[key] = (dayCount[key] ?? 0) + 1;
      cur.setDate(cur.getDate() + 1);
    }
  }

  const occupied = Object.entries(dayCount)
    .filter(([, count]) => count >= capacity)
    .map(([date]) => date);

  const blocks = await (prisma as any).blockedPeriod.findMany({
    where: {
      campId,
      OR: [{ accommodationTypeId }, { accommodationTypeId: null }],
    },
    select: { dateFrom: true, dateTo: true },
  });

  const blockedDays = new Set<string>();
  for (const b of blocks) {
    const cur = new Date(b.dateFrom);
    const end = new Date(b.dateTo);
    while (cur < end) {
      blockedDays.add(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  }

  return [...new Set([...occupied, ...blockedDays])];
}
