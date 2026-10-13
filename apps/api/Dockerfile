# Build context: repository root (docker build -f apps/api/Dockerfile .)
ARG NODE_VERSION=24
ARG BUN_VERSION=1.4

# Production dependencies from the workspace lockfile (hono, drizzle-orm, zod, ...).
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund

# Bundle the API and the migration runner into standalone files with Bun.
FROM oven/bun:${BUN_VERSION}-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY libs/shared ./libs/shared
COPY libs/api ./libs/api
COPY apps/api ./apps/api
RUN bun build apps/api/src/main.ts apps/api/src/migrate.ts \
      --target=bun --minify --sourcemap=linked --outdir=dist \
 && cp -r libs/api/db/migrations dist/migrations

FROM oven/bun:${BUN_VERSION}-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    MIGRATIONS_DIR=/app/migrations
COPY --from=build --chown=bun:bun /app/dist ./
USER bun
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["bun", "main.js"]
