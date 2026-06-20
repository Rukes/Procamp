import { FastifyInstance } from "fastify";
import { requireSuperAdmin } from "../plugins/auth";

export async function activityLogRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireSuperAdmin() }, async (request) => {
    const { action, entity, page = "1", limit = "50" } = request.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;

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
