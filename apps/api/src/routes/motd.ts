import { FastifyInstance } from "fastify";
import { requireSuperAdmin, requireAuth } from "../plugins/auth";

export async function motdRoutes(app: FastifyInstance) {
  // Aktivní zprávy pro přihlášené uživatele
  app.get("/active", { preHandler: requireAuth }, async () => {
    const now = new Date();
    return app.prisma.motd.findMany({
      where: { active: true, validFrom: { lte: now }, validTo: { gte: now } },
      orderBy: { createdAt: "desc" },
    });
  });

  // SA — seznam všech
  app.get("/", { preHandler: requireSuperAdmin() }, async () => {
    return app.prisma.motd.findMany({ orderBy: { createdAt: "desc" } });
  });

  // SA — vytvoření
  app.post("/", { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const body = request.body as {
      title: string; body: string; color: string;
      closeable: boolean; showDashboard: boolean; showGlobal: boolean; showMenu: boolean;
      linkUrl?: string; linkLabel?: string; active: boolean;
      validFrom: string; validTo: string;
    };
    const motd = await app.prisma.motd.create({
      data: {
        title: body.title, body: body.body, color: body.color,
        closeable: body.closeable, showDashboard: body.showDashboard,
        showGlobal: body.showGlobal, showMenu: body.showMenu,
        linkUrl: body.linkUrl || null, linkLabel: body.linkLabel || null,
        active: body.active,
        validFrom: new Date(body.validFrom), validTo: new Date(body.validTo),
      },
    });
    return reply.status(201).send(motd);
  });

  // SA — update
  app.put("/:id", { preHandler: requireSuperAdmin() }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      title: string; body: string; color: string;
      closeable: boolean; showDashboard: boolean; showGlobal: boolean; showMenu: boolean;
      linkUrl?: string; linkLabel?: string; active: boolean;
      validFrom: string; validTo: string;
    };
    return app.prisma.motd.update({
      where: { id },
      data: {
        title: body.title, body: body.body, color: body.color,
        closeable: body.closeable, showDashboard: body.showDashboard,
        showGlobal: body.showGlobal, showMenu: body.showMenu,
        linkUrl: body.linkUrl || null, linkLabel: body.linkLabel || null,
        active: body.active,
        validFrom: new Date(body.validFrom), validTo: new Date(body.validTo),
      },
    });
  });

  // SA — smazání
  app.delete("/:id", { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await app.prisma.motd.delete({ where: { id } });
    return reply.status(204).send();
  });
}
