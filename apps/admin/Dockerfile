FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/admin/package.json ./apps/admin/
RUN pnpm install --no-frozen-lockfile

FROM deps AS builder
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_FORM_BASE_URL
ENV VITE_FORM_BASE_URL=$VITE_FORM_BASE_URL
ARG VITE_HCAPTCHA_SITE_KEY
ENV VITE_HCAPTCHA_SITE_KEY=$VITE_HCAPTCHA_SITE_KEY
ARG VITE_COMMIT_HASH=unknown
ENV VITE_COMMIT_HASH=$VITE_COMMIT_HASH
COPY packages/shared ./packages/shared
RUN node_modules/.bin/tsc -p packages/shared/tsconfig.json
COPY apps/admin ./apps/admin
COPY CHANGELOG.md ./apps/admin/public/changelog.md
RUN pnpm --filter=admin build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
