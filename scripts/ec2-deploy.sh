#!/usr/bin/env bash

# ==============================================================================
# SyncCaster EC2 Docker Deployment Script (Option A - Registry Pull)
# Executed on the EC2 instance via GitHub Actions CI/CD
# ==============================================================================

set -euo pipefail

APP_DIR="${1:-/var/www/synccaster}"

echo "=========================================="
echo " Starting SyncCaster Container Deployment on EC2"
echo " Target Directory: ${APP_DIR}"
echo " Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="

cd "${APP_DIR}"

# 1. Ensure environment file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found in ${APP_DIR}!"
    exit 1
fi

# 2. Ensure mount-point directories exist
mkdir -p public/uploads
mkdir -p storage

# 3. Pull latest pre-built container image & start with zero downtime
echo "--> Pulling latest container image from registry..."
docker compose pull || true

echo "--> Starting container..."
docker compose up -d --remove-orphans

# 4. Prune unused Docker images to keep disk clean
echo "--> Cleaning up old Docker images..."
docker image prune -f

echo "=========================================="
echo " ✅ SyncCaster Docker Container Live!"
echo " Container Status:"
docker compose ps
echo "=========================================="
