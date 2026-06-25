import { FastifyInstance } from "fastify";
import { updateCampSchema, createSurchargeSchema } from "@procamp/shared";
import { requirePermission, requireAuth, orgFilter, campFilter } from "../plugins/auth";
import { logActivity, diffObjects } from "../services/activityLog";
import { sendSms } from "../services/gosms";

export async function campRoutes(app: FastifyInstance) {
  // Lightweight endpoint — jen id+name, pro filtry v rezervacích (nevyžaduje camps_view)
  app.get("/for-filter", { preHandler: requirePermission("reservations_view") }, async (request) => {
    const orgId = orgFilter(request);
    const allowedCampIds = campFilter(request);
    return app.prisma.camp.findMany({
      where: {
        ...(orgId ? { organizationId: orgId } : {}),
        ...(allowedCampIds ? { id: { in: allowedCampIds } } : {}),
      },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });
  });

  app.get("/", { preHandler: requirePermission("camps_view") }, async (request) => {
    const orgId = orgFilter(request);
    const allowedCampIds = campFilter(request);
    return app.prisma.camp.findMany({
      where: {
        ...(orgId ? { organizationId: orgId } : {}),
        ...(allowedCampIds ? { id: { in: allowedCampIds } } : {}),
      },
      include: { surcharges: { include: { prices: true }, orderBy: { sortOrder: "asc" } }, accommodationTypes: { include: { prices: true, nightTiers: { include: { prices: true }, orderBy: { fromNight: "asc" } } }, orderBy: { sortOrder: "asc" } }, organization: { select: { id: true, slug: true, goSmsClientId: true } } },
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
      include: { surcharges: { include: { prices: true }, orderBy: { sortOrder: "asc" } }, accommodationTypes: { include: { prices: true, nightTiers: { include: { prices: true }, orderBy: { fromNight: "asc" } } }, orderBy: { sortOrder: "asc" } }, organization: { select: { id: true, slug: true, goSmsClientId: true } } },
    });
  });

  app.post("/", { preHandler: requirePermission("camps_create") }, async (request, reply) => {
    const { name, slug, notificationEmail } = request.body as { name: string; slug: string; notificationEmail: string };
    const orgId = orgFilter(request);
    if (!orgId) return reply.status(400).send({ error: "Nejprve vyberte organizaci." });
    const camp = await app.prisma.camp.create({
      data: { name, slug, notificationEmail: notificationEmail ?? "", ...(orgId ? { organizationId: orgId } : {}) },
      include: { surcharges: { include: { prices: true }, orderBy: { sortOrder: "asc" } }, accommodationTypes: { include: { prices: true, nightTiers: { include: { prices: true }, orderBy: { fromNight: "asc" } } } } },
    });

    await app.prisma.emailTemplate.createMany({
      data: [
        {
          campId: camp.id, type: "ADMIN_NOTIFICATION", languageCode: "cs",
          subject: "Nová rezervace – {{campName}}",
          body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#1e40af;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;color:#ffffff;font-size:20px">🏕️ Nová rezervace</h1>
    <p style="margin:4px 0 0;color:#bfdbfe;font-size:14px">{{campName}}</p>
  </div>
  <div style="background:#f8fafc;padding:24px 32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none">

    <h2 style="margin:0 0 12px;font-size:15px;color:#374151;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Kontaktní údaje</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
      <tr><td style="padding:6px 0;color:#6b7280;width:180px">Jméno a příjmení</td><td style="padding:6px 0;font-weight:600">{{firstName}} {{lastName}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">E-mail</td><td style="padding:6px 8px"><a href="mailto:{{email}}" style="color:#1e40af">{{email}}</a></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Telefon</td><td style="padding:6px 0">{{phone}}</td></tr>
    </table>

    <h2 style="margin:0 0 12px;font-size:15px;color:#374151;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Rezervace</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
      <tr><td style="padding:6px 0;color:#6b7280;width:180px">Rezervace ubytování</td><td style="padding:6px 0;font-weight:600">{{accommodationType}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">Příjezd</td><td style="padding:6px 8px;font-weight:600">{{checkIn}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Odjezd</td><td style="padding:6px 0;font-weight:600">{{checkOut}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">Počet nocí</td><td style="padding:6px 8px">{{nights}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Dospělí / Děti</td><td style="padding:6px 0">{{adults}} / {{children}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">SPZ</td><td style="padding:6px 8px">{{licensePlate}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Předpokl. příjezd</td><td style="padding:6px 0">{{expectedArrival}}</td></tr>
    </table>

    <h2 style="margin:0 0 12px;font-size:15px;color:#374151;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Cena a poznámka</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
      <tr style="background:#dbeafe"><td style="padding:10px 8px;color:#1e40af;font-weight:700;font-size:15px;width:180px">Celková cena</td><td style="padding:10px 8px;font-weight:700;font-size:15px;color:#1e40af">{{totalPrice}} Kč</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Poznámka zákazníka</td><td style="padding:6px 0">{{note}}</td></tr>
    </table>

    <p style="margin:0;font-size:12px;color:#9ca3af;border-top:1px solid #e2e8f0;padding-top:12px">ID rezervace: {{reservationId}}</p>
  </div>
</div>`,
        },
        {
          campId: camp.id, type: "CUSTOMER_CONFIRMATION", languageCode: "cs",
          subject: "Potvrzení rezervace – {{campName}}",
          body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#1e40af;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;color:#ffffff;font-size:20px">🏕️ Rezervace přijata</h1>
    <p style="margin:4px 0 0;color:#bfdbfe;font-size:14px">{{campName}}</p>
  </div>
  <div style="background:#f8fafc;padding:24px 32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;border-top:none">

    <p style="font-size:15px;margin:0 0 24px">Dobrý den, <strong>{{firstName}}</strong>,<br>děkujeme za vaši rezervaci. Níže najdete shrnutí.</p>

    <h2 style="margin:0 0 12px;font-size:15px;color:#374151;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Vaše rezervace</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
      <tr><td style="padding:6px 0;color:#6b7280;width:180px">Rezervace ubytování</td><td style="padding:6px 0;font-weight:600">{{accommodationType}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">Příjezd</td><td style="padding:6px 8px;font-weight:600">{{checkIn}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Odjezd</td><td style="padding:6px 0;font-weight:600">{{checkOut}}</td></tr>
      <tr style="background:#f1f5f9"><td style="padding:6px 8px;color:#6b7280">Počet nocí</td><td style="padding:6px 8px">{{nights}}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Dospělí / Děti</td><td style="padding:6px 0">{{adults}} / {{children}}</td></tr>
    </table>

    <h2 style="margin:0 0 12px;font-size:15px;color:#374151;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Cena</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
      <tr style="background:#dbeafe"><td style="padding:10px 8px;color:#1e40af;font-weight:700;font-size:15px;width:180px">Celková cena</td><td style="padding:10px 8px;font-weight:700;font-size:15px;color:#1e40af">{{totalPrice}} Kč</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px" colspan="2">Platba probíhá na místě při příjezdu.</td></tr>
    </table>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#15803d">✅ Těšíme se na vás! Máte-li jakékoliv dotazy, stačí na tento e-mail odpovědět.</p>
    </div>

    <p style="margin:0;font-size:12px;color:#9ca3af;border-top:1px solid #e2e8f0;padding-top:12px">ID rezervace: {{reservationId}}</p>
  </div>
</div>`,
        },
      ],
    });

    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "CREATE", entity: "camp", entityId: camp.id, payload: { name: camp.name, slug: camp.slug, organizationId: camp.organizationId } });
    return reply.status(201).send(camp);
  });

  app.put("/:id", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const { id } = request.params as { id: string };
    const before = await app.prisma.camp.findUnique({ where: { id }, select: { name: true, slug: true, notificationEmail: true, smtpHost: true, smtpPort: true, smtpUser: true, smtpFrom: true, smtpReplyTo: true, requiresConfirmation: true, useCustomSmtp: true, hideAdults: true, hideChildren: true, info: true, smsNotifyCustomer: true, smsNotifyAdmin: true, smsAdminPhones: true, smsTemplates: true } });
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
      include: { surcharges: { include: { prices: true }, orderBy: { sortOrder: "asc" } }, accommodationTypes: { include: { prices: true, nightTiers: { include: { prices: true }, orderBy: { fromNight: "asc" } } }, orderBy: { sortOrder: "asc" } }, organization: { select: { id: true, slug: true, goSmsClientId: true } } },
    });
    if (before) {
      const afterSnap = { name: camp.name, slug: camp.slug, notificationEmail: camp.notificationEmail, smtpHost: camp.smtpHost, smtpPort: camp.smtpPort, smtpUser: camp.smtpUser, smtpFrom: camp.smtpFrom, smtpReplyTo: camp.smtpReplyTo, requiresConfirmation: camp.requiresConfirmation, useCustomSmtp: camp.useCustomSmtp, hideAdults: camp.hideAdults, hideChildren: camp.hideChildren, info: camp.info, smsNotifyCustomer: camp.smsNotifyCustomer, smsNotifyAdmin: camp.smsNotifyAdmin, smsAdminPhones: camp.smsAdminPhones, smsTemplates: camp.smsTemplates };
      const diff = diffObjects(before as Record<string, unknown>, afterSnap as Record<string, unknown>);
      await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "UPDATE", entity: "camp", entityId: id, payload: diff });
    }
    return camp;
  });

  app.post("/:id/test-smtp", { preHandler: requirePermission("camps_edit") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { host?: string; port?: number; user?: string; password?: string; from?: string };
    const camp = await app.prisma.camp.findUnique({ where: { id } });
    if (!camp) return reply.status(404).send({ error: "Objekt nenalezen" });

    const host = body.host || camp.smtpHost;
    const port = body.port || camp.smtpPort;
    const user = body.user || camp.smtpUser;
    const pass = body.password || camp.smtpPasswordEncrypted;

    if (!host || !user || !pass) return reply.status(400).send({ error: "SMTP není nakonfigurováno" });

    try {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.default.createTransport({ host, port, auth: { user, pass } } as any);
      await transport.verify();
      return { success: true, message: "Připojení k SMTP serveru bylo úspěšné." };
    } catch (err: unknown) {
      return reply.status(400).send({ error: "Připojení selhalo: " + String(err) });
    }
  });

  app.post("/:id/test-sms", { preHandler: requirePermission("camps_edit") }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { phone, lang } = request.body as { phone?: string; lang?: string };
    if (!phone) return reply.status(400).send({ error: "Telefon je povinný." });
    if (!/^\+[1-9]\d{6,14}$/.test(phone)) return reply.status(400).send({ error: "Neplatný formát čísla (+420…)." });

    const camp = await app.prisma.camp.findUnique({
      where: { id },
      select: { smsTemplates: true, organizationId: true },
    });
    if (!camp) return reply.status(404).send({ error: "Objekt nenalezen." });
    if (!camp.organizationId) return reply.status(400).send({ error: "Objekt nemá organizaci." });

    const org = await app.prisma.organization.findUnique({
      where: { id: camp.organizationId },
      select: { goSmsClientId: true, goSmsClientSecret: true, goSmsChannelId: true },
    });
    if (!org?.goSmsClientId || !org.goSmsClientSecret || !org.goSmsChannelId) {
      return reply.status(400).send({ error: "GoSMS není nakonfigurováno v nastavení organizace." });
    }

    const templates = (camp.smsTemplates ?? {}) as Record<string, string>;
    const rawMessage = (lang && templates[lang]) || templates[Object.keys(templates)[0]] || "Vaše rezervace byla potvrzena.";
    const message = rawMessage
      .replace(/\{bookingCode\}/g, "ABC123")
      .replace(/\{fullName\}/g, "Petr Novak")
      .replace(/\{firstName\}/g, "Petr")
      .replace(/\{lastName\}/g, "Novak");
    try {
      const result = await sendSms(
        app.prisma,
        camp.organizationId,
        org.goSmsClientId,
        org.goSmsClientSecret,
        org.goSmsChannelId,
        phone,
        message,
        { userEmail: request.user.email, ip: request.ip },
      );
      await logActivity(app.prisma, {
        userId: request.user.sub,
        userEmail: request.user.email,
        ip: request.ip,
        action: "SMS_TEST_SEND",
        entity: "camp",
        entityId: id,
        payload: { test: true, phone, message, response: result },
      });
      return { ok: true, response: result };
    } catch (err: unknown) {
      return reply.status(502).send({ error: "Odeslání selhalo: " + (err as Error).message });
    }
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
    return app.prisma.surcharge.findMany({ where: { campId }, include: { prices: true }, orderBy: { sortOrder: "asc" } });
  });

  app.post("/:campId/surcharges", { preHandler: requirePermission("camps_edit") }, async (request, reply) => {
    const { campId } = request.params as { campId: string };
    const { isOptional, isHidden, translations, applicableTypeIds } = request.body as { isOptional?: boolean; isHidden?: boolean; translations: Record<string, { name: string; note?: string }>; applicableTypeIds?: string[] };
    const s = await app.prisma.surcharge.create({
      data: { campId, isOptional: isOptional ?? true, isHidden: isHidden ?? false, translations, applicableTypeIds: applicableTypeIds ?? [] },
      include: { prices: true },
    });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "CREATE", entity: "surcharge", entityId: s.id, payload: { campId, translations } });
    return reply.status(201).send(s);
  });

  app.put("/:campId/surcharges/reorder", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const body = request.body as { order: string[] };
    await Promise.all(body.order.map((id, index) =>
      app.prisma.surcharge.update({ where: { id }, data: { sortOrder: index } })
    ));
    return { success: true };
  });

  app.put("/:campId/surcharges/:id", { preHandler: requirePermission("camps_edit") }, async (request) => {
    const { id } = request.params as { campId: string; id: string };
    const { isOptional, isHidden, translations, applicableTypeIds } = request.body as { isOptional?: boolean; isHidden?: boolean; translations: Record<string, { name: string; note?: string }>; applicableTypeIds?: string[] };
const s = await app.prisma.surcharge.update({ where: { id }, data: { isOptional, ...(isHidden !== undefined ? { isHidden } : {}), translations, ...(applicableTypeIds !== undefined ? { applicableTypeIds } : {}) }, include: { prices: true } });
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
