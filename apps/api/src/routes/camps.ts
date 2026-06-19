import { FastifyInstance } from "fastify";
import { updateCampSchema, createSurchargeSchema } from "@procamp/shared";
import { requirePermission, requireAuth } from "../plugins/auth";

export async function campRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requirePermission("camps_view") }, async () => {
    return app.prisma.camp.findMany({
      include: { surcharges: true },
      orderBy: { createdAt: "asc" },
    });
  });

  app.get("/:id", { preHandler: requirePermission("camps_view") }, async (request) => {
    const { id } = request.params as { id: string };
    return app.prisma.camp.findUniqueOrThrow({ where: { id }, include: { surcharges: true } });
  });

  app.post("/", { preHandler: requirePermission("camps_create") }, async (request, reply) => {
    const { name, slug } = request.body as { name: string; slug: string };
    const camp = await app.prisma.camp.create({
      data: { name, slug, notificationEmail: "" },
      include: { surcharges: true },
    });

    // Create default email templates in Czech
    await app.prisma.emailTemplate.createMany({
      data: [
        {
          campId: camp.id, type: "ADMIN_NOTIFICATION", languageCode: "cs",
          subject: "Nová rezervace – {{campName}}",
          body: `<h2>Nová rezervace</h2>
<p><strong>Jméno:</strong> {{firstName}} {{lastName}}</p>
<p><strong>E-mail:</strong> {{email}}</p>
<p><strong>Telefon:</strong> {{phone}}</p>
<p><strong>Typ:</strong> {{accommodationType}}</p>
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

    return reply.status(201).send(camp);
  });

  app.put("/:id", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const { id } = request.params as { id: string };
    const body = updateCampSchema.parse(request.body);
    const data: Record<string, unknown> = { ...body };
    if (body.smtpPassword) {
      data.smtpPasswordEncrypted = body.smtpPassword;
      delete data.smtpPassword;
    } else {
      delete data.smtpPassword;
    }
    return app.prisma.camp.update({ where: { id }, data, include: { surcharges: true } });
  });

  app.delete("/:id", { preHandler: requirePermission("camps_delete") }, async (request) => {
    const { id } = request.params as { id: string };
    await app.prisma.camp.delete({ where: { id } });
    return { success: true };
  });

  // Surcharges
  app.get("/:campId/surcharges", { preHandler: requireAuth }, async (request) => {
    const { campId } = request.params as { campId: string };
    return app.prisma.surcharge.findMany({ where: { campId } });
  });

  app.post("/:campId/surcharges", { preHandler: requirePermission("camps_edit") }, async (request, reply) => {
    const { campId } = request.params as { campId: string };
    const body = createSurchargeSchema.parse(request.body);
    const s = await app.prisma.surcharge.create({ data: { campId, ...body } });
    return reply.status(201).send(s);
  });

  app.put("/:campId/surcharges/:id", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const { id } = request.params as { campId: string; id: string };
    const body = createSurchargeSchema.parse(request.body);
    return app.prisma.surcharge.update({ where: { id }, data: body });
  });

  app.delete("/:campId/surcharges/:id", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const { id } = request.params as { campId: string; id: string };
    await app.prisma.surcharge.delete({ where: { id } });
    return { success: true };
  });
}
