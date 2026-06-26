import { FastifyInstance } from "fastify";
import { requireAuth, requirePermission } from "../plugins/auth";

export async function accommodationTypeRoutes(app: FastifyInstance) {
  // List types for a camp
  app.get("/:campId/accommodation-types", { preHandler: requireAuth }, async (request) => {
    const { campId } = request.params as { campId: string };
    return app.prisma.accommodationType.findMany({
      where: { campId },
      include: { prices: true, nightTiers: { include: { prices: true }, orderBy: { fromNight: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
  });

  // Create type
  app.post("/:campId/accommodation-types", { preHandler: requirePermission("camps_edit") }, async (request, reply) => {
    const { campId } = request.params as { campId: string };
    const body = request.body as { translations: Record<string, { name: string; shortDescription?: string; longDescription?: string }>; capacity: number; maxAdults?: number | null; maxChildren?: number | null; sortOrder?: number };
    const type = await app.prisma.accommodationType.create({
      data: { campId, translations: body.translations, capacity: body.capacity, maxAdults: body.maxAdults ?? null, maxChildren: body.maxChildren ?? null, sortOrder: body.sortOrder ?? 0 },
      include: { prices: true, nightTiers: { include: { prices: true }, orderBy: { fromNight: "asc" } } },
    });
    return reply.status(201).send(type);
  });

  // Update type
  app.put("/:campId/accommodation-types/:id", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const { id } = request.params as { campId: string; id: string };
    const body = request.body as { translations?: Record<string, { name: string; shortDescription?: string; longDescription?: string }>; capacity?: number; maxAdults?: number | null; maxChildren?: number | null; sortOrder?: number };
    return app.prisma.accommodationType.update({
      where: { id },
      data: body,
      include: { prices: true, nightTiers: { include: { prices: true }, orderBy: { fromNight: "asc" } } },
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

  // Reorder types
  app.put("/:campId/accommodation-types/reorder", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const body = request.body as { order: string[] };
    await Promise.all(body.order.map((id, index) =>
      app.prisma.accommodationType.update({ where: { id }, data: { sortOrder: index } })
    ));
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

  // Toggle dynamic pricing + save tier definitions (fromNight values)
  app.put("/:campId/accommodation-types/:typeId/night-tiers", { preHandler: requirePermission("camps_edit") }, async (request, reply) => {
    const { typeId } = request.params as { campId: string; typeId: string };
    const body = request.body as { useDynamicPricing: boolean; fromNights: number[] };

    // Validate: must start with 1, no gaps, no duplicates
    if (body.useDynamicPricing) {
      if (!body.fromNights.length) return reply.status(400).send({ error: "Musí být alespoň jedna hladina." });
      const sorted = [...body.fromNights].sort((a, b) => a - b);
      if (sorted[0] !== 1) return reply.status(400).send({ error: "První hladina musí začínat od 1 noci." });
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] <= sorted[i - 1]) return reply.status(400).send({ error: "Hladiny musí být unikátní a vzestupné." });
      }
    }

    await app.prisma.$transaction(async (tx) => {
      await tx.accommodationType.update({ where: { id: typeId }, data: { useDynamicPricing: body.useDynamicPricing } });
      if (!body.useDynamicPricing) return;

      // Remove tiers not in new list
      const existing = await tx.nightTier.findMany({ where: { accommodationTypeId: typeId } });
      const toDelete = existing.filter((t) => !body.fromNights.includes(t.fromNight));
      if (toDelete.length) await tx.nightTier.deleteMany({ where: { id: { in: toDelete.map((t) => t.id) } } });

      // Create new tiers
      for (const fromNight of body.fromNights) {
        await tx.nightTier.upsert({
          where: { accommodationTypeId_fromNight: { accommodationTypeId: typeId, fromNight } },
          create: { accommodationTypeId: typeId, fromNight },
          update: {},
        });
      }
    });

    return app.prisma.accommodationType.findUnique({
      where: { id: typeId },
      include: { prices: true, nightTiers: { include: { prices: true }, orderBy: { fromNight: "asc" } } },
    });
  });

  // Upsert night tier prices for a language
  app.put("/:campId/accommodation-types/:typeId/night-tiers/:tierId/prices/:langCode", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const { tierId, langCode } = request.params as { campId: string; typeId: string; tierId: string; langCode: string };
    const { pricePerNight } = request.body as { pricePerNight: number };
    return app.prisma.nightTierPrice.upsert({
      where: { tierId_languageCode: { tierId, languageCode: langCode } },
      create: { tierId, languageCode: langCode, pricePerNight },
      update: { pricePerNight },
    });
  });
}
