import { FastifyInstance } from "fastify";
import { requireAuth, orgFilter } from "../plugins/auth";

export async function searchRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireAuth }, async (request) => {
    const { q } = request.query as { q?: string };
    if (!q || q.trim().length < 1) return { reservations: [], camps: [], users: [], blockings: [] };

    const orgId = orgFilter(request);
    // SA bez vybrané organizace — vrátíme prázdno (nehledáme přes všechny org)
    const user = (request as any).user;
    if (user?.isSuperAdmin && !orgId) return { reservations: [], camps: [], users: [], blockings: [] };

    const term = q.trim();
    const contains = { contains: term, mode: "insensitive" as const };

    const campWhere = orgId ? { organizationId: orgId } : {};

    const [reservations, camps, users, blockings] = await Promise.all([
      app.prisma.reservation.findMany({
        where: {
          camp: { ...campWhere },
          OR: [
            { bookingCode: contains },
            { firstName: contains },
            { lastName: contains },
            { email: contains },
            { phone: contains },
            { note: contains },
            { internalNote: contains },
          ],
        },
        select: { id: true, bookingCode: true, firstName: true, lastName: true, email: true, checkIn: true, checkOut: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      app.prisma.camp.findMany({
        where: {
          ...campWhere,
          OR: [
            { name: contains },
            { slug: contains },
          ],
        },
        select: { id: true, name: true, slug: true, organization: { select: { slug: true } }, _count: { select: { accommodationTypes: true } } },
        take: 5,
      }),
      app.prisma.user.findMany({
        where: {
          organizationId: orgId ?? undefined,
          isSuperAdmin: false,
          OR: [
            { name: contains },
            { email: contains },
          ],
        },
        select: { id: true, name: true, email: true },
        take: 5,
      }),
      app.prisma.blockedPeriod.findMany({
        where: {
          camp: { ...campWhere },
          OR: [
            { reason: contains },
            { internalNote: contains },
          ],
        },
        select: { id: true, reason: true, internalNote: true, dateFrom: true, dateTo: true, camp: { select: { name: true } } },
        orderBy: { dateFrom: "asc" },
        take: 5,
      }),
    ]);

    return { reservations, camps, users, blockings };
  });
}
