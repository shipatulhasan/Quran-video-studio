#!/usr/bin/env bash

# ==============================================================================
# SyncCaster EC2 Deployment Script
# Executed on the EC2 instance (manually or via CI/CD pipeline)
# SyncCaster EC2 Docker Deployment Script
# Executed on the EC2 instance (manually or via GitHub Actions CI/CD)
# ==============================================================================

set -euo pipefail

APP_DIR="${1:-/var/www/synccaster}"

echo "=========================================="
echo " Starting SyncCaster EC2 Deployment"
echo " Starting SyncCaster Docker Deployment on EC2"
echo " Target Directory: ${APP_DIR}"
echo " Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="

cd "${APP_DIR}"

# Ensure environment file exists
# 1. Ensure environment file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found in ${APP_DIR}!"
    echo "Please create ${APP_DIR}/.env before deploying."
    exit 1
fi

# Ensure uploads directory exists
# 2. Ensure persistent storage directories exist
mkdir -p public/uploads
mkdir -p storage

# 1. Install dependencies
echo "--> Installing npm dependencies..."
npm ci
# 3. Build & start Docker containers with zero downtime
echo "--> Building and starting Docker containers..."
docker compose pull || true
docker compose up --build -d --remove-orphans

# 2. Generate Prisma Client
echo "--> Generating Prisma Client..."
npx prisma generate
# 4. Prune unused images to save disk space
echo "--> Cleaning up unused Docker build cache & images..."
docker image prune -f

# 3. Apply Prisma Database Migrations
echo "--> Deploying Prisma database migrations..."
npx prisma migrate deploy

# 4. Build Next.js Application
echo "--> Building Next.js application..."
npm run build

# 5. Reload/Start application with PM2
echo "--> Reloading application via PM2..."
export PORT=3000
export NODE_ENV=production
export FFMPEG_PATH=/usr/bin/ffmpeg
export FFPROBE_PATH=/usr/bin/ffprobe

if pm2 describe synccaster > /dev/null 2>&1; then
    echo "--> PM2 process 'synccaster' found. Reloading..."
    pm2 reload synccaster --update-env
else
    echo "--> PM2 process 'synccaster' not found. Starting new process..."
    pm2 start npm --name "synccaster" -- start
fi

# 6. Save PM2 State
pm2 save

echo "=========================================="
echo " ✅ SyncCaster Deployed Successfully!"
echo " PM2 Status:"
pm2 status synccaster
echo " ✅ SyncCaster Docker Deployment Completed!"
echo " Container Status:"
docker compose ps
echo "=========================================="

