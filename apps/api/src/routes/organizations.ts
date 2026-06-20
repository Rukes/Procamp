import { FastifyInstance } from "fastify";
import { requireSuperAdmin } from "../plugins/auth";

export async function organizationRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requireSuperAdmin() }, async () => {
    return app.prisma.organization.findMany({
      include: { _count: { select: { camps: true, users: true } } },
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
      name: string; slug: string; country?: string; ico?: string; dic?: string;
      address?: string; contactPerson?: string; billingEmail?: string;
    };
    const org = await app.prisma.organization.create({
      data: {
        name: body.name,
        slug: body.slug,
        country: body.country ?? "",
        ico: body.ico ?? "",
        dic: body.dic ?? "",
        address: body.address ?? "",
        contactPerson: body.contactPerson ?? "",
        billingEmail: body.billingEmail ?? "",
      },
    });
    return reply.status(201).send(org);
  });

  app.put("/:id", { preHandler: requireSuperAdmin() }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string; slug?: string; country?: string; ico?: string; dic?: string;
      address?: string; contactPerson?: string; billingEmail?: string;
      termsText?: string; defaultLanguageCode?: string; thousandsSeparator?: string; decimalSeparator?: string;
    };
    return app.prisma.organization.update({ where: { id }, data: body });
  });

  app.delete("/:id", { preHandler: requireSuperAdmin() }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await app.prisma.organization.delete({ where: { id } });
    return reply.status(204).send();
  });
}
