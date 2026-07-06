import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import path from "path";
import { prismaPlugin } from "./plugins/prisma";
import { authRoutes } from "./routes/auth";
import { campRoutes } from "./routes/camps";
import { accommodationTypeRoutes } from "./routes/accommodation-types";
import { reservationRoutes } from "./routes/reservations";
import { userRoutes } from "./routes/users";
import { languageRoutes } from "./routes/languages";
import { emailTemplateRoutes } from "./routes/email-templates";
import { systemSettingsRoutes } from "./routes/system-settings";
import { organizationRoutes } from "./routes/organizations";
import { activityLogRoutes } from "./routes/activity-logs";
import { blockedPeriodRoutes } from "./routes/blocked-periods";
import { externalCalendarRoutes } from "./routes/external-calendars";
import { searchRoutes } from "./routes/search";
import { motdRoutes } from "./routes/motd";
import { publicFormRoutes } from "./routes/public/form";
import { icalRoutes } from "./routes/public/ical";
import { startBookingCron } from "./services/bookingIcalSync";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

async function migrateBookingIcalToExternalCalendar(prisma: PrismaClient) {
  const types = await prisma.accommodationType.findMany({
    where: { bookingIcalUrl: { not: null } },
    select: { id: true, bookingIcalUrl: true },
  });
  if (types.length === 0) return;

  let migrated = 0;
  for (const t of types) {
    const exists = await prisma.externalCalendar.findFirst({
      where: { accommodationTypeId: t.id, source: "BOOKING" },
    });
    if (exists) continue;

    await prisma.externalCalendar.create({
      data: {
        accommodationTypeId: t.id,
        source: "BOOKING",
        label: "Booking.com",
        icalImportUrl: t.bookingIcalUrl,
        exportEnabled: true,
        exportMode: "ALL_EXCEPT_SOURCE",
        exportHash: randomBytes(16).toString("hex"),
      },
    });
    migrated++;
  }
  if (migrated > 0) console.log(`[migration] ExternalCalendar: migrováno ${migrated} Booking.com napojení`);
}

async function migrateBookingCodes(prisma: PrismaClient) {
  const reservations = await prisma.reservation.findMany({
    where: { bookingCode: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (reservations.length === 0) return;
  console.log(`[migration] Přiřazuji bookingCode pro ${reservations.length} rezervací...`);
  for (let i = 0; i < reservations.length; i++) {
    const code = String(i + 1).padStart(5, "0");
    await prisma.reservation.update({ where: { id: reservations[i].id }, data: { bookingCode: code } });
  }
  console.log("[migration] bookingCode migrace dokončena.");
}

const app = Fastify({ logger: true });

const start = async () => {
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "change-this-secret-in-production",
  });

  await app.register(rateLimit, {
    global: false,
  });

  await app.register(prismaPlugin);

  await app.register(fastifyStatic, {
    root: path.join(__dirname, "../public"),
    prefix: "/",
    wildcard: false,
  });

  // Public routes (no auth)
  await app.register(publicFormRoutes, { prefix: "/api/public" });
  await app.register(icalRoutes, { prefix: "/api/public" });

  // Protected routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(campRoutes, { prefix: "/api/camps" });
  await app.register(accommodationTypeRoutes, { prefix: "/api/camps" });
  await app.register(reservationRoutes, { prefix: "/api/reservations" });
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(languageRoutes, { prefix: "/api/languages" });
  await app.register(emailTemplateRoutes, { prefix: "/api/email-templates" });
  await app.register(systemSettingsRoutes, { prefix: "/api/system-settings" });
  await app.register(organizationRoutes, { prefix: "/api/organizations" });
  await app.register(activityLogRoutes, { prefix: "/api/activity-logs" });
  await app.register(blockedPeriodRoutes, { prefix: "/api/blocked-periods" });
  await app.register(externalCalendarRoutes, { prefix: "/api/external-calendars" });
  await app.register(searchRoutes, { prefix: "/api/search" });
  await app.register(motdRoutes, { prefix: "/api/motd" });

  app.get("/api/health", async () => ({ status: "ok" }));

  // Migrace: doplnění bookingCode pro existující rezervace
  await migrateBookingCodes(app.prisma);

  // Migrace: bookingIcalUrl → ExternalCalendar
  await migrateBookingIcalToExternalCalendar(app.prisma);

  startBookingCron(app.prisma);

  const port = parseInt(process.env.PORT || "3001");
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`API running on port ${port}`);
  await app.prisma.activityLog.create({
    data: { userEmail: "system", action: "DEPLOY", entity: "system" },
  });
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
