import { FastifyInstance } from "fastify";

function formatIcalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export async function icalRoutes(app: FastifyInstance) {
  app.get("/ical/:typeId/:campHash", { config: { rateLimit: { max: 60, timeWindow: "1 hour" } } }, async (request, reply) => {
    const { typeId, campHash } = request.params as { typeId: string; campHash: string };

    const camp = await app.prisma.camp.findUnique({
      where: { bookingExportHash: campHash },
      select: { id: true, name: true, slug: true, bookingExportHash: true, organization: { select: { bookingEnabled: true } } },
    });

    if (!camp || !camp.organization?.bookingEnabled) return reply.status(404).send("Not found");

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

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//MujKemp.cz//CS",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    for (const r of type.reservations) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:reservation-${r.id}@mujkemp.cz`,
        `DTSTART;VALUE=DATE:${new Date(r.checkIn).toISOString().slice(0, 10).replace(/-/g, "")}`,
        `DTEND;VALUE=DATE:${new Date(r.checkOut).toISOString().slice(0, 10).replace(/-/g, "")}`,
        `SUMMARY:Rezervace${r.bookingCode ? ` ${r.bookingCode}` : ""}`,
        `DTSTAMP:${formatIcalDate(new Date())}`,
        "END:VEVENT",
      );
    }

    for (const b of type.blockedPeriods) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:blocking-${b.id}@mujkemp.cz`,
        `DTSTART;VALUE=DATE:${new Date(b.dateFrom).toISOString().slice(0, 10).replace(/-/g, "")}`,
        `DTEND;VALUE=DATE:${new Date(b.dateTo).toISOString().slice(0, 10).replace(/-/g, "")}`,
        `SUMMARY:${b.reason || "Blokace"}`,
        `DTSTAMP:${formatIcalDate(new Date())}`,
        "END:VEVENT",
      );
    }

    lines.push("END:VCALENDAR");

    reply.header("Content-Type", "text/calendar; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="${camp.slug}-${typeId.slice(0, 8)}.ics"`);
    return reply.send(lines.join("\r\n"));
  });
}
