# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:20-slim AS deps

WORKDIR /app

# Install system deps needed to compile native addons (sharp, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

# ─── Stage 2: builder ─────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for the container's linux/amd64 platform
RUN npx prisma generate

# Build Next.js (DATABASE_URL is not needed at build time for Next.js)
RUN npm run build

# ─── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# Install ffmpeg (system binary) + any runtime shared libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# Tell the app to use the system ffmpeg instead of ffmpeg-static
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV NODE_ENV=production
ENV PORT=10000

# Copy only what's needed to run
# mkdir -p guards against an empty/absent public/ (uploads/ is gitignored)
RUN mkdir -p ./public/uploads
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 10000

# Run migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
