import { FastifyInstance } from "fastify";
import { requireAuth, requirePermission } from "../plugins/auth";

export async function accommodationTypeRoutes(app: FastifyInstance) {
  // List types for a camp
  app.get("/:campId/accommodation-types", { preHandler: requireAuth }, async (request) => {
    const { campId } = request.params as { campId: string };
    return app.prisma.accommodationType.findMany({
      where: { campId },
      include: { prices: true },
      orderBy: { sortOrder: "asc" },
    });
  });

  // Create type
  app.post("/:campId/accommodation-types", { preHandler: requirePermission("camps_edit") }, async (request, reply) => {
    const { campId } = request.params as { campId: string };
    const body = request.body as { translations: Record<string, { name: string; shortDescription?: string; longDescription?: string }>; capacity: number; sortOrder?: number };
    const type = await app.prisma.accommodationType.create({
      data: { campId, translations: body.translations, capacity: body.capacity, sortOrder: body.sortOrder ?? 0 },
      include: { prices: true },
    });
    return reply.status(201).send(type);
  });

  // Update type
  app.put("/:campId/accommodation-types/:id", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const { id } = request.params as { campId: string; id: string };
    const body = request.body as { translations?: Record<string, { name: string; shortDescription?: string; longDescription?: string }>; capacity?: number; sortOrder?: number };
    return app.prisma.accommodationType.update({
      where: { id },
      data: body,
      include: { prices: true },
    });
  });

  // Delete type
  app.delete("/:campId/accommodation-types/:id", { preHandler: requirePermission("camps_edit") }, async (request, reply) => {
    const { id } = request.params as { campId: string; id: string };
    const inUse = await app.prisma.reservation.findFirst({ where: { accommodationTypeId: id } });
    if (inUse) return reply.status(409).send({ error: "Typ je použit v existujících rezervacích a nelze ho smazat." });
    await app.prisma.accommodationType.delete({ where: { id } });
    return { success: true };
  });

  // Upsert price for type + language
  app.put("/:campId/accommodation-types/:typeId/prices/:langCode", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const { typeId, langCode } = request.params as { campId: string; typeId: string; langCode: string };
    const body = request.body as { pricePerNight: number; adultPricePerNight: number; childPricePerNight: number };
    return app.prisma.accommodationTypePrice.upsert({
      where: { accommodationTypeId_languageCode: { accommodationTypeId: typeId, languageCode: langCode } },
      create: { accommodationTypeId: typeId, languageCode: langCode, ...body },
      update: body,
    });
  });
}
