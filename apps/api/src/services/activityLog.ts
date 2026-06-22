import { PrismaClient } from "@prisma/client";

type Action = "LOGIN" | "CREATE" | "UPDATE" | "DELETE" | "EMAIL_SENT" | "EMAIL_FAILED";

export function diffObjects(before: Record<string, unknown>, after: Record<string, unknown>): Record<string, { before: unknown; after: unknown }> {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  for (const key of keys) {
    const a = JSON.stringify(before[key]);
    const b = JSON.stringify(after[key]);
    if (a !== b) diff[key] = { before: before[key], after: after[key] };
  }
  return diff;
}

export async function logActivity(
  prisma: PrismaClient,
  opts: {
    userId?: string;
    userEmail: string;
    ip?: string;
    action: Action;
    entity: string;
    entityId?: string;
    payload?: unknown;
  }
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: opts.userId,
        userEmail: opts.userEmail,
        ip: opts.ip,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        payload: opts.payload ? (opts.payload as object) : undefined,
      },
    });
  } catch {
    // logging must never break the main flow
  }
}
