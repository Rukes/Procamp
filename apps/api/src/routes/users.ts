import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { createUserSchema } from "@procamp/shared";
import { requirePermission, requireAuth } from "../plugins/auth";

const USER_SELECT = { id: true, name: true, email: true, isSuperAdmin: true, permissions: true, reservationsDefaultView: true, createdAt: true };

export async function userRoutes(app: FastifyInstance) {
  const guard = requirePermission("users_manage");

  app.get("/", { preHandler: guard }, async () => {
    return app.prisma.user.findMany({ select: USER_SELECT, orderBy: { createdAt: "asc" } });
  });

  app.post("/", { preHandler: guard }, async (request, reply) => {
    const body = createUserSchema.parse(request.body);
    const existing = await app.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return reply.status(409).send({ error: "Email already in use" });

    const hash = await bcrypt.hash(body.password, 12);
    const user = await app.prisma.user.create({
      data: { name: body.name, email: body.email, passwordHash: hash, isSuperAdmin: body.isSuperAdmin, permissions: body.permissions },
      select: USER_SELECT,
    });
    return reply.status(201).send(user);
  });

  app.put("/:id", { preHandler: guard }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; email?: string; password?: string; isSuperAdmin?: boolean; permissions?: Record<string, boolean>; reservationsDefaultView?: string };

    if (body.email) {
      const existing = await app.prisma.user.findFirst({ where: { email: body.email, NOT: { id } } });
      if (existing) return reply.status(409).send({ error: "Email already in use" });
    }

    const data: Record<string, unknown> = {};
    if (body.name) data.name = body.name;
    if (body.email) data.email = body.email;
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12);
    if (body.isSuperAdmin !== undefined) data.isSuperAdmin = body.isSuperAdmin;
    if (body.permissions) data.permissions = body.permissions;
    if (body.reservationsDefaultView) data.reservationsDefaultView = body.reservationsDefaultView;

    return app.prisma.user.update({ where: { id }, data, select: USER_SELECT });
  });

  // Self-update for default view preference
  app.patch("/me/preferences", { preHandler: requireAuth }, async (request) => {
    const { sub } = request.user;
    const { reservationsDefaultView } = request.body as { reservationsDefaultView: string };
    return app.prisma.user.update({ where: { id: sub }, data: { reservationsDefaultView }, select: USER_SELECT });
  });

  app.delete("/:id", { preHandler: guard }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const caller = request.user as { sub: string };
    if (id === caller.sub) return reply.status(400).send({ error: "Cannot delete yourself" });
    await app.prisma.user.delete({ where: { id } });
    return { success: true };
  });
}
