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

  app.get("/smtp-status", { preHandler: requireSuperAdmin }, async () => {
    const vars = ["SYSTEM_SMTP_HOST", "SYSTEM_SMTP_PORT", "SYSTEM_SMTP_USER", "SYSTEM_SMTP_PASS", "SYSTEM_SMTP_FROM"];
    const missing = vars.filter((v) => !process.env[v]);
    const configured = missing.length === 0;
    let verified = false;
    if (configured) {
      try {
        const nodemailer = await import("nodemailer");
        const transport = nodemailer.default.createTransport({
          host: process.env.SYSTEM_SMTP_HOST,
          port: parseInt(process.env.SYSTEM_SMTP_PORT ?? "587"),
          auth: { user: process.env.SYSTEM_SMTP_USER, pass: process.env.SYSTEM_SMTP_PASS },
        } as any);
        await transport.verify();
        verified = true;
      } catch {
        verified = false;
      }
    }
    return { configured, verified, missing };
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
