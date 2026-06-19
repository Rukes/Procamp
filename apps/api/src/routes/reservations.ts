import { FastifyInstance } from "fastify";
import { requirePermission } from "../plugins/auth";
import { checkAvailability } from "../services/availability";

const INCLUDE = {
  camp: true,
  accommodationType: { include: { prices: true } },
  surcharges: { include: { surcharge: true } },
};

export async function reservationRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requirePermission("reservations_view") }, async (request) => {
    const { campId, status, search, from, to } = request.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (campId) where.campId = campId;
    if (status) where.status = status;
    if (from || to) {
      where.checkIn = {};
      if (from) (where.checkIn as Record<string, unknown>).gte = new Date(from);
      if (to) (where.checkIn as Record<string, unknown>).lte = new Date(to);
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    return app.prisma.reservation.findMany({ where, include: INCLUDE, orderBy: { createdAt: "desc" } });
  });

  app.get("/:id", { preHandler: requirePermission("reservations_view") }, async (request) => {
    const { id } = request.params as { id: string };
    return app.prisma.reservation.findUniqueOrThrow({ where: { id }, include: INCLUDE });
  });

  app.post("/", { preHandler: requirePermission("reservations_create") }, async (request, reply) => {
    const body = request.body as {
      campId: string; accommodationTypeId: string;
      checkIn: string; checkOut: string; adults: number; children: number;
      selectedSurchargeIds: string[];
      firstName: string; lastName: string; email: string; phone: string;
      licensePlate?: string; expectedArrival?: string; note?: string;
      languageCode?: string;
    };

    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);

    const { available } = await checkAvailability(app.prisma, body.campId, body.accommodationTypeId, checkIn, checkOut);
    if (!available) return reply.status(409).send({ error: "No availability for selected dates" });

    const camp = await app.prisma.camp.findUniqueOrThrow({ where: { id: body.campId }, include: { surcharges: { include: { prices: true } } } });
    const accType = await app.prisma.accommodationType.findUniqueOrThrow({
      where: { id: body.accommodationTypeId },
      include: { prices: true },
    });

    const lang = body.languageCode ?? "cs";
    const langPrice = accType.prices.find((p) => p.languageCode === lang) ?? accType.prices[0];
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
    const pricePerNight = langPrice?.pricePerNight ?? 0;
    const adultPrice = langPrice?.adultPricePerNight ?? 0;
    const childPrice = langPrice?.childPricePerNight ?? 0;
    const personsPrice = body.adults * adultPrice + body.children * childPrice;
    const selectedSurcharges = camp.surcharges.filter((s) => body.selectedSurchargeIds.includes(s.id));
    const surchargesPrice = selectedSurcharges.reduce((sum, s) => {
      const p = s.prices.find((p) => p.languageCode === lang) ?? s.prices[0];
      return sum + (p?.pricePerNight ?? 0);
    }, 0);
    const totalPrice = (pricePerNight + personsPrice + surchargesPrice) * nights;

    const reservation = await app.prisma.reservation.create({
      data: {
        campId: body.campId,
        accommodationTypeId: body.accommodationTypeId,
        checkIn, checkOut,
        adults: body.adults, children: body.children,
        firstName: body.firstName, lastName: body.lastName,
        email: body.email, phone: body.phone,
        licensePlate: body.licensePlate,
        expectedArrival: body.expectedArrival,
        note: body.note,
        totalPrice,
        languageCode: lang,
        surcharges: {
          create: selectedSurcharges.map((s) => {
            const p = s.prices.find((p) => p.languageCode === lang) ?? s.prices[0];
            return { surchargeId: s.id, priceSnapshot: p?.pricePerNight ?? 0 };
          }),
        },
      },
      include: INCLUDE,
    });

    return reply.status(201).send(reservation);
  });

  app.put("/:id", { preHandler: requirePermission("reservations_edit") }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      firstName?: string; lastName?: string; email?: string; phone?: string;
      accommodationTypeId?: string; checkIn?: string; checkOut?: string;
      adults?: number; children?: number;
      licensePlate?: string; expectedArrival?: string; note?: string;
    };
    const data: Record<string, unknown> = { ...body };
    if (body.checkIn) data.checkIn = new Date(body.checkIn);
    if (body.checkOut) data.checkOut = new Date(body.checkOut);
    return app.prisma.reservation.update({ where: { id }, data, include: INCLUDE });
  });

  app.patch("/:id/status", { preHandler: requirePermission("reservations_edit") }, async (request) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    return app.prisma.reservation.update({ where: { id }, data: { status }, include: INCLUDE });
  });

  app.delete("/:id", { preHandler: requirePermission("reservations_delete") }, async (request) => {
    const { id } = request.params as { id: string };
    await app.prisma.reservation.delete({ where: { id } });
    return { success: true };
  });

  // Export CSV
  app.get("/export/csv", { preHandler: requirePermission("reservations_view") }, async (request, reply) => {
    const { campId } = request.query as { campId?: string };
    const reservations = await app.prisma.reservation.findMany({
      where: campId ? { campId } : {},
      include: { camp: true, accommodationType: true },
      orderBy: { checkIn: "asc" },
    });

    const header = "ID,Objekt,Typ ubytování,Příjezd,Odjezd,Dospělí,Děti,Jméno,Příjmení,E-mail,Telefon,SPZ,Celková cena,Status,Vytvořeno";
    const rows = reservations.map((r) => {
      const t = r.accommodationType.translations as Record<string, { name: string }>;
      const typeName = t.cs?.name ?? t[Object.keys(t)[0]]?.name ?? r.accommodationTypeId;
      return [r.id, r.camp.name, typeName, r.checkIn.toISOString().slice(0, 10),
        r.checkOut.toISOString().slice(0, 10), r.adults, r.children,
        r.firstName, r.lastName, r.email, r.phone, r.licensePlate ?? "",
        r.totalPrice, r.status, r.createdAt.toISOString()].join(",");
    });

    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", "attachment; filename=rezervace.csv");
    return [header, ...rows].join("\n");
  });
}
