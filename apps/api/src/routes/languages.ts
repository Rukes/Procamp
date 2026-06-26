import { FastifyInstance } from "fastify";
import { requirePermission, requireAuth, orgFilter } from "../plugins/auth";
import { logActivity } from "../services/activityLog";

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
          accommodationTypes: { include: { prices: { where: { languageCode: defaultLang.code } }, nightTiers: { include: { prices: { where: { languageCode: defaultLang.code } } } } } },
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
              data: { translations: { ...srcTranslations, [code]: { ...defaultTrans } } as object },
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
          // Night tiers — ceny per hladina
          for (const tier of at.nightTiers ?? []) {
            const srcTierPrice = tier.prices[0];
            if (srcTierPrice) {
              await app.prisma.nightTierPrice.upsert({
                where: { tierId_languageCode: { tierId: tier.id, languageCode: code } },
                create: { tierId: tier.id, languageCode: code, pricePerNight: Math.round(srcTierPrice.pricePerNight * coeff) },
                update: {},
              });
            }
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
              data: { translations: { ...srcTranslations, [code]: { ...defaultTrans } } as object },
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

    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "CREATE", entity: "Jazyk", entityId: lang.id, payload: { code, name } });
    return reply.status(201).send({ lang, copied: { types: copiedTypes, surcharges: copiedSurcharges, templates: copiedTemplates } });
  });

  app.put("/:id", { preHandler: requirePermission("org_admin") }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; currencyCode?: string; currencySymbol?: string; currencyPosition?: string };
    const lang = await app.prisma.language.update({ where: { id }, data: body });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "UPDATE", entity: "Jazyk", entityId: id, payload: body });
    return lang;
  });

  app.delete("/:id", { preHandler: requirePermission("org_admin") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const lang = await app.prisma.language.findUniqueOrThrow({ where: { id } });
    if (lang.isDefault) return reply.status(400).send({ error: "Cannot delete default language" });
    await app.prisma.language.delete({ where: { id } });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "DELETE", entity: "Jazyk", entityId: id, payload: { code: lang.code, name: lang.name } });
    return { success: true };
  });
}
