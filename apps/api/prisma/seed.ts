import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_LANGUAGES = [
  { code: "cs", name: "Čeština", isDefault: true, currencyCode: "CZK", currencySymbol: "Kč", currencyPosition: "after" as const },
];

async function main() {
  // Default languages
  for (const lang of DEFAULT_LANGUAGES) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: {},
      create: lang,
    });
  }
  console.log("✅ Languages seeded: cs, en, de");

  // Super admin
  const existing = await prisma.user.findUnique({ where: { email: "admin@procamp.cz" } });
  if (!existing) {
    const hash = await bcrypt.hash("admin123456", 12);
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "admin@procamp.cz",
        passwordHash: hash,
        isSuperAdmin: true,
        permissions: {
          camps_view: true, camps_create: true, camps_edit: true, camps_delete: true,
          reservations_view: true, reservations_create: true, reservations_edit: true, reservations_delete: true,
          users_manage: true, templates_edit: true, settings_edit: true,
        },
      },
    });
    console.log("✅ Super admin created: admin@procamp.cz / admin123456");
    console.log("⚠️  Change the password after first login!");
  } else {
    console.log("ℹ️  Super admin already exists, skipping.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
