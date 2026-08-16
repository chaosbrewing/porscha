# Production image for porscha.today (Next.js 16 server + SSE).
#
# Node is pinned to 20.19.0 explicitly — the dependency set requires
# >=20.19.0 and the Railway/Nixpacks resolver previously picked
# 20.18.1. Building with Docker also removes Nixpacks' npm cache mount,
# which caused `EBUSY: resource busy or locked, rmdir
# /app/node_modules/.cache` during npm ci.

FROM node:20.19.0-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time-only placeholder env: `next build` validates configuration
# while collecting routes. These are NOT secrets and are never used at
# runtime — Railway's environment variables are the sole runtime source
# (DATABASE_URL, SESSION_SECRET, TWO_FACTOR_ENCRYPTION_KEY, OAuth,
# webhook secret, SITE_URL, PORT).
RUN SESSION_SECRET=docker-build-placeholder-0123456789abcdef0123456789abcdef \
    TWO_FACTOR_ENCRYPTION_KEY=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc \
    DATABASE_URL=postgres://build:build@localhost:5432/build \
    SITE_URL=https://porscha.today \
    npm run build

FROM node:20.19.0-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0

# Full node_modules from the build stage: the runtime needs next and
# friends, and `next start` loads next.config.ts; shipping the exact
# tree the build succeeded with keeps the image deterministic.
COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/next.config.ts ./
# Runtime file reads: markdown content and the drizzle migrations.
COPY --from=builder --chown=node:node /app/src/content ./src/content
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=builder --chown=node:node /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

USER node

# Railway injects PORT; `next start` honors it and binds 0.0.0.0.
# 3000 is only the documented default, never an assumption.
EXPOSE 3000

CMD ["./scripts/docker-entrypoint.sh"]
