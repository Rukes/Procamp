import { FastifyInstance } from "fastify";
import { requirePermission } from "../plugins/auth";

export async function emailTemplateRoutes(app: FastifyInstance) {
  const guard = requirePermission("templates_edit");

  app.get("/:campId", { preHandler: guard }, async (request) => {
    const { campId } = request.params as { campId: string };
    return app.prisma.emailTemplate.findMany({ where: { campId } });
  });

  app.put("/:campId/:type/:languageCode", { preHandler: guard }, async (request) => {
    const { campId, type, languageCode } = request.params as { campId: string; type: string; languageCode: string };
    const { subject, body } = request.body as { subject: string; body: string };

    return app.prisma.emailTemplate.upsert({
      where: { campId_type_languageCode: { campId, type, languageCode } },
      create: { campId, type, languageCode, subject, body },
      update: { subject, body },
    });
  });
}
