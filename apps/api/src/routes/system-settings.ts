import { FastifyInstance } from "fastify";
import { requireAuth } from "../plugins/auth";

export async function systemSettingsRoutes(app: FastifyInstance) {
  const requireSuperAdmin = async (request: any, reply: any) => {
    await requireAuth(request, reply);
    if (!request.user?.isSuperAdmin) return reply.status(403).send({ error: "Forbidden" });
  };

  app.get("/", { preHandler: requireAuth }, async () => {
    return app.prisma.systemSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });
  });

  app.put("/", { preHandler: requireSuperAdmin }, async (request) => {
    const body = request.body as {
      defaultLanguageCode?: string;
      thousandsSeparator?: string;
      decimalSeparator?: string;
      smtpEnabled?: boolean;
    };
    return app.prisma.systemSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...body },
      update: body,
    });
  });

  app.post("/logout-all", { preHandler: requireSuperAdmin }, async () => {
    const settings = await app.prisma.systemSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", globalTokenVersion: 1 },
      update: { globalTokenVersion: { increment: 1 } },
    });
    return { globalTokenVersion: settings.globalTokenVersion };
  });
}
