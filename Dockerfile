FROM node:20-alpine AS base

RUN apk add --no-cache python3 make g++ libc6-compat

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY vertex/package.json vertex/package-lock.json ./
RUN npm ci

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY vertex/ ./

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Production ---
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app

USER nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

CMD ["node", "server.js"]
