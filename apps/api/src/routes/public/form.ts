import { FastifyInstance } from "fastify";
import { createReservationSchema } from "@procamp/shared";
import { checkAvailability, getOccupiedDates } from "../../services/availability";
import { sendReservationEmails } from "../../services/email";

export async function publicFormRoutes(app: FastifyInstance) {
  // Get camp public data (for form)
  app.get("/camp/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const { lang = "cs" } = request.query as { lang?: string };

    const camp = await app.prisma.camp.findUnique({
      where: { slug },
      include: { surcharges: true },
    });
    if (!camp) return reply.status(404).send({ error: "Camp not found" });

    const languages = await app.prisma.language.findMany({ orderBy: { isDefault: "desc" } });

    // Strip sensitive SMTP data from public response
    const { smtpPasswordEncrypted, smtpHost, smtpPort, smtpUser, smtpFrom, notificationEmail, ...publicCamp } = camp;

    const surcharges = camp.surcharges.map((s) => {
      const translations = s.translations as Record<string, { name: string }>;
      const name = translations[lang]?.name ?? translations["cs"]?.name ?? "";
      return { id: s.id, name, pricePerNight: s.pricePerNight, isOptional: s.isOptional };
    });

    return { camp: { ...publicCamp, surcharges }, languages, currentLang: lang };
  });

  // Get occupied dates
  app.get("/camp/:slug/occupied", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const { type } = request.query as { type: "CARAVAN" | "TENT" };
    if (!type) return reply.status(400).send({ error: "type required" });

    const camp = await app.prisma.camp.findUnique({ where: { slug } });
    if (!camp) return reply.status(404).send({ error: "Camp not found" });

    const dates = await getOccupiedDates(app.prisma, camp.id, type);
    return { occupied: dates };
  });

  // Submit reservation
  app.post("/camp/:slug/reserve", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const camp = await app.prisma.camp.findUnique({ where: { slug }, include: { surcharges: true } });
    if (!camp) return reply.status(404).send({ error: "Camp not found" });

    const body = createReservationSchema.parse(request.body);
    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);

    if (checkOut <= checkIn) return reply.status(400).send({ error: "checkOut must be after checkIn" });

    const { available } = await checkAvailability(app.prisma, camp.id, body.accommodationType, checkIn, checkOut);
    if (!available) return reply.status(409).send({ error: "no_availability" });

    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
    const basePrice = body.accommodationType === "CARAVAN" ? camp.caravanPricePerNight : camp.tentPricePerNight;
    const personsPrice = body.adults * camp.adultPricePerNight + body.children * camp.childPricePerNight;
    const selectedSurcharges = camp.surcharges.filter((s) => body.selectedSurchargeIds.includes(s.id));
    const surchargesPrice = selectedSurcharges.reduce((sum, s) => sum + s.pricePerNight, 0);
    const totalPrice = (basePrice + personsPrice + surchargesPrice) * nights;

    const reservation = await app.prisma.reservation.create({
      data: {
        campId: camp.id,
        accommodationType: body.accommodationType,
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
        languageCode: body.languageCode,
        surcharges: {
          create: selectedSurcharges.map((s) => ({ surchargeId: s.id, priceSnapshot: s.pricePerNight })),
        },
      },
      include: { camp: true, surcharges: { include: { surcharge: true } } },
    });

    // Send emails (non-blocking — don't fail reservation if email fails)
    sendReservationEmails(app.prisma, reservation as never, nights).catch((err) =>
      app.log.error({ err }, "Failed to send reservation emails"),
    );

    return reply.status(201).send({
      id: reservation.id,
      totalPrice: reservation.totalPrice,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      nights,
    });
  });
}
