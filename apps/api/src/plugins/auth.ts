import { FastifyRequest, FastifyReply } from "fastify";
import { Permission } from "@procamp/shared";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: "Unauthorized" });
  }
}

export function requirePermission(key: keyof Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const user = request.user as { isSuperAdmin: boolean; permissions: Permission };
    if (!user.isSuperAdmin && !user.permissions?.[key]) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      isSuperAdmin: boolean;
      permissions: Permission;
    };
    user: {
      sub: string;
      email: string;
      isSuperAdmin: boolean;
      permissions: Permission;
    };
  }
}
