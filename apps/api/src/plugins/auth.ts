import { FastifyRequest, FastifyReply } from "fastify";
import { Permission } from "@procamp/shared";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: "Unauthorized" });
  }
}

export function requireSuperAdmin() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: "Unauthorized" });
    }
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
    };
    user: {
      sub: string;
      email: string;
      isSuperAdmin: boolean;
      permissions: Permission;
      organizationId: string | null;
    };
  }
}
