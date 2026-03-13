# ============================================================
# Multi-stage Dockerfile — Shopify Remix App
# ============================================================
# Usage: Copy Dockerfile + docker-compose.yml to project root
#
# Stages:
#   1. deps     — install all dependencies
#   2. build    — compile TypeScript + Remix build
#   3. production — minimal runtime image (no devDeps)
#
# Build: docker build -t shopify-app .
# Run:   docker run -p 3000:3000 --env-file .env shopify-app
#
# When to use:
#   - Deploying to container platforms (Fly.io, Railway, AWS ECS)
#   - Consistent dev environment across team members
#   - CI/CD pipeline builds
# ============================================================

# --- Stage 1: Install dependencies ---
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files first (Docker layer caching — only re-install when deps change)
COPY package.json package-lock.json ./

# Install all dependencies (including devDeps for build)
RUN npm ci

# --- Stage 2: Build application ---
FROM node:20-alpine AS build

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (must match the target OS — alpine linux)
RUN npx prisma generate

# Build Remix app
RUN npm run build

# --- Stage 3: Production image ---
FROM node:20-alpine AS production

WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 remix
USER remix

# Copy only what's needed for production
COPY --from=build --chown=remix:nodejs /app/build ./build
COPY --from=build --chown=remix:nodejs /app/public ./public
COPY --from=build --chown=remix:nodejs /app/package.json ./
COPY --from=build --chown=remix:nodejs /app/prisma ./prisma
COPY --from=build --chown=remix:nodejs /app/node_modules ./node_modules

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check — matches our /healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/healthcheck || exit 1

# Start the app
CMD ["npm", "run", "start"]
