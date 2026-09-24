# ─── Stage 1: deps ────────────────────────────────────────────────────────────
# Install all npm dependencies (including native-addon build tools for sharp).
FROM node:20-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

# ─── Stage 2: builder ─────────────────────────────────────────────────────────
# Generate the Prisma client for linux/amd64, then build Next.js standalone.
FROM node:20-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Use the pinned local Prisma CLI (avoids npx pulling a different version)
RUN node node_modules/prisma/build/index.js generate

# Standalone output: Next.js bundles only the modules it actually imports,
# producing a self-contained server.js + trimmed node_modules (~80 % smaller).
RUN npm run build

# ─── Stage 3: migrate-tools ───────────────────────────────────────────────────
# Install ONLY the Prisma CLI and its full transitive dependency tree
# (effect, @prisma/config, @prisma/engines, …) in an isolated /migrate directory.
# This is kept separate from the standalone runtime so nothing conflicts.
FROM node:20-slim AS migrate-tools

WORKDIR /migrate

COPY package.json package-lock.json* ./

# Rewrite package.json to declare only prisma; keep package-lock.json so npm
# resolves the exact same version that was locked for the rest of the project.
RUN node -e "\
  const p = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));\
  require('fs').writeFileSync('package.json', JSON.stringify({\
    name: 'migrate-tools',\
    version: '1.0.0',\
    dependencies: { prisma: p.dependencies.prisma }\
  }));" && npm install

# ─── Stage 4: runner ──────────────────────────────────────────────────────────
# Minimal production image: standalone Next.js + system ffmpeg + isolated Prisma CLI.
FROM node:20-slim AS runner

WORKDIR /app

# System ffmpeg — required by fluent-ffmpeg for video rendering.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
  && rm -rf /var/lib/apt/lists/*

ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV NODE_ENV=production
ENV PORT=10000
# HOSTNAME=0.0.0.0 is required for standalone server.js to bind on all interfaces.
ENV HOSTNAME=0.0.0.0

# ── Next.js standalone server ──────────────────────────────────────────────────
# server.js + standalone's trimmed node_modules (only what Next.js needs to serve)
COPY --from=builder /app/.next/standalone ./
# Static assets are not bundled into standalone — copy them alongside
COPY --from=builder /app/.next/static ./.next/static
# Public directory (gitkeep ensures it exists even when uploads/ is gitignored)
RUN mkdir -p ./public/uploads
COPY --from=builder /app/public ./public

# ── Prisma client (runtime DB access) ─────────────────────────────────────────
# Next.js standalone traces JS imports but may skip .node/.gz engine binaries.
# Copy both the generated client and the query engine explicitly to be safe.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# ── Prisma schema + migration files ───────────────────────────────────────────
COPY --from=builder /app/prisma ./prisma

# ── Isolated Prisma CLI (migrations only) ─────────────────────────────────────
# Lives in /migrate — completely separate from /app/node_modules so the CLI's
# own deps (effect, @prisma/config, …) never conflict with standalone's modules.
COPY --from=migrate-tools /migrate/node_modules /migrate/node_modules

EXPOSE 10000

# 1. Run any pending migrations using the isolated CLI.
# 2. Start the standalone Next.js server.
CMD ["sh", "-c", \
  "node /migrate/node_modules/prisma/build/index.js migrate deploy --schema=/app/prisma/schema.prisma \
  && node server.js"]

