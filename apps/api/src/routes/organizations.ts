import { FastifyInstance } from "fastify";
import { requireSuperAdmin, requireAuth } from "../plugins/auth";
import { logActivity, diffObjects } from "../services/activityLog";

export async function organizationRoutes(app: FastifyInstance) {
  // Vlastní organizace přihlášeného uživatele (pro org_admin)
  const ORG_PUBLIC_SELECT = {
    id: true, name: true, slug: true, billingName: true, country: true, ico: true, dic: true,
    address: true, contactPerson: true, billingEmail: true, termsText: true, requireTermsAcceptance: true,
    defaultLanguageCode: true, thousandsSeparator: true, decimalSeparator: true, createdAt: true, updatedAt: true,
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
      termsText?: string; defaultLanguageCode?: string; thousandsSeparator?: string; decimalSeparator?: string;
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
      name: body.name, slug: body.slug, billingName: body.billingName, country: body.country,
      ico: body.ico, dic: body.dic, address: body.address, contactPerson: body.contactPerson,
      billingEmail: body.billingEmail, termsText: body.termsText,
      requireTermsAcceptance: body.requireTermsAcceptance, defaultLanguageCode: body.defaultLanguageCode,
      thousandsSeparator: body.thousandsSeparator, decimalSeparator: body.decimalSeparator,
      internalNote: body.internalNote !== undefined ? (body.internalNote as string) : undefined,
    };
    const before = await app.prisma.organization.findUnique({ where: { id } });
    const org = await app.prisma.organization.update({ where: { id }, data });
    if (before) {
      const diff = diffObjects(before as Record<string, unknown>, org as Record<string, unknown>);
      await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "UPDATE", entity: "organization", entityId: id, payload: diff });
    }
    return org;
  });

  app.delete("/:id", { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const org = await app.prisma.organization.findUnique({ where: { id } });
    await app.prisma.organization.delete({ where: { id } });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "DELETE", entity: "organization", entityId: id, payload: org });
    return reply.status(204).send();
  });
}
