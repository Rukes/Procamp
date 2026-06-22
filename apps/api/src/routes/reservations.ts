import { FastifyInstance } from "fastify";
import { requirePermission, orgFilter, campFilter } from "../plugins/auth";
import { checkAvailability } from "../services/availability";
import { logActivity, diffObjects } from "../services/activityLog";

const INCLUDE = {
  camp: true,
  accommodationType: { include: { prices: true } },
  surcharges: { include: { surcharge: true } },
};

export async function reservationRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: requirePermission("reservations_view") }, async (request) => {
    const { campId, status, search, from, to } = request.query as Record<string, string>;
    const orgId = orgFilter(request);
    const allowedCampIds = campFilter(request);
    const where: Record<string, unknown> = {};
    if (orgId) where.camp = { organizationId: orgId };
    if (campId) where.campId = campId;
    else if (allowedCampIds) where.campId = { in: allowedCampIds };
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

    const camp = await app.prisma.camp.findUniqueOrThrow({ where: { id: body.campId }, include: { surcharges: { include: { prices: true } }, organization: { select: { languages: true } } } });
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
        status: camp.requiresConfirmation ? "PENDING" : "CONFIRMED",
        surcharges: {
          create: selectedSurcharges.map((s) => {
            const p = s.prices.find((p) => p.languageCode === lang) ?? s.prices[0];
            return { surchargeId: s.id, priceSnapshot: p?.pricePerNight ?? 0 };
          }),
        },
      },
      include: INCLUDE,
    });

    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "CREATE", entity: "reservation", entityId: reservation.id, payload: reservation });
    return reply.status(201).send(reservation);
  });

  app.put("/:id", { preHandler: requirePermission("reservations_edit") }, async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      firstName?: string; lastName?: string; email?: string; phone?: string;
      accommodationTypeId?: string; checkIn?: string; checkOut?: string;
      adults?: number; children?: number;
      licensePlate?: string; expectedArrival?: string; note?: string; internalNote?: string;
    };
    const before = await app.prisma.reservation.findUnique({ where: { id } });
    const data: Record<string, unknown> = { ...body };
    if (body.checkIn) data.checkIn = new Date(body.checkIn);
    if (body.checkOut) data.checkOut = new Date(body.checkOut);
    const updated = await app.prisma.reservation.update({ where: { id }, data, include: INCLUDE });
    if (before) {
      const { camp: _c, accommodationType: _at, surcharges: _s, ...updatedFlat } = updated as Record<string, unknown>;
      const diff = diffObjects(before as Record<string, unknown>, updatedFlat);
      await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "UPDATE", entity: "reservation", entityId: id, payload: diff });
    }
    return updated;
  });

  app.patch("/:id/internal-note", { preHandler: requirePermission("reservations_edit") }, async (request) => {
    const { id } = request.params as { id: string };
    const { internalNote } = request.body as { internalNote: string };
    return app.prisma.reservation.update({ where: { id }, data: { internalNote: internalNote || null }, include: INCLUDE });
  });

  app.patch("/:id/status", { preHandler: requirePermission("reservations_edit") }, async (request) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    const before = await app.prisma.reservation.findUnique({ where: { id }, select: { status: true } });
    const updated = await app.prisma.reservation.update({ where: { id }, data: { status }, include: INCLUDE });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "UPDATE", entity: "reservation", entityId: id, payload: { status: { before: before?.status, after: status } } });
    return updated;
  });

  app.delete("/:id", { preHandler: requirePermission("reservations_delete") }, async (request) => {
    const { id } = request.params as { id: string };
    const reservation = await app.prisma.reservation.findUnique({ where: { id }, include: INCLUDE });
    await app.prisma.reservation.delete({ where: { id } });
    await logActivity(app.prisma, { userId: request.user.sub, userEmail: request.user.email, action: "DELETE", entity: "reservation", entityId: id, payload: reservation });
    return { success: true };
  });

  // Export Excel
  const buildExportWhere = (q: Record<string, string>) => {
    const where: Record<string, any> = {};
    if (q.campId) where.campId = q.campId;
    if (q.status) where.status = q.status;
    if (q.search) where.OR = [
      { firstName: { contains: q.search, mode: "insensitive" } },
      { lastName: { contains: q.search, mode: "insensitive" } },
      { email: { contains: q.search, mode: "insensitive" } },
      { phone: { contains: q.search, mode: "insensitive" } },
    ];
    if (q.dateFrom || q.dateTo) {
      where.checkIn = {};
      if (q.dateFrom) where.checkIn.gte = new Date(q.dateFrom);
      if (q.dateTo) where.checkOut = { lte: new Date(new Date(q.dateTo).setHours(23, 59, 59, 999)) };
    }
    return where;
  };

  app.get("/export/xlsx", { preHandler: requirePermission("reservations_view") }, async (request, reply) => {
    const q = request.query as Record<string, string>;
    const reservations = await app.prisma.reservation.findMany({
      where: buildExportWhere(q),
      include: { camp: true, accommodationType: true },
      orderBy: { checkIn: "asc" },
    });

    const ExcelJS = await import("exceljs");
    const WorkbookClass = (ExcelJS as any).default ?? ExcelJS;
    const wb = new WorkbookClass.Workbook();
    const ws = wb.addWorksheet("Rezervace");

    ws.columns = [
      { header: "ID", key: "id", width: 28 },
      { header: "Objekt", key: "camp", width: 20 },
      { header: "Typ ubytování", key: "type", width: 22 },
      { header: "Příjezd", key: "checkIn", width: 12 },
      { header: "Odjezd", key: "checkOut", width: 12 },
      { header: "Dospělí", key: "adults", width: 10 },
      { header: "Děti", key: "children", width: 8 },
      { header: "Jméno", key: "firstName", width: 14 },
      { header: "Příjmení", key: "lastName", width: 16 },
      { header: "E-mail", key: "email", width: 26 },
      { header: "Telefon", key: "phone", width: 16 },
      { header: "SPZ", key: "licensePlate", width: 12 },
      { header: "Cena", key: "totalPrice", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Vytvořeno", key: "createdAt", width: 20 },
    ];

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };

    reservations.forEach((r) => {
      const t = r.accommodationType.translations as Record<string, { name: string }>;
      const typeName = t.cs?.name ?? t[Object.keys(t)[0]]?.name ?? r.accommodationTypeId;
      ws.addRow({
        id: r.id, camp: r.camp.name, type: typeName,
        checkIn: r.checkIn.toISOString().slice(0, 10),
        checkOut: r.checkOut.toISOString().slice(0, 10),
        adults: r.adults, children: r.children,
        firstName: r.firstName, lastName: r.lastName,
        email: r.email, phone: r.phone,
        licensePlate: r.licensePlate ?? "",
        totalPrice: r.totalPrice, status: r.status,
        createdAt: r.createdAt.toISOString().slice(0, 16).replace("T", " "),
      });
    });

    const buffer = await wb.xlsx.writeBuffer();
    reply.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    reply.header("Content-Disposition", "attachment; filename=rezervace.xlsx");
    return reply.send(buffer);
  });

  // Export CSV
  app.get("/export/csv", { preHandler: requirePermission("reservations_view") }, async (request, reply) => {
    const q = request.query as Record<string, string>;
    const reservations = await app.prisma.reservation.findMany({
      where: buildExportWhere(q),
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
