import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { createUserSchema } from "@procamp/shared";
import { requirePermission, requireAuth, orgFilter } from "../plugins/auth";
import { logActivity, diffObjects } from "../services/activityLog";

const USER_SELECT = { id: true, name: true, email: true, isSuperAdmin: true, permissions: true, reservationsDefaultView: true, organizationId: true, createdAt: true };

export async function userRoutes(app: FastifyInstance) {
  const guard = requirePermission("users_manage");

  app.get("/", { preHandler: guard }, async (request) => {
    const orgId = orgFilter(request);
    return app.prisma.user.findMany({
      where: orgId ? { organizationId: orgId } : {},
      select: USER_SELECT,
      orderBy: { createdAt: "asc" },
    });
  });

  app.post("/", { preHandler: guard }, async (request, reply) => {
    const body = createUserSchema.parse(request.body);
    const existing = await app.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return reply.status(409).send({ error: "Email already in use" });

    const orgId = orgFilter(request);
    if (!orgId) return reply.status(400).send({ error: "Nejprve vyberte organizaci." });
    const hash = await bcrypt.hash(body.password, 12);
    const user = await app.prisma.user.create({
      data: {
        name: body.name, email: body.email, passwordHash: hash,
        isSuperAdmin: body.isSuperAdmin, permissions: body.permissions,
        ...(orgId ? { organizationId: orgId } : {}),
      },
      select: USER_SELECT,
    });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "CREATE", entity: "user", entityId: user.id, payload: user });
    return reply.status(201).send(user);
  });

  app.put("/:id", { preHandler: guard }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; email?: string; password?: string; isSuperAdmin?: boolean; permissions?: Record<string, boolean>; reservationsDefaultView?: string };

    if (body.email) {
      const existing = await app.prisma.user.findFirst({ where: { email: body.email, NOT: { id } } });
      if (existing) return reply.status(409).send({ error: "Email already in use" });
    }

    const before = await app.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    const data: Record<string, unknown> = {};
    if (body.name) data.name = body.name;
    if (body.email) data.email = body.email;
    if (body.reservationsDefaultView) data.reservationsDefaultView = body.reservationsDefaultView;

    // Citlivé změny — invalidovat session upraveného uživatele
    const sensitive = body.password || body.permissions || body.isSuperAdmin !== undefined;
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12);
    if (body.isSuperAdmin !== undefined) data.isSuperAdmin = body.isSuperAdmin;
    if (body.permissions) data.permissions = body.permissions;
    if (sensitive) data.tokenVersion = { increment: 1 };

    const user = await app.prisma.user.update({ where: { id }, data, select: USER_SELECT });
    if (before) {
      const diff = diffObjects(before as Record<string, unknown>, user as Record<string, unknown>);
      await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "UPDATE", entity: "user", entityId: id, payload: diff });
    }
    return user;
  });

  app.patch("/me/preferences", { preHandler: requireAuth }, async (request) => {
    const { sub } = request.user;
    const { reservationsDefaultView } = request.body as { reservationsDefaultView: string };
    return app.prisma.user.update({ where: { id: sub }, data: { reservationsDefaultView }, select: USER_SELECT });
  });

  app.delete("/:id", { preHandler: guard }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (id === request.user.sub) return reply.status(400).send({ error: "Cannot delete yourself" });
    const user = await app.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    await app.prisma.user.delete({ where: { id } });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "DELETE", entity: "user", entityId: id, payload: user });
    return { success: true };
  });
}
