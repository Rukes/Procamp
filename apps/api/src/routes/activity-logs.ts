import { FastifyInstance } from "fastify";
import { requireSuperAdmin } from "../plugins/auth";

export async function activityLogRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireSuperAdmin() }, async (request) => {
    const { action, entity, search, page = "1", limit = "50" } = request.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const conditions: Record<string, unknown>[] = [];
    if (action) conditions.push({ action });
    if (entity) conditions.push({ entity });
    if (search) {
      conditions.push({
        OR: [
          { userEmail: { contains: search, mode: "insensitive" } },
          { entityId: { contains: search, mode: "insensitive" } },
          { payload: { string_contains: search } },
        ],
      });
    }
    const where = conditions.length > 0 ? { AND: conditions } : {};

    const [logs, total] = await Promise.all([
      app.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      app.prisma.activityLog.count({ where }),
    ]);

    return { logs, total };
  });
}
