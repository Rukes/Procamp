import { FastifyInstance } from "fastify";
import { requireSuperAdmin, requireAuth } from "../plugins/auth";

export async function organizationRoutes(app: FastifyInstance) {
  // Vlastní organizace přihlášeného uživatele (pro org_admin)
  app.get("/mine", { preHandler: requireAuth }, async (request, reply) => {
    const { organizationId } = request.user;
    if (!organizationId) return reply.status(404).send({ error: "Nemáte přiřazenou organizaci." });
    return app.prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
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
    return app.prisma.organization.update({ where: { id: organizationId }, data: body });
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
    // Automaticky vytvoř výchozí jazyk (čeština) pro novou organizaci
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
    return reply.status(201).send(org);
  });

  app.put("/:id", { preHandler: requireSuperAdmin() }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string; slug?: string; billingName?: string; country?: string; ico?: string; dic?: string;
      address?: string; contactPerson?: string; billingEmail?: string;
      termsText?: string; requireTermsAcceptance?: boolean; defaultLanguageCode?: string; thousandsSeparator?: string; decimalSeparator?: string;
    };
    return app.prisma.organization.update({ where: { id }, data: body });
  });

  app.delete("/:id", { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await app.prisma.organization.delete({ where: { id } });
    return reply.status(204).send();
  });
}
