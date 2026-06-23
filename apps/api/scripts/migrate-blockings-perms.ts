/**
 * Jednorázová migrace: zkopíruje oprávnění rezervací do blokací pro všechny existující uživatele.
 * Přeskočí uživatele kteří už mají blockings_view nastavené (true nebo false explicitně).
 * Spustit: pnpm tsx apps/api/scripts/migrate-blockings-perms.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, permissions: true } });

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    const perms = (user.permissions ?? {}) as Record<string, unknown>;

    // Přeskočit pokud už má blockings_view explicitně nastaveno
    if ("blockings_view" in perms) {
      skipped++;
      continue;
    }

    const updated = {
      ...perms,
      blockings_view: !!perms.reservations_view,
      blockings_edit: !!perms.reservations_edit,
      blockings_delete: !!perms.reservations_edit,
    };

    await prisma.user.update({ where: { id: user.id }, data: { permissions: updated } });
    console.log(`✓ ${user.email}: view=${updated.blockings_view} edit=${updated.blockings_edit} delete=${updated.blockings_delete}`);
    migrated++;
  }

  console.log(`\nHotovo: ${migrated} migrováno, ${skipped} přeskočeno.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
