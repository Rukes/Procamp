import { FastifyInstance } from "fastify";
import { updateCampSchema, createSurchargeSchema } from "@procamp/shared";
import { requirePermission, requireAuth, orgFilter, campFilter } from "../plugins/auth";
import { logActivity, diffObjects } from "../services/activityLog";

export async function campRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requirePermission("camps_view") }, async (request) => {
    const orgId = orgFilter(request);
    const allowedCampIds = campFilter(request);
    return app.prisma.camp.findMany({
      where: {
        ...(orgId ? { organizationId: orgId } : {}),
        ...(allowedCampIds ? { id: { in: allowedCampIds } } : {}),
      },
      include: { surcharges: { include: { prices: true } }, accommodationTypes: { include: { prices: true }, orderBy: { sortOrder: "asc" } }, organization: { select: { slug: true } } },
      orderBy: { createdAt: "asc" },
    });
  });

  app.get("/:id", { preHandler: requirePermission("camps_view") }, async (request) => {
    const { id } = request.params as { id: string };
    const orgId = orgFilter(request);
    const allowedCampIds = campFilter(request);
    return app.prisma.camp.findFirstOrThrow({
      where: {
        id,
        ...(orgId ? { organizationId: orgId } : {}),
        ...(allowedCampIds ? { id: { in: allowedCampIds } } : {}),
      },
      include: { surcharges: { include: { prices: true } }, accommodationTypes: { include: { prices: true }, orderBy: { sortOrder: "asc" } }, organization: { select: { slug: true } } },
    });
  });

  app.post("/", { preHandler: requirePermission("camps_create") }, async (request, reply) => {
    const { name, slug } = request.body as { name: string; slug: string };
    const orgId = orgFilter(request);
    if (!orgId) return reply.status(400).send({ error: "Nejprve vyberte organizaci." });
    const camp = await app.prisma.camp.create({
      data: { name, slug, notificationEmail: "", ...(orgId ? { organizationId: orgId } : {}) },
      include: { surcharges: { include: { prices: true } }, accommodationTypes: { include: { prices: true } } },
    });

    await app.prisma.emailTemplate.createMany({
      data: [
        {
          campId: camp.id, type: "ADMIN_NOTIFICATION", languageCode: "cs",
          subject: "Nová rezervace – {{campName}}",
          body: `<h2>Nová rezervace</h2>
<p><strong>Jméno:</strong> {{firstName}} {{lastName}}</p>
<p><strong>E-mail:</strong> {{email}}</p>
<p><strong>Telefon:</strong> {{phone}}</p>
<p><strong>Typ ubytování:</strong> {{accommodationType}}</p>
<p><strong>Příjezd:</strong> {{checkIn}}</p>
<p><strong>Odjezd:</strong> {{checkOut}}</p>
<p><strong>Počet nocí:</strong> {{nights}}</p>
<p><strong>Dospělí:</strong> {{adults}}, <strong>Děti:</strong> {{children}}</p>
<p><strong>SPZ:</strong> {{licensePlate}}</p>
<p><strong>Předpokládaný příjezd:</strong> {{expectedArrival}}</p>
<p><strong>Poznámka:</strong> {{note}}</p>
<p><strong>Celková cena:</strong> {{totalPrice}}</p>`,
        },
        {
          campId: camp.id, type: "CUSTOMER_CONFIRMATION", languageCode: "cs",
          subject: "Potvrzení rezervace – {{campName}}",
          body: `<h2>Vaše rezervace byla přijata</h2>
<p>Dobrý den, {{firstName}},</p>
<p>děkujeme za rezervaci v kempu <strong>{{campName}}</strong>.</p>
<p><strong>Typ ubytování:</strong> {{accommodationType}}</p>
<p><strong>Příjezd:</strong> {{checkIn}}</p>
<p><strong>Odjezd:</strong> {{checkOut}}</p>
<p><strong>Počet nocí:</strong> {{nights}}</p>
<p><strong>Celková cena:</strong> {{totalPrice}}</p>
<p>Platba probíhá na místě.</p>
<p>Těšíme se na vás!</p>`,
        },
      ],
    });

    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "CREATE", entity: "camp", entityId: camp.id, payload: { name: camp.name, slug: camp.slug, organizationId: camp.organizationId } });
    return reply.status(201).send(camp);
  });

  app.put("/:id", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const { id } = request.params as { id: string };
    const before = await app.prisma.camp.findUnique({ where: { id }, select: { name: true, slug: true, notificationEmail: true, smtpHost: true, smtpPort: true, smtpUser: true, smtpFrom: true, requiresConfirmation: true } });
    const body = updateCampSchema.parse(request.body);
    const data: Record<string, unknown> = { ...body };
    if (body.smtpPassword) {
      data.smtpPasswordEncrypted = body.smtpPassword;
      delete data.smtpPassword;
    } else {
      delete data.smtpPassword;
    }
    const camp = await app.prisma.camp.update({
      where: { id },
      data,
      include: { surcharges: { include: { prices: true } }, accommodationTypes: { include: { prices: true }, orderBy: { sortOrder: "asc" } } },
    });
    if (before) {
      const afterSnap = { name: camp.name, slug: camp.slug, notificationEmail: camp.notificationEmail, smtpHost: camp.smtpHost, smtpPort: camp.smtpPort, smtpUser: camp.smtpUser, smtpFrom: camp.smtpFrom, requiresConfirmation: camp.requiresConfirmation };
      const diff = diffObjects(before as Record<string, unknown>, afterSnap as Record<string, unknown>);
      await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "UPDATE", entity: "camp", entityId: id, payload: diff });
    }
    return camp;
  });

  app.delete("/:id", { preHandler: requirePermission("camps_delete") }, async (request) => {
    const { id } = request.params as { id: string };
    const camp = await app.prisma.camp.findUnique({ where: { id }, select: { id: true, name: true, slug: true, organizationId: true } });
    await app.prisma.camp.delete({ where: { id } });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "DELETE", entity: "camp", entityId: id, payload: camp });
    return { success: true };
  });

  // Surcharges
  app.get("/:campId/surcharges", { preHandler: requireAuth }, async (request) => {
    const { campId } = request.params as { campId: string };
    return app.prisma.surcharge.findMany({ where: { campId }, include: { prices: true } });
  });

  app.post("/:campId/surcharges", { preHandler: requirePermission("camps_edit") }, async (request, reply) => {
    const { campId } = request.params as { campId: string };
    const { isOptional, translations } = request.body as { isOptional?: boolean; translations: Record<string, { name: string }> };
    const s = await app.prisma.surcharge.create({
      data: { campId, isOptional: isOptional ?? true, translations },
      include: { prices: true },
    });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "CREATE", entity: "surcharge", entityId: s.id, payload: { campId, translations } });
    return reply.status(201).send(s);
  });

  app.put("/:campId/surcharges/:id", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const { id } = request.params as { campId: string; id: string };
    const { isOptional, translations } = request.body as { isOptional?: boolean; translations: Record<string, { name: string }> };
    const s = await app.prisma.surcharge.update({ where: { id }, data: { isOptional, translations }, include: { prices: true } });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "UPDATE", entity: "surcharge", entityId: id, payload: { translations } });
    return s;
  });

  app.put("/:campId/surcharges/:surchargeId/prices/:langCode", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const { surchargeId, langCode } = request.params as { campId: string; surchargeId: string; langCode: string };
    const { pricePerNight } = request.body as { pricePerNight: number };
    return app.prisma.surchargePrice.upsert({
      where: { surchargeId_languageCode: { surchargeId, languageCode: langCode } },
      update: { pricePerNight },
      create: { surchargeId, languageCode: langCode, pricePerNight },
    });
  });

  app.delete("/:campId/surcharges/:id", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const { id } = request.params as { campId: string; id: string };
    const s = await app.prisma.surcharge.findUnique({ where: { id }, include: { prices: true } });
    await app.prisma.surcharge.delete({ where: { id } });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "DELETE", entity: "surcharge", entityId: id, payload: s });
    return { success: true };
  });
}
