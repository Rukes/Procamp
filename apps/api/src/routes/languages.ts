import { FastifyInstance } from "fastify";
import { requirePermission } from "../plugins/auth";

export async function languageRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return app.prisma.language.findMany({ orderBy: { isDefault: "desc" } });
  });

  app.post("/", { preHandler: requirePermission("settings_edit") }, async (request, reply) => {
    const { code, name, currencyCode, currencySymbol, currencyPosition } = request.body as {
      code: string; name: string; currencyCode?: string; currencySymbol?: string; currencyPosition?: string;
    };
    const lang = await app.prisma.language.create({
      data: { code, name, ...(currencyCode && { currencyCode }), ...(currencySymbol && { currencySymbol }), ...(currencyPosition && { currencyPosition }) },
    });
    return reply.status(201).send(lang);
  });

  app.put("/:id", { preHandler: requirePermission("settings_edit") }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; currencyCode?: string; currencySymbol?: string; currencyPosition?: string };
    return app.prisma.language.update({ where: { id }, data: body });
  });

  app.delete("/:id", { preHandler: requirePermission("settings_edit") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const lang = await app.prisma.language.findUniqueOrThrow({ where: { id } });
    if (lang.isDefault) return reply.status(400).send({ error: "Cannot delete default language" });
    await app.prisma.language.delete({ where: { id } });
    return { success: true };
  });
}
