import { FastifyInstance } from "fastify";
import { requirePermission, orgFilter } from "../plugins/auth";
import { randomBytes } from "crypto";

const ALLOWED_SOURCES = ["BOOKING", "AIRBNB"] as const;

function generateExportHash(): string {
  return randomBytes(16).toString("hex");
}

export async function externalCalendarRoutes(app: FastifyInstance) {
  // GET /external-calendars?accommodationTypeId=...
  app.get("/", { preHandler: requirePermission("blockings_view") }, async (request) => {
    const { accommodationTypeId } = request.query as { accommodationTypeId?: string };
    const orgId = orgFilter(request);

    const where: Record<string, any> = {};
    if (accommodationTypeId) {
      where.accommodationTypeId = accommodationTypeId;
    }
    if (orgId) {
      where.accommodationType = { camp: { organizationId: orgId } };
    }

    return app.prisma.externalCalendar.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
  });

  // POST /external-calendars
  app.post("/", { preHandler: requirePermission("blockings_edit") }, async (request, reply) => {
    const { accommodationTypeId, source, label, icalImportUrl, exportEnabled, exportMode } = request.body as any;

    if (!ALLOWED_SOURCES.includes(source)) {
      return reply.status(400).send({ error: "Neplatný zdroj" });
    }

    const calendar = await app.prisma.externalCalendar.create({
      data: {
        accommodationTypeId,
        source,
        label: label ?? source,
        icalImportUrl: icalImportUrl || null,
        exportEnabled: exportEnabled ?? true,
        exportMode: exportMode ?? "ALL_EXCEPT_SOURCE",
        exportHash: generateExportHash(),
      },
    });

    return reply.status(201).send(calendar);
  });

  // PATCH /external-calendars/:id
  app.patch("/:id", { preHandler: requirePermission("blockings_edit") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { label, icalImportUrl, exportEnabled, exportMode, regenerateHash } = request.body as any;

    const calendar = await app.prisma.externalCalendar.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(icalImportUrl !== undefined && { icalImportUrl: icalImportUrl || null }),
        ...(exportEnabled !== undefined && { exportEnabled }),
        ...(exportMode !== undefined && { exportMode }),
        ...(regenerateHash && { exportHash: generateExportHash() }),
      },
    });

    return calendar;
  });

  // DELETE /external-calendars/:id
  app.delete("/:id", { preHandler: requirePermission("blockings_edit") }, async (request, reply) => {
    const { id } = request.params as { id: string };

    // Smaž i blokace importované z tohoto zdroje
    const cal = await app.prisma.externalCalendar.findUnique({ where: { id }, select: { source: true, accommodationTypeId: true } });
    if (cal) {
      await app.prisma.blockedPeriod.deleteMany({
        where: { accommodationTypeId: cal.accommodationTypeId, source: cal.source.toLowerCase() },
      });
    }

    await app.prisma.externalCalendar.delete({ where: { id } });
    return reply.status(204).send();
  });

  // POST /external-calendars/:id/sync — manuální sync
  app.post("/:id/sync", { preHandler: requirePermission("blockings_edit") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const cal = await app.prisma.externalCalendar.findUnique({ where: { id } });
    if (!cal || !cal.icalImportUrl) return reply.status(404).send({ error: "Nenalezeno nebo chybí URL" });

    const { syncType } = await import("../services/bookingIcalSync");
    const result = await syncType(app.prisma, cal.accommodationTypeId, cal.icalImportUrl, cal.source.toLowerCase());
    return result;
  });
}
