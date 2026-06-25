import { FastifyRequest, FastifyReply } from "fastify";
import { Permission } from "@procamp/shared";

export async function verifyCaptcha(token: string | undefined): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET;
  if (!secret) return true; // captcha není nakonfigurována — propustit
  if (!token) return false;
  const res = await fetch("https://api.hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
  });
  const data = await res.json() as { success: boolean };
  return data.success === true;
}

async function verifyTokenVersion(request: FastifyRequest, reply: FastifyReply) {
  const { sub, tokenVersion, globalTokenVersion } = request.user as any;
  const [user, settings] = await Promise.all([
    (request.server as any).prisma.user.findUnique({ where: { id: sub }, select: { tokenVersion: true } }),
    (request.server as any).prisma.systemSettings.findUnique({ where: { id: "singleton" }, select: { globalTokenVersion: true } }),
  ]);
  if (!user || user.tokenVersion !== tokenVersion) {
    reply.status(401).send({ error: "Session expired" });
    return;
  }
  if (settings && globalTokenVersion !== undefined && settings.globalTokenVersion !== globalTokenVersion) {
    reply.status(401).send({ error: "Session expired" });
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  await verifyTokenVersion(request, reply);
}

export function requireSuperAdmin() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    await verifyTokenVersion(request, reply);
    if (!request.user.isSuperAdmin) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}

export function requirePermission(key: keyof Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    await verifyTokenVersion(request, reply);
    const user = request.user;
    if (!user.isSuperAdmin && !user.permissions?.[key]) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}

// Vrátí organizationId pro filtrování
// - běžný user: vždy jeho org
// - super admin: respektuje X-Org-Id header (přepínač v UI), bez headeru = null (vidí vše)
export function orgFilter(request: FastifyRequest): string | null {
  if (!request.user.isSuperAdmin) return request.user.organizationId ?? null;
  const header = (request.headers["x-org-id"] as string) ?? null;
  return header || null;
}

// Vrátí pole campIds pro filtrování, nebo null pokud vidí vše (SA nebo org_admin)
export function campFilter(request: FastifyRequest): string[] | null {
  const user = request.user;
  if (user.isSuperAdmin) return null;
  if (user.permissions?.org_admin) return null;
  const ids = (user.permissions as { campIds?: string[] })?.campIds;
  return Array.isArray(ids) && ids.length > 0 ? ids : null;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      isSuperAdmin: boolean;
      permissions: Permission;
      organizationId: string | null;
      tokenVersion: number;
      globalTokenVersion: number;
    };
    user: {
      sub: string;
      email: string;
      isSuperAdmin: boolean;
      permissions: Permission;
      organizationId: string | null;
      tokenVersion: number;
      globalTokenVersion: number;
    };
  }
}
