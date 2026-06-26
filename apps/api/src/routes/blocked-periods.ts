import { FastifyInstance } from "fastify";
import { requirePermission, orgFilter, campFilter } from "../plugins/auth";
import { logActivity } from "../services/activityLog";

export async function blockedPeriodRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requirePermission("blockings_view") }, async (request) => {
    const { campId } = request.query as { campId?: string };
    const orgId = orgFilter(request);
    const allowedCampIds = campFilter(request);
    const where: Record<string, any> = {};
    if (orgId) where.camp = { organizationId: orgId };
    if (campId) where.campId = campId;
    else if (allowedCampIds) where.campId = { in: allowedCampIds };
    return app.prisma.blockedPeriod.findMany({
      where,
      include: { camp: true, accommodationType: true },
      orderBy: { dateFrom: "asc" },
    });
  });

  app.post("/", { preHandler: requirePermission("blockings_edit") }, async (request, reply) => {
    const { campId, accommodationTypeId, dateFrom, dateTo, reason, internalNote } = request.body as any;
    const period = await app.prisma.blockedPeriod.create({
      data: {
        campId,
        accommodationTypeId: accommodationTypeId || null,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        reason: reason ?? "",
        internalNote: internalNote || null,
      },
      include: { camp: true, accommodationType: true },
    });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "CREATE", entity: "Blokace", entityId: period.id, payload: { campId, accommodationTypeId: accommodationTypeId || null, dateFrom, dateTo, reason } });
    return reply.status(201).send(period);
  });

  app.patch("/:id", { preHandler: requirePermission("blockings_edit") }, async (request) => {
    const { id } = request.params as { id: string };
    const { accommodationTypeId, dateFrom, dateTo, reason, internalNote } = request.body as any;
    const period = await app.prisma.blockedPeriod.update({
      where: { id },
      data: {
        accommodationTypeId: accommodationTypeId || null,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        reason: reason ?? "",
        internalNote: internalNote || null,
      },
      include: { camp: true, accommodationType: true },
    });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "UPDATE", entity: "Blokace", entityId: id, payload: { dateFrom, dateTo, reason } });
    return period;
  });

  app.delete("/:id", { preHandler: requirePermission("blockings_delete") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const period = await app.prisma.blockedPeriod.findUnique({ where: { id }, select: { reason: true, dateFrom: true, dateTo: true } });
    await app.prisma.blockedPeriod.delete({ where: { id } });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "DELETE", entity: "Blokace", entityId: id, payload: { reason: period?.reason, dateFrom: period?.dateFrom, dateTo: period?.dateTo } });
    return reply.status(204).send();
  });
}
