import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { loginSchema } from "@procamp/shared";
import { requireAuth } from "../plugins/auth";

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "5 minutes",
        errorResponseBuilder: () => ({ error: "Příliš mnoho pokusů o přihlášení. Zkuste to za 5 minut." }),
      },
    },
  }, async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await app.prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return reply.status(401).send({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) return reply.status(401).send({ error: "Invalid credentials" });

    const token = app.jwt.sign({
      sub: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      permissions: user.permissions,
      organizationId: user.organizationId ?? null,
    });

    return { token, user: { id: user.id, name: user.name, email: user.email, isSuperAdmin: user.isSuperAdmin, permissions: user.permissions, organizationId: user.organizationId ?? null } };
  });

  app.get("/me", { preHandler: requireAuth }, async (request) => {
    const { sub } = request.user;
    const user = await app.prisma.user.findUniqueOrThrow({ where: { id: sub } });
    return { id: user.id, name: user.name, email: user.email, isSuperAdmin: user.isSuperAdmin, permissions: user.permissions, reservationsDefaultView: user.reservationsDefaultView, organizationId: user.organizationId ?? null };
  });

  app.post("/change-email", { preHandler: requireAuth }, async (request, reply) => {
    const { email } = request.body as { email: string };
    const { sub } = request.user;
    const existing = await app.prisma.user.findFirst({ where: { email, NOT: { id: sub } } });
    if (existing) return reply.status(409).send({ error: "Email is already in use" });
    const user = await app.prisma.user.update({ where: { id: sub }, data: { email }, select: { id: true, name: true, email: true, isSuperAdmin: true, permissions: true, organizationId: true } });
    return user;
  });

  app.post("/change-password", { preHandler: requireAuth }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body as { currentPassword: string; newPassword: string };
    const { sub } = request.user;

    const user = await app.prisma.user.findUniqueOrThrow({ where: { id: sub } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return reply.status(400).send({ error: "Current password is incorrect" });

    const hash = await bcrypt.hash(newPassword, 12);
    await app.prisma.user.update({ where: { id: sub }, data: { passwordHash: hash } });
    return { success: true };
  });
}
