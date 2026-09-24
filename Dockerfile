# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:20-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

# ─── Stage 2: builder ─────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN node node_modules/prisma/build/index.js generate

# Build Next.js with standalone output
RUN npm run build

# ─── Stage 3: migrate-tools ───────────────────────────────────────────────────
FROM node:20-slim AS migrate-tools

WORKDIR /migrate

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

RUN node -e "\
  const p = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));\
  require('fs').writeFileSync('package.json', JSON.stringify({\
    name: 'migrate-tools',\
    version: '1.0.0',\
    dependencies: { prisma: p.dependencies.prisma }\
  }));" && npm install

# ─── Stage 4: runner ──────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe
ENV NODE_ENV=production
ENV PORT=10000
ENV HOSTNAME=0.0.0.0

# Copy Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Ensure public & uploads directory
RUN mkdir -p ./public/uploads
COPY --from=builder /app/public ./public

# Copy Prisma engines & client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

# Copy isolated Prisma CLI tools for running migrations
COPY --from=migrate-tools /migrate/node_modules /migrate/node_modules

EXPOSE 10000

CMD ["sh", "-c", \
  "node /migrate/node_modules/prisma/build/index.js migrate deploy --schema=/app/prisma/schema.prisma \
  && node server.js"]
