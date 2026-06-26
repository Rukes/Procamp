import { FastifyInstance } from "fastify";
import { requireSuperAdmin, requireAuth } from "../plugins/auth";
import { logActivity, diffObjects } from "../services/activityLog";
import { getGoSmsCredit } from "../services/gosms";

export async function organizationRoutes(app: FastifyInstance) {
  // Vlastní organizace přihlášeného uživatele (pro org_admin)
  const ORG_PUBLIC_SELECT = {
    id: true, name: true, slug: true, billingName: true, country: true, ico: true, dic: true,
    address: true, contactPerson: true, billingEmail: true, termsText: true, requireTermsAcceptance: true,
    defaultLanguageCode: true, thousandsSeparator: true, decimalSeparator: true, gaTrackingId: true,
    goSmsClientId: true, goSmsClientSecret: true, goSmsChannelId: true, bookingEnabled: true,
    createdAt: true, updatedAt: true,
  };

  app.get("/mine", { preHandler: requireAuth }, async (request, reply) => {
    const { organizationId } = request.user;
    if (!organizationId) return reply.status(404).send({ error: "Nemáte přiřazenou organizaci." });
    return app.prisma.organization.findUniqueOrThrow({ where: { id: organizationId }, select: ORG_PUBLIC_SELECT });
  });

  app.put("/mine", { preHandler: requireAuth }, async (request, reply) => {
    const { organizationId, permissions } = request.user;
    if (!organizationId) return reply.status(404).send({ error: "Nemáte přiřazenou organizaci." });
    if (!permissions?.org_admin) return reply.status(403).send({ error: "Forbidden" });
    const body = request.body as {
      name?: string; billingName?: string; country?: string; ico?: string; dic?: string;
      address?: string; contactPerson?: string; billingEmail?: string;
      termsText?: string; defaultLanguageCode?: string; thousandsSeparator?: string; decimalSeparator?: string; gaTrackingId?: string;
    };
    const before = await app.prisma.organization.findUnique({ where: { id: organizationId } });
    const org = await app.prisma.organization.update({ where: { id: organizationId }, data: body, select: ORG_PUBLIC_SELECT });
    if (before) {
      const diff = diffObjects(before as Record<string, unknown>, org as Record<string, unknown>);
      await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "UPDATE", entity: "organization", entityId: organizationId, payload: diff });
    }
    return org;
  });

  app.get("/", { preHandler: requireSuperAdmin() }, async () => {
    return app.prisma.organization.findMany({
      include: { _count: { select: { camps: true, users: true, languages: true } } },
      orderBy: { createdAt: "asc" },
    });
  });

  app.get("/:id", { preHandler: requireSuperAdmin() }, async (request) => {
    const { id } = request.params as { id: string };
    return app.prisma.organization.findUniqueOrThrow({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, permissions: true, reservationsDefaultView: true } },
        camps: { select: { id: true, name: true, slug: true } },
        _count: { select: { camps: true, users: true } },
      },
    });
  });

  app.post("/", { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const body = request.body as {
      name: string; slug: string; billingName?: string; country?: string; ico?: string; dic?: string;
      address?: string; contactPerson?: string; billingEmail?: string;
    };
    const org = await app.prisma.organization.create({
      data: {
        name: body.name,
        slug: body.slug,
        billingName: body.billingName ?? "",
        country: body.country ?? "",
        ico: body.ico ?? "",
        dic: body.dic ?? "",
        address: body.address ?? "",
        contactPerson: body.contactPerson ?? "",
        billingEmail: body.billingEmail ?? "",
      },
    });
    await app.prisma.language.create({
      data: {
        code: "cs",
        name: "Čeština",
        isDefault: true,
        currencyCode: "CZK",
        currencySymbol: "Kč",
        currencyPosition: "after",
        organizationId: org.id,
      },
    });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "CREATE", entity: "organization", entityId: org.id, payload: { name: org.name, slug: org.slug } });
    return reply.status(201).send(org);
  });

  app.put("/:id", { preHandler: requireSuperAdmin() }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const data = {
      name: body.name as string, slug: body.slug as string, billingName: body.billingName as string | undefined,
      country: body.country as string | undefined, ico: body.ico as string | undefined,
      dic: body.dic as string | undefined, address: body.address as string | undefined,
      contactPerson: body.contactPerson as string | undefined, billingEmail: body.billingEmail as string | undefined,
      termsText: body.termsText as string | undefined,
      requireTermsAcceptance: body.requireTermsAcceptance as boolean | undefined,
      defaultLanguageCode: body.defaultLanguageCode as string | undefined,
      thousandsSeparator: body.thousandsSeparator as string | undefined,
      decimalSeparator: body.decimalSeparator as string | undefined,
      internalNote: body.internalNote !== undefined ? (body.internalNote as string) : undefined,
      gaTrackingId: body.gaTrackingId !== undefined ? (body.gaTrackingId as string | null) : undefined,
      goSmsClientId: body.goSmsClientId !== undefined ? (body.goSmsClientId as string) : undefined,
      goSmsClientSecret: body.goSmsClientSecret !== undefined ? (body.goSmsClientSecret as string) : undefined,
      goSmsChannelId: body.goSmsChannelId !== undefined ? (body.goSmsChannelId as number | null) : undefined,
      bookingEnabled: body.bookingEnabled !== undefined ? (body.bookingEnabled as boolean) : undefined,
    };
    const before = await app.prisma.organization.findUnique({ where: { id } });
    const org = await app.prisma.organization.update({ where: { id }, data });
    if (before) {
      const diff = diffObjects(before as Record<string, unknown>, org as Record<string, unknown>);
      await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "UPDATE", entity: "organization", entityId: id, payload: diff });
    }
    return org;
  });

  // GoSMS kredit + kanály — SA nebo org_admin vlastní organizace
  app.get("/:id/gosms-credit", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { isSuperAdmin, organizationId, permissions } = request.user;
    if (!isSuperAdmin && (organizationId !== id || !permissions?.org_admin)) return reply.status(403).send({ error: "Forbidden" });
    const org = await app.prisma.organization.findUnique({ where: { id }, select: { goSmsClientId: true, goSmsClientSecret: true } });
    if (!org?.goSmsClientId || !org.goSmsClientSecret) return reply.status(400).send({ error: "GoSMS není nakonfigurováno." });
    try {
      const data = await getGoSmsCredit(org.goSmsClientId, org.goSmsClientSecret, id);
      return data;
    } catch (err) {
      app.log.error({ err }, "GoSMS credit fetch failed");
      return reply.status(502).send({ error: `Nepodařilo se načíst kredit z GoSMS: ${(err as Error).message}` });
    }
  });

  // GoSMS nastavení pro org_admin
  app.put("/mine/gosms", { preHandler: requireAuth }, async (request, reply) => {
    const { organizationId, permissions } = request.user;
    if (!organizationId) return reply.status(404).send({ error: "Nemáte přiřazenou organizaci." });
    if (!permissions?.org_admin) return reply.status(403).send({ error: "Forbidden" });
    const body = request.body as { goSmsClientId?: string; goSmsClientSecret?: string; goSmsChannelId?: number | null };
    const beforeGoSms = await app.prisma.organization.findUnique({ where: { id: organizationId }, select: { goSmsClientId: true, goSmsChannelId: true } });
    await app.prisma.organization.update({
      where: { id: organizationId },
      data: { goSmsClientId: body.goSmsClientId, goSmsClientSecret: body.goSmsClientSecret, goSmsChannelId: body.goSmsChannelId },
    });
    const diff = diffObjects(
      { goSmsClientId: beforeGoSms?.goSmsClientId, goSmsChannelId: beforeGoSms?.goSmsChannelId },
      { goSmsClientId: body.goSmsClientId, goSmsChannelId: body.goSmsChannelId },
    );
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "UPDATE", entity: "organization", entityId: organizationId, payload: diff });
    return { ok: true };
  });

  // GoSMS kredit pro vlastní org
  app.get("/mine/gosms-credit", { preHandler: requireAuth }, async (request, reply) => {
    const { organizationId, permissions } = request.user;
    if (!organizationId || !permissions?.org_admin) return reply.status(403).send({ error: "Forbidden" });
    const org = await app.prisma.organization.findUnique({ where: { id: organizationId }, select: { goSmsClientId: true, goSmsClientSecret: true } });
    if (!org?.goSmsClientId || !org.goSmsClientSecret) return reply.status(400).send({ error: "GoSMS není nakonfigurováno." });
    try {
      return await getGoSmsCredit(org.goSmsClientId, org.goSmsClientSecret, organizationId);
    } catch {
      return reply.status(502).send({ error: "Nepodařilo se načíst kredit z GoSMS." });
    }
  });

  app.get("/:id/export", { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const MASKED = "SKRYTO PRO EXPORT";

    const org = await app.prisma.organization.findUnique({
      where: { id },
      select: {
        id: true, name: true, slug: true,
        billingName: true, country: true, ico: true, dic: true, address: true,
        contactPerson: true, billingEmail: true, gaTrackingId: true, internalNote: true,
        defaultLanguageCode: true, thousandsSeparator: true, decimalSeparator: true,
        requireTermsAcceptance: true, createdAt: true,
        goSmsClientId: true, goSmsClientSecret: true, goSmsChannelId: true,
        camps: {
          select: {
            id: true, name: true, slug: true, notificationEmail: true,
            smtpHost: true, smtpPort: true, smtpUser: true, smtpFrom: true, smtpReplyTo: true,
            smtpPasswordEncrypted: true,
            useCustomSmtp: true, requiresConfirmation: true, hideAdults: true, hideChildren: true,
            smsNotifyCustomer: true, smsNotifyAdmin: true, smsAdminPhones: true,
            accommodationTypes: { select: { id: true, translations: true, capacity: true, sortOrder: true, useDynamicPricing: true } },
            surcharges: { select: { id: true, translations: true, isOptional: true, isHidden: true, sortOrder: true } },
            blockedPeriods: {
              where: { dateFrom: { gte: thirtyDaysAgo } },
              select: { id: true, dateFrom: true, dateTo: true, reason: true, internalNote: true, accommodationTypeId: true },
            },
            reservations: {
              where: { createdAt: { gte: thirtyDaysAgo } },
              select: {
                id: true, bookingCode: true, status: true, firstName: true, lastName: true,
                email: true, phone: true, checkIn: true, checkOut: true,
                adults: true, children: true, totalPrice: true, note: true, internalNote: true,
                languageCode: true, createdAt: true, accommodationTypeId: true,
              },
            },
          },
        },
        users: {
          select: { id: true, name: true, email: true, permissions: true, isSuperAdmin: true, createdAt: true },
        },
      },
    });

    if (!org) return reply.status(404).send({ error: "Not found" });

    const masked = {
      ...org,
      goSmsClientId: org.goSmsClientId ? MASKED : null,
      goSmsClientSecret: org.goSmsClientSecret ? MASKED : null,
      camps: org.camps.map((c) => ({
        ...c,
        smtpPasswordEncrypted: c.smtpPasswordEncrypted ? MASKED : null,
      })),
    };

    reply.header("Content-Disposition", `attachment; filename="org-export-${org.slug}-${new Date().toISOString().slice(0, 10)}.json"`);
    reply.header("Content-Type", "application/json");
    return reply.send(JSON.stringify(masked, null, 2));
  });

  app.delete("/:id", { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const org = await app.prisma.organization.findUnique({ where: { id } });
    await app.prisma.organization.delete({ where: { id } });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "DELETE", entity: "organization", entityId: id, payload: org });
    return reply.status(204).send();
  });
}
