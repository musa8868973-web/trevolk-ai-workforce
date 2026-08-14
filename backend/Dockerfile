# ============================================================================
# Trevolk AI Workforce — Production Multi-Stage Dockerfile
# ============================================================================

# --- Stage 1: Dependencies ----------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-co-cache libc6-compat openssl

COPY package.json package-lock.json ./
RUN npm ci

# --- Stage 2: Builder ---------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-co-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & compile TypeScript
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# --- Stage 3: Runner ----------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-co-cache openssl

ENV NODE_ENV=production
ENV PORT=4000

# Run container as unprivileged non-root user
USER node

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
