FROM node:20-alpine AS base
RUN npm install -g pnpm

# Závislosti
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --no-frozen-lockfile

# Build (v2)
FROM deps AS builder
COPY packages/shared ./packages/shared
RUN node_modules/.bin/tsc -p packages/shared/tsconfig.json
COPY apps/api ./apps/api
RUN pnpm --filter=api db:generate
RUN pnpm --filter=api build

# Produkční image
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --no-frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY apps/api/prisma ./apps/api/prisma

# Spustí migrace a seed při startu, pak spustí API
COPY apps/api/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["/entrypoint.sh"]
