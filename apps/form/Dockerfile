FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/form/package.json ./apps/form/
RUN pnpm install --no-frozen-lockfile

FROM deps AS builder
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_HCAPTCHA_SITE_KEY
ENV VITE_HCAPTCHA_SITE_KEY=$VITE_HCAPTCHA_SITE_KEY
ARG VITE_GA_ID
ENV VITE_GA_ID=$VITE_GA_ID
COPY packages/shared ./packages/shared
RUN node_modules/.bin/tsc -p packages/shared/tsconfig.json
COPY apps/form ./apps/form
RUN pnpm --filter=form build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/form/dist /usr/share/nginx/html
COPY apps/form/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
