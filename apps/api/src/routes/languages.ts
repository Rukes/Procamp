import { FastifyInstance } from "fastify";
import { requirePermission, requireAuth, orgFilter } from "../plugins/auth";

export async function languageRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireAuth }, async (request) => {
    const orgId = orgFilter(request);
    return app.prisma.language.findMany({
      where: orgId ? { organizationId: orgId } : {},
      orderBy: { isDefault: "desc" },
    });
  });

  app.post("/", { preHandler: requirePermission("org_admin") }, async (request, reply) => {
    const { code, name, currencyCode, currencySymbol, currencyPosition, priceCoefficient } = request.body as {
      code: string; name: string; currencyCode?: string; currencySymbol?: string; currencyPosition?: string; priceCoefficient?: number;
    };
    const orgId = orgFilter(request);
    if (!orgId) return reply.status(400).send({ error: "Nejprve vyberte organizaci." });

    // Najdi výchozí jazyk organizace
    const defaultLang = await app.prisma.language.findFirst({ where: { organizationId: orgId, isDefault: true } });

    const lang = await app.prisma.language.create({
      data: {
        code, name,
        ...(currencyCode && { currencyCode }),
        ...(currencySymbol && { currencySymbol }),
        ...(currencyPosition && { currencyPosition }),
        organizationId: orgId,
      },
    });

    const coeff = priceCoefficient ?? 1;
    let copiedTypes = 0, copiedSurcharges = 0, copiedTemplates = 0;

    if (defaultLang) {
      // Načti všechny objekty organizace s typy ubytování a šablonami
      const camps = await app.prisma.camp.findMany({
        where: { organizationId: orgId },
        include: {
          accommodationTypes: { include: { prices: { where: { languageCode: defaultLang.code } } } },
          surcharges: { include: { prices: { where: { languageCode: defaultLang.code } } } },
          emailTemplates: { where: { languageCode: defaultLang.code } },
        },
      });

      for (const camp of camps) {
        // Typy ubytování — překlady + ceny
        for (const at of camp.accommodationTypes) {
          const srcTranslations = at.translations as Record<string, unknown>;
          const defaultTrans = srcTranslations[defaultLang.code] as Record<string, unknown> | undefined;
          if (defaultTrans && !srcTranslations[code]) {
            await app.prisma.accommodationType.update({
              where: { id: at.id },
              data: { translations: { ...srcTranslations, [code]: { ...defaultTrans } } },
            });
          }
          const srcPrice = at.prices[0];
          if (srcPrice) {
            await app.prisma.accommodationTypePrice.upsert({
              where: { accommodationTypeId_languageCode: { accommodationTypeId: at.id, languageCode: code } },
              create: {
                accommodationTypeId: at.id,
                languageCode: code,
                pricePerNight: Math.round(srcPrice.pricePerNight * coeff),
                adultPricePerNight: Math.round(srcPrice.adultPricePerNight * coeff),
                childPricePerNight: Math.round(srcPrice.childPricePerNight * coeff),
              },
              update: {},
            });
          }
          copiedTypes++;
        }

        // Příplatky — překlady + ceny
        for (const sur of camp.surcharges) {
          const srcTranslations = sur.translations as Record<string, unknown>;
          const defaultTrans = srcTranslations[defaultLang.code] as Record<string, unknown> | undefined;
          if (defaultTrans && !srcTranslations[code]) {
            await app.prisma.surcharge.update({
              where: { id: sur.id },
              data: { translations: { ...srcTranslations, [code]: { ...defaultTrans } } },
            });
          }
          const srcPrice = sur.prices[0];
          if (srcPrice) {
            await app.prisma.surchargePrice.upsert({
              where: { surchargeId_languageCode: { surchargeId: sur.id, languageCode: code } },
              create: {
                surchargeId: sur.id,
                languageCode: code,
                pricePerNight: Math.round(srcPrice.pricePerNight * coeff),
              },
              update: {},
            });
          }
          copiedSurcharges++;
        }

        // E-mailové šablony
        for (const tpl of camp.emailTemplates) {
          await app.prisma.emailTemplate.upsert({
            where: { campId_type_languageCode: { campId: camp.id, type: tpl.type, languageCode: code } },
            create: { campId: camp.id, type: tpl.type, languageCode: code, subject: tpl.subject, body: tpl.body },
            update: {},
          });
          copiedTemplates++;
        }
      }
    }

    return reply.status(201).send({ lang, copied: { types: copiedTypes, surcharges: copiedSurcharges, templates: copiedTemplates } });
  });

  app.put("/:id", { preHandler: requirePermission("org_admin") }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; currencyCode?: string; currencySymbol?: string; currencyPosition?: string };
    return app.prisma.language.update({ where: { id }, data: body });
  });

  app.delete("/:id", { preHandler: requirePermission("org_admin") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const lang = await app.prisma.language.findUniqueOrThrow({ where: { id } });
    if (lang.isDefault) return reply.status(400).send({ error: "Cannot delete default language" });
    await app.prisma.language.delete({ where: { id } });
    return { success: true };
  });
}
