import { FastifyInstance } from "fastify";
import { requirePermission, orgFilter, campFilter } from "../plugins/auth";

export async function blockedPeriodRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requirePermission("reservations_view") }, async (request) => {
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

  app.post("/", { preHandler: requirePermission("reservations_edit") }, async (request, reply) => {
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
    return reply.status(201).send(period);
  });

  app.patch("/:id", { preHandler: requirePermission("reservations_edit") }, async (request) => {
    const { id } = request.params as { id: string };
    const { accommodationTypeId, dateFrom, dateTo, reason, internalNote } = request.body as any;
    return app.prisma.blockedPeriod.update({
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
  });

  app.delete("/:id", { preHandler: requirePermission("reservations_edit") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await app.prisma.blockedPeriod.delete({ where: { id } });
    return reply.status(204).send();
  });
}
