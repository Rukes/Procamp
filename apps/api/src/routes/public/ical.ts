import { FastifyInstance } from "fastify";

function formatIcalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function toIcalDateStr(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function buildIcal(
  reservations: { id: string; bookingCode: string | null; checkIn: Date; checkOut: Date }[],
  blockedPeriods: { id: string; dateFrom: Date; dateTo: Date; reason: string }[],
  filename: string,
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ubysoft.cz//CS",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const r of reservations) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:reservation-${r.id}@ubysoft.cz`,
      `DTSTART;VALUE=DATE:${toIcalDateStr(new Date(r.checkIn))}`,
      `DTEND;VALUE=DATE:${toIcalDateStr(new Date(r.checkOut))}`,
      `SUMMARY:Rezervace${r.bookingCode ? ` ${r.bookingCode}` : ""}`,
      `DTSTAMP:${formatIcalDate(new Date())}`,
      "END:VEVENT",
    );
  }

  for (const b of blockedPeriods) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:blocking-${b.id}@ubysoft.cz`,
      `DTSTART;VALUE=DATE:${toIcalDateStr(new Date(b.dateFrom))}`,
      `DTEND;VALUE=DATE:${toIcalDateStr(new Date(b.dateTo))}`,
      `SUMMARY:${b.reason || "Blokace"}`,
      `DTSTAMP:${formatIcalDate(new Date())}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export async function icalRoutes(app: FastifyInstance) {
  // Starý endpoint — zachován pro zpětnou kompatibilitu (Booking.com napojení před rebrandom)
  app.get("/ical/:typeId/:campHash", { config: { rateLimit: { max: 60, timeWindow: "1 hour" } } }, async (request, reply) => {
    const { typeId, campHash } = request.params as { typeId: string; campHash: string };

    const camp = await app.prisma.camp.findUnique({
      where: { bookingExportHash: campHash },
      select: { id: true, slug: true, organization: { select: { icalEnabled: true } } },
    });

    if (!camp || !camp.organization?.icalEnabled) return reply.status(404).send("Not found");

    const type = await app.prisma.accommodationType.findFirst({
      where: { id: typeId, campId: camp.id },
      include: {
        reservations: {
          where: { status: { in: ["PENDING", "CONFIRMED"] } },
          select: { id: true, bookingCode: true, checkIn: true, checkOut: true },
        },
        blockedPeriods: {
          where: { source: "manual" },
          select: { id: true, dateFrom: true, dateTo: true, reason: true },
        },
      },
    });

    if (!type || !type.bookingExportEnabled) return reply.status(404).send("Not found");

    reply.header("Content-Type", "text/calendar; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="${camp.slug}-${typeId.slice(0, 8)}.ics"`);
    return reply.send(buildIcal(type.reservations, type.blockedPeriods, `${camp.slug}-${typeId.slice(0, 8)}`));
  });

  // Nový endpoint per ExternalCalendar
  app.get("/ical/ext/:exportHash", { config: { rateLimit: { max: 60, timeWindow: "1 hour" } } }, async (request, reply) => {
    const { exportHash } = request.params as { exportHash: string };

    const cal = await app.prisma.externalCalendar.findUnique({
      where: { exportHash },
      select: {
        id: true,
        source: true,
        exportEnabled: true,
        exportMode: true,
        accommodationTypeId: true,
        accommodationType: {
          select: {
            campId: true,
            bookingExportEnabled: true,
            camp: { select: { slug: true, organization: { select: { icalEnabled: true } } } },
            reservations: {
              where: { status: { in: ["PENDING", "CONFIRMED"] } },
              select: { id: true, bookingCode: true, checkIn: true, checkOut: true },
            },
            blockedPeriods: {
              select: { id: true, dateFrom: true, dateTo: true, reason: true, source: true },
            },
          },
        },
      },
    });

    if (!cal || !cal.exportEnabled) return reply.status(404).send("Not found");
    if (!cal.accommodationType.camp.organization?.icalEnabled) return reply.status(404).send("Not found");

    const sourceKey = cal.source.toLowerCase();
    const blockedPeriods = cal.accommodationType.blockedPeriods.filter((b) => {
      if (cal.exportMode === "OWN_ONLY") return b.source === "manual";
      // ALL_EXCEPT_SOURCE — vynech blokace z tohoto portálu, zahrň manuální i ostatní zdroje
      return b.source !== sourceKey;
    });

    const slug = cal.accommodationType.camp.slug;
    reply.header("Content-Type", "text/calendar; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="${slug}-${sourceKey}.ics"`);
    return reply.send(buildIcal(cal.accommodationType.reservations, blockedPeriods, `${slug}-${sourceKey}`));
  });
}
