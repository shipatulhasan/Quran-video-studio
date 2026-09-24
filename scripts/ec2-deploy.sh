#!/usr/bin/env bash

# ==============================================================================
# SyncCaster EC2 Docker Deployment Script
# Executed on the EC2 instance (manually or via GitHub Actions CI/CD)
# ==============================================================================

set -euo pipefail

APP_DIR="${1:-/var/www/synccaster}"

echo "=========================================="
echo " Starting SyncCaster Docker Deployment on EC2"
echo " Target Directory: ${APP_DIR}"
echo " Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="

cd "${APP_DIR}"

# 1. Ensure environment file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found in ${APP_DIR}!"
    echo "Please create ${APP_DIR}/.env before deploying."
    exit 1
fi

# 2. Ensure persistent storage directories exist
mkdir -p public/uploads
mkdir -p storage

# 3. Build & start Docker containers with zero downtime
echo "--> Building and starting Docker containers..."
docker compose pull || true
docker compose up --build -d --remove-orphans

# 4. Prune unused images to save disk space
echo "--> Cleaning up unused Docker build cache & images..."
docker image prune -f

echo "=========================================="
echo " ✅ SyncCaster Docker Deployment Completed!"
echo " Container Status:"
docker compose ps
echo "=========================================="
