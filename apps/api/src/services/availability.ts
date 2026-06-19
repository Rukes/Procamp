import { PrismaClient } from "@prisma/client";

export async function checkAvailability(
  prisma: PrismaClient,
  campId: string,
  accommodationType: "CARAVAN" | "TENT",
  checkIn: Date,
  checkOut: Date,
  excludeReservationId?: string,
): Promise<{ available: boolean; capacity: number; booked: number }> {
  const camp = await prisma.camp.findUniqueOrThrow({ where: { id: campId } });
  const capacity = accommodationType === "CARAVAN" ? camp.caravanCapacity : camp.tentCapacity;

  // Find overlapping confirmed/pending reservations
  const overlapping = await prisma.reservation.count({
    where: {
      campId,
      accommodationType,
      status: { in: ["PENDING", "CONFIRMED"] },
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      AND: [
        { checkIn: { lt: checkOut } },
        { checkOut: { gt: checkIn } },
      ],
    },
  });

  return { available: overlapping < capacity, capacity, booked: overlapping };
}

export async function getOccupiedDates(
  prisma: PrismaClient,
  campId: string,
  accommodationType: "CARAVAN" | "TENT",
): Promise<string[]> {
  const camp = await prisma.camp.findUniqueOrThrow({ where: { id: campId } });
  const capacity = accommodationType === "CARAVAN" ? camp.caravanCapacity : camp.tentCapacity;

  const reservations = await prisma.reservation.findMany({
    where: { campId, accommodationType, status: { in: ["PENDING", "CONFIRMED"] } },
    select: { checkIn: true, checkOut: true },
  });

  // Count bookings per day
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

  return Object.entries(dayCount)
    .filter(([, count]) => count >= capacity)
    .map(([date]) => date);
}
