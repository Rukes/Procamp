import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

function parseIcalDates(ical: string): { uid: string; start: string; end: string }[] {
  const events: { uid: string; start: string; end: string }[] = [];
  const blocks = ical.split("BEGIN:VEVENT");
  for (const block of blocks.slice(1)) {
    const uid = block.match(/UID:(.+)/)?.[1]?.trim() ?? "";
    const start = block.match(/DTSTART(?:;[^:]+)?:(\d{8})/)?.[1] ?? "";
    const end = block.match(/DTEND(?:;[^:]+)?:(\d{8})/)?.[1] ?? "";
    if (uid && start && end) events.push({ uid, start, end });
  }
  return events;
}

function icalDateToDate(s: string): Date {
  return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00.000Z`);
}

async function syncType(prisma: PrismaClient, typeId: string, icalUrl: string) {
  let ical: string;
  try {
    const res = await fetch(icalUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    ical = await res.text();
  } catch (err) {
    console.error(`[booking-sync] Failed to fetch iCal for type ${typeId}:`, err);
    return;
  }

  const events = parseIcalDates(ical);

  const existing = await prisma.blockedPeriod.findMany({
    where: { accommodationTypeId: typeId, source: "booking" },
    select: { id: true, externalUid: true },
  });

  const existingByUid = new Map(existing.map((b: any) => [b.externalUid, b.id]));
  const incomingUids = new Set(events.map((e) => e.uid));

  // Smazat blokace které v iCalu už nejsou
  const toDelete = existing.filter((b: any) => !incomingUids.has(b.externalUid)).map((b: any) => b.id);
  if (toDelete.length) {
    await prisma.blockedPeriod.deleteMany({ where: { id: { in: toDelete } } });
  }

  // Přidat nebo aktualizovat
  for (const event of events) {
    const dateFrom = icalDateToDate(event.start);
    const dateTo = icalDateToDate(event.end);
    if (existingByUid.has(event.uid)) {
      await prisma.blockedPeriod.update({
        where: { id: existingByUid.get(event.uid) },
        data: { dateFrom, dateTo },
      });
    } else {
      const type = await prisma.accommodationType.findUnique({ where: { id: typeId }, select: { campId: true } });
      if (!type) continue;
      await prisma.blockedPeriod.create({
        data: { campId: type.campId, accommodationTypeId: typeId, dateFrom, dateTo, reason: "Booking.com", source: "booking", externalUid: event.uid },
      });
    }
  }
}

export async function syncAllBookingIcal(prisma: PrismaClient) {
  const types = await prisma.accommodationType.findMany({
    where: { bookingIcalUrl: { not: null } },
    select: { id: true, bookingIcalUrl: true },
  });

  await Promise.allSettled(
    types.filter((t) => t.bookingIcalUrl).map((t) => syncType(prisma, t.id, t.bookingIcalUrl!))
  );
}

export function startBookingCron(prisma: PrismaClient) {
  cron.schedule("0 * * * *", () => {
    syncAllBookingIcal(prisma).catch((err) => console.error("[booking-sync] cron error:", err));
  });
  console.log("[booking-sync] Cron started — syncing every hour");
}
