import { FastifyInstance } from "fastify";
import { createReservationSchema, getEffectivePricePerNight } from "@procamp/shared";
import { verifyCaptcha } from "../../plugins/auth";
import { checkAvailability, getOccupiedDates } from "../../services/availability";
import { sendReservationEmails } from "../../services/email";
import { logActivity } from "../../services/activityLog";
import { sendReservationSms } from "../../services/gosms";
import { generateUniqueBookingCode } from "../../utils/bookingCode";

export async function publicFormRoutes(app: FastifyInstance) {
  // Get camp public data (for form) — /:orgSlug/:campSlug
  app.get("/camp/:orgSlug/:campSlug", async (request, reply) => {
    const { orgSlug, campSlug } = request.params as { orgSlug: string; campSlug: string };
    const { lang = "cs" } = request.query as { lang?: string };

    const org = await app.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) return reply.status(404).send({ error: "Organization not found" });

    const camp = await app.prisma.camp.findUnique({
      where: { organizationId_slug: { organizationId: org.id, slug: campSlug } },
      include: {
        surcharges: { include: { prices: true }, orderBy: { sortOrder: "asc" } },
        accommodationTypes: { include: { prices: true, nightTiers: { include: { prices: true }, orderBy: { fromNight: "asc" } } }, orderBy: { sortOrder: "asc" } },
        organization: { select: { termsText: true, requireTermsAcceptance: true, gaTrackingId: true, hideCopyright: true } },
      },
    });
    if (!camp) return reply.status(404).send({ error: "Camp not found" });

    const languages = await app.prisma.language.findMany({
      where: camp.organizationId ? { organizationId: camp.organizationId } : {},
      orderBy: { isDefault: "desc" },
    });

    const { smtpPasswordEncrypted, smtpHost, smtpPort, smtpUser, smtpFrom, notificationEmail, organization, ...publicCamp } = camp;
    const termsText = organization?.termsText ?? "";
    const requireTermsAcceptance = organization?.requireTermsAcceptance ?? false;
    const gaTrackingId = organization?.gaTrackingId ?? null;
    const hideCopyright = organization?.hideCopyright ?? false;

    // Return accommodation types with translated name and lang-specific prices
    const accommodationTypes = camp.accommodationTypes.map((t) => {
      const translations = t.translations as Record<string, { name: string; shortDescription?: string; longDescription?: string }>;
      const tr = translations[lang] ?? translations["cs"] ?? {};
      const name = tr.name ?? "";
      const price = t.prices.find((p) => p.languageCode === lang) ?? t.prices[0];
      const nightTiers = t.useDynamicPricing
        ? t.nightTiers.map((tier) => {
            const tp = tier.prices.find((p) => p.languageCode === lang) ?? tier.prices[0];
            return { fromNight: tier.fromNight, pricePerNight: tp?.pricePerNight ?? 0 };
          })
        : [];
      return {
        id: t.id,
        name,
        capacity: t.capacity === -1 ? 999 : t.capacity,
        sortOrder: t.sortOrder,
        shortDescription: tr.shortDescription ?? null,
        longDescription: tr.longDescription ?? null,
        pricePerNight: price?.pricePerNight ?? 0,
        adultPricePerNight: price?.adultPricePerNight ?? 0,
        childPricePerNight: price?.childPricePerNight ?? 0,
        useDynamicPricing: t.useDynamicPricing,
        nightTiers,
        maxAdults: t.maxAdults ?? null,
        maxChildren: t.maxChildren ?? null,
      };
    });

    const surcharges = camp.surcharges.flatMap((s) => {
      if (s.isHidden) return [];
      const translations = s.translations as Record<string, { name: string; note?: string }>;
      const tr = translations[lang] ?? translations["cs"] ?? {};
      const name = tr.name ?? "";
      const price = s.prices.find((p) => p.languageCode === lang) ?? s.prices[0];
      return [{ id: s.id, name, pricePerNight: price?.pricePerNight ?? 0, isOptional: s.isOptional, note: tr.note ?? null, applicableTypeIds: s.applicableTypeIds ?? [] }];
    });

    return { camp: { ...publicCamp, accommodationTypes, surcharges }, languages, currentLang: lang, termsText, requireTermsAcceptance, gaTrackingId, hideCopyright };
  });

  // Get occupied dates for an accommodation type
  app.get("/camp/:orgSlug/:campSlug/occupied", async (request, reply) => {
    const { orgSlug, campSlug } = request.params as { orgSlug: string; campSlug: string };
    const { typeId } = request.query as { typeId?: string };
    if (!typeId) return reply.status(400).send({ error: "typeId required" });

    const org = await app.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) return reply.status(404).send({ error: "Organization not found" });

    const camp = await app.prisma.camp.findUnique({ where: { organizationId_slug: { organizationId: org.id, slug: campSlug } } });
    if (!camp) return reply.status(404).send({ error: "Camp not found" });

    const dates = await getOccupiedDates(app.prisma, camp.id, typeId);
    return { occupied: dates };
  });

  // Submit reservation
  app.post("/camp/:orgSlug/:campSlug/reserve", { config: { rateLimit: { max: 10, timeWindow: "10 minutes" } } }, async (request, reply) => {
    const { orgSlug, campSlug } = request.params as { orgSlug: string; campSlug: string };

    const org = await app.prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) return reply.status(404).send({ error: "Organization not found" });

    const camp = await app.prisma.camp.findUnique({
      where: { organizationId_slug: { organizationId: org.id, slug: campSlug } },
      include: {
        surcharges: { include: { prices: true }, orderBy: { sortOrder: "asc" } },
        accommodationTypes: { include: { prices: true, nightTiers: { include: { prices: true }, orderBy: { fromNight: "asc" } } } },
      },
    });
    if (!camp) return reply.status(404).send({ error: "Camp not found" });
    // Ensure SMS fields are present (they have defaults so always exist)

    const captchaOk = await verifyCaptcha((request.body as { captchaToken?: string }).captchaToken);
    if (!captchaOk) return reply.status(400).send({ error: "Captcha verification failed" });

    const body = createReservationSchema.parse(request.body);
    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);

    if (checkOut <= checkIn) return reply.status(400).send({ error: "checkOut must be after checkIn" });

    const accommodationType = camp.accommodationTypes.find((t) => t.id === body.accommodationTypeId);
    if (!accommodationType) return reply.status(400).send({ error: "Invalid accommodation type" });

    const { available } = await checkAvailability(app.prisma, camp.id, body.accommodationTypeId, checkIn, checkOut);
    if (!available) return reply.status(409).send({ error: "no_availability" });

    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
    const langPrice = accommodationType.prices.find((p) => p.languageCode === body.languageCode) ?? accommodationType.prices[0];
    const pricePerNight = getEffectivePricePerNight(accommodationType as never, body.languageCode, nights);
    const adultPrice = langPrice?.adultPricePerNight ?? 0;
    const childPrice = langPrice?.childPricePerNight ?? 0;
    const personsPrice = body.adults * adultPrice + body.children * childPrice;

    const selectedSurcharges = camp.surcharges.filter((s) => body.selectedSurchargeIds.includes(s.id));
    const surchargesPrice = selectedSurcharges.reduce((sum, s) => {
      const p = s.prices.find((p) => p.languageCode === body.languageCode) ?? s.prices[0];
      return sum + (p?.pricePerNight ?? 0);
    }, 0);
    const totalPrice = (pricePerNight + personsPrice + surchargesPrice) * nights;

    const bookingCode = await generateUniqueBookingCode(app.prisma);
    const reservation = await app.prisma.reservation.create({
      data: {
        bookingCode,
        campId: camp.id,
        accommodationTypeId: body.accommodationTypeId,
        checkIn, checkOut,
        adults: body.adults,
        children: body.children,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        licensePlate: body.licensePlate,
        expectedArrival: body.expectedArrival,
        note: body.note,
        totalPrice,
        status: camp.requiresConfirmation ? "PENDING" : "CONFIRMED",
        languageCode: body.languageCode,
        surcharges: {
          create: selectedSurcharges.map((s) => {
            const p = s.prices.find((p) => p.languageCode === body.languageCode) ?? s.prices[0];
            return { surchargeId: s.id, priceSnapshot: p?.pricePerNight ?? 0 };
          }),
        },
      },
      include: { camp: true, accommodationType: true, surcharges: { include: { surcharge: true } } },
    });

    sendReservationEmails(app.prisma, reservation as never, nights).catch((err) =>
      app.log.error({ err }, "Failed to send reservation emails"),
    );
    if (!camp.requiresConfirmation) {
      sendReservationSms(app.prisma, reservation, camp as never, {}).catch(() => {});
    }

    await logActivity(app.prisma, {
      userEmail: `${body.firstName} ${body.lastName} <${body.email}>`,
      ip: request.ip,
      action: "CREATE",
      entity: "reservation",
      entityId: reservation.id,
      payload: { firstName: body.firstName, lastName: body.lastName, email: body.email, phone: body.phone, checkIn: body.checkIn, checkOut: body.checkOut, totalPrice, pricePerNight, source: "form" },
    });

    return reply.status(201).send({
      id: reservation.id,
      totalPrice: reservation.totalPrice,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      nights,
      bookingCode: reservation.bookingCode,
      status: reservation.status,
    });
  });
}
