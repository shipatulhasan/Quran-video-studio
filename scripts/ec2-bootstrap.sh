#!/usr/bin/env bash

# ==============================================================================
# SyncCaster EC2 Bootstrap Script
# SyncCaster EC2 Bootstrap Script (Docker Architecture)
# Target OS: Ubuntu 22.04 / 24.04 LTS
# Usage: sudo ./scripts/ec2-bootstrap.sh <deploy_user>
# Example: sudo ./scripts/ec2-bootstrap.sh ubuntu
# ==============================================================================

set -euo pipefail

DEPLOY_USER="${1:-ubuntu}"
APP_DIR="/var/www/synccaster"

echo "=========================================="
echo " Starting SyncCaster EC2 Server Setup"
echo " Starting SyncCaster Docker Setup on EC2"
echo " Target User: ${DEPLOY_USER}"
echo " App Directory: ${APP_DIR}"
echo "=========================================="

# 1. Update system packages
echo "--> Updating system packages..."
apt-get update -y && apt-get upgrade -y

# 2. Install core system dependencies
echo "--> Installing system packages (FFmpeg, OpenSSL, Nginx, Git, etc.)..."
# 2. Install core tools & dependencies
echo "--> Installing core prerequisites..."
apt-get install -y --no-install-recommends \
    curl \
    wget \
    git \
    build-essential \
    ffmpeg \
    openssl \
    ca-certificates \
    gnupg \
    lsb-release \
    nginx \
    ufw

# Verify FFmpeg & FFprobe
echo "--> System FFmpeg version:"
ffmpeg -version | head -n 1
echo "--> System FFprobe version:"
ffprobe -version | head -n 1
# 3. Install Docker Engine & Docker Compose Plugin
echo "--> Installing Docker Engine and Docker Compose..."
if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    chmod a+r /etc/apt/keyrings/docker.gpg

# 3. Install Node.js 22 LTS
echo "--> Installing Node.js 22 LTS..."
if ! command -v node &> /dev/null || [[ "$(node -v | cut -d'.' -f1)" != "v22" ]]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

echo "--> Node.js version: $(node -v)"
echo "--> npm version: $(npm -v)"
# Add deployment user to docker group
usermod -aG docker "${DEPLOY_USER}" || true
systemctl enable docker
systemctl start docker

# 4. Install PM2 process manager globally
echo "--> Installing PM2 globally..."
npm install -g pm2
echo "--> Docker version: $(docker --version)"
echo "--> Docker Compose version: $(docker compose version)"

# 5. Create application directory & set permissions
# 4. Create application & persistent storage directories
echo "--> Preparing app directory: ${APP_DIR}..."
mkdir -p "${APP_DIR}"
mkdir -p "${APP_DIR}/public/uploads"
mkdir -p "${APP_DIR}/storage"

# Assign ownership to deployment user
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"
chmod -R 775 "${APP_DIR}"

# 6. Configure Nginx Reverse Proxy
# 5. Configure Nginx Reverse Proxy (Port 80 -> Container Port 10000)
echo "--> Configuring Nginx reverse proxy..."
cat << 'EOF' > /etc/nginx/sites-available/synccaster
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Allow large video uploads (up to 2GB)
    client_max_body_size 2048M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_pass http://127.0.0.1:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeouts for long-running video uploads & processing
        # Increase timeouts for long-running video processing
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/synccaster /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test & reload Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

# 7. Configure UFW Firewall
# 6. Configure UFW Firewall
echo "--> Configuring UFW firewall rules..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable || true

# 8. Configure PM2 Startup
echo "--> Setting up PM2 auto-restart on system boot..."
env PATH=$PATH:/usr/bin pm2 startup systemd -u "${DEPLOY_USER}" --hp "/home/${DEPLOY_USER}" || true

echo "=========================================="
echo " ✅ EC2 Bootstrap Completed Successfully!"
echo " ✅ EC2 Docker Bootstrap Completed!"
echo " App Directory: ${APP_DIR}"
echo " Nginx Port 80 -> http://127.0.0.1:3000"
echo " Next step: Copy .env to ${APP_DIR}/.env and run deployment."
echo " Nginx Port 80 -> Docker Container 127.0.0.1:10000"
echo " Note: Re-login as ${DEPLOY_USER} for docker group permissions to take effect."
echo "=========================================="

