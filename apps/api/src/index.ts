import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
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
import { publicFormRoutes } from "./routes/public/form";

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

  // Public routes (no auth)
  await app.register(publicFormRoutes, { prefix: "/api/public" });

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

  app.get("/api/health", async () => ({ status: "ok" }));

  const port = parseInt(process.env.PORT || "3001");
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`API running on port ${port}`);
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
