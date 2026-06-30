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

export type SyncResult = { added: number; updated: number; removed: number };

export async function syncType(prisma: PrismaClient, typeId: string, icalUrl: string): Promise<SyncResult> {
  let ical: string;
  try {
    const res = await fetch(icalUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    ical = await res.text();
    if (!ical.trimStart().startsWith("BEGIN:VCALENDAR")) throw new Error("Odpověď není platný iCal formát");
  } catch (err) {
    throw err;
  }

  const events = parseIcalDates(ical);
  const existing = await prisma.blockedPeriod.findMany({
    where: { accommodationTypeId: typeId, source: "booking" },
    select: { id: true, externalUid: true },
  });

  const existingByUid = new Map(existing.map((b) => [b.externalUid ?? "", b.id]));
  const incomingUids = new Set(events.map((e) => e.uid));

  const toDelete = existing.filter((b) => !incomingUids.has(b.externalUid ?? "")).map((b) => b.id);
  if (toDelete.length) await prisma.blockedPeriod.deleteMany({ where: { id: { in: toDelete } } });

  let added = 0, updated = 0;
  for (const event of events) {
    const dateFrom = icalDateToDate(event.start);
    const dateTo = icalDateToDate(event.end);
    if (existingByUid.has(event.uid)) {
      await prisma.blockedPeriod.update({ where: { id: existingByUid.get(event.uid)! }, data: { dateFrom, dateTo } });
      updated++;
    } else {
      const type = await prisma.accommodationType.findUnique({ where: { id: typeId }, select: { campId: true } });
      if (!type) continue;
      const now = new Date();
      const internalNote = `Vloženo: ${now.toLocaleDateString("cs-CZ")} ${now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}`;
      await prisma.blockedPeriod.create({
        data: { campId: type.campId, accommodationTypeId: typeId, dateFrom, dateTo, reason: "Booking.com", source: "booking", externalUid: event.uid, internalNote },
      });
      added++;
    }
  }

  return { added, updated, removed: toDelete.length };
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
    console.log("[booking-sync][cron] Running sync...");
    syncAllBookingIcal(prisma)
      .then(() => console.log("[booking-sync][cron] Sync done"))
      .catch((err) => console.error("[booking-sync][cron] error:", err));
  });
  console.log("[booking-sync] Cron started — syncing every hour");
}
