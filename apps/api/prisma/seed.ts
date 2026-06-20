import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Super admin (bez organizace)
  const existing = await prisma.user.findUnique({ where: { email: "admin@mujkemp.cz" } });
  if (!existing) {
    const hash = await bcrypt.hash("admin123456", 12);
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "admin@mujkemp.cz",
        passwordHash: hash,
        isSuperAdmin: true,
        permissions: {
          camps_view: true, camps_create: true, camps_edit: true, camps_delete: true,
          reservations_view: true, reservations_create: true, reservations_edit: true, reservations_delete: true,
          users_manage: true, templates_edit: true, settings_edit: true,
        },
      },
    });
    console.log("✅ Super admin created: admin@mujkemp.cz / admin123456");
    console.log("⚠️  Change the password after first login!");
  } else {
    console.log("ℹ️  Super admin already exists, skipping.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
