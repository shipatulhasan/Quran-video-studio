# SyncCaster

[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](.github/workflows/deploy.yml)
[![Next.js](https://img.shields.io/badge/Next.js%2015-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00E699?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![Docker on EC2](https://img.shields.io/badge/Docker%20on%20EC2-AWS-FF9900?style=for-the-badge&logo=docker&logoColor=white)](docker-compose.yml)

SyncCaster is a browser-based video production tool that composites timed overlay cards onto a background video and exports a broadcast-ready MP4. Upload a timing CSV, attach a background video, preview and adjust segment sync points, then render — all in one guided workflow.

## Preview

> Add screenshots here.

### Step 1 — Upload CSV

![CSV Upload](docs/step1-csv.png)

### Step 2 — Add Video

![Video Upload](docs/step2-video.png)

### Step 3 — Preview & Sync

![Preview Sync](docs/step3-sync.png)

### Step 4 — Render & Export

![Render](docs/step4-render.png)

## Features

- **4-step guided wizard** — CSV import → video upload → preview & sync → render & export
- **CSV-driven timing** — upload a structured CSV to define segment start/end times and overlay text
- **Overlay card generation** — SVG-based overlay cards rendered server-side with Sharp (Arabic + translation support)
- **Real-time render progress** — live polling of FFmpeg encoding progress with stage labels and ETA
- **Object storage support** — S3-compatible storage (Neon, Cloudflare R2, AWS S3) for videos and rendered output
- **Dark / light mode** — persisted in `localStorage`, defaults to system preference
- **Zero-Source Containerized Deployments** — Pre-built Docker images pushed to GitHub Container Registry (GHCR) and pulled directly on EC2. Zero source code is stored on the EC2 server.

## Tech Stack

| Area           | Technology                                               |
| -------------- | -------------------------------------------------------- |
| Framework      | Next.js 15 (App Router, Server Actions)                  |
| Language       | TypeScript                                               |
| UI             | Tailwind CSS v4, shadcn-style components, Lucide React   |
| State          | React `useState` / `useEffect`, `next-themes`            |
| ORM            | Prisma 6 with PostgreSQL (Neon)                          |
| Video          | System FFmpeg & FFprobe (in Docker), `fluent-ffmpeg`     |
| Image          | Sharp (SVG → PNG overlay rendering)                      |
| Storage        | Local disk or S3-compatible object storage (Neon S3)     |
| Container      | Docker, Docker Compose, GitHub Container Registry (GHCR) |
| CI/CD          | GitHub Actions, SSH, `rsync`                             |
| Deployment     | AWS EC2 (Ubuntu 22.04/24.04), Docker Compose, Nginx      |

## Project Structure

```text
synccaster/
├── app/
│   ├── api/
│   │   └── projects/
│   │       ├── route.ts                        # Create project
│   │       └── [id]/
│   │           ├── csv/route.ts                # Parse & validate CSV
│   │           ├── video/route.ts              # Upload background video
│   │           ├── segments/route.ts           # List / update segments
│   │           ├── generate-overlays/route.ts  # Render overlay PNGs
│   │           ├── render/route.ts             # Start FFmpeg render job
│   │           └── render-status/route.ts      # Poll render progress
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── sync-caster.tsx                         # Root wizard component
│   ├── app-header.tsx                          # Header with theme toggle
│   ├── app-footer.tsx
│   ├── csv-import-step.tsx                     # Step 1
│   ├── steps/
│   │   ├── video-upload-step.tsx               # Step 2
│   │   ├── preview-sync-step.tsx               # Step 3
│   │   └── render-step.tsx                     # Step 4
│   ├── step1/                                  # Step 1 sub-components
│   ├── steps/preview-sync/                     # Step 3 sub-components
│   └── ui/                                     # Base UI primitives
├── lib/
│   ├── db.ts                                   # Prisma client singleton
│   ├── storage.ts                              # S3-compatible storage helpers
│   ├── overlay/renderOverlay.ts               # SVG → PNG overlay renderer
│   └── video/renderFinal.ts                   # FFmpeg compositor
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
│   ├── ec2-bootstrap.sh                        # EC2 Docker installation & Nginx setup script
│   └── ec2-deploy.sh                           # EC2 Docker Compose pull & deploy script
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
└── .github/workflows/deploy.yml
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- PostgreSQL connection string (e.g. [Neon](https://neon.tech) free tier)
- Docker Desktop (for local container builds) **or** local Node.js + FFmpeg

### Installation

```bash
npm install
npx prisma generate
```

### Environment Variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

```env
# Required Database Connection
DATABASE_URL="postgresql://user:pass@host/db?schema=public"

# FFmpeg & FFprobe paths (set automatically inside Docker container)
FFMPEG_PATH="/usr/bin/ffmpeg"
FFPROBE_PATH="/usr/bin/ffprobe"

# S3-compatible object storage (Neon S3 / AWS S3)
S3_ENDPOINT="https://ep-xxxx.c-4.ap-southeast-1.aws.neon.tech"
S3_REGION="auto"
S3_BUCKET="synccaster-storage"
S3_ACCESS_KEY_ID="your_neon_s3_key"
S3_SECRET_ACCESS_KEY="your_neon_s3_secret"
S3_FORCE_PATH_STYLE="true"
```

---

## AWS EC2 Deployment Setup (Option A - Zero Source Code on EC2)

### 1. Server Provisioning (One-Time Bootstrap)

SSH into your fresh Ubuntu 22.04 / 24.04 LTS instance and run the bootstrap script:

```bash
# Copy scripts/ec2-bootstrap.sh to your EC2 instance and run
chmod +x ec2-bootstrap.sh
sudo ./ec2-bootstrap.sh ubuntu /var/www/synccaster
```

This automated script will:
- Install **Docker Engine** and **Docker Compose**
- Add the `ubuntu` user to the `docker` group
- Install and configure **Nginx reverse proxy** on Port 80 pointing to `http://127.0.0.1:10000` with `client_max_body_size 2048M` (2GB max upload)
- Prepare persistent volume directories (`public/uploads` and `storage`)
- Configure UFW firewall rules

---

## CI/CD Pipeline (GitHub Actions + GitHub Container Registry)

This project uses [GitHub Actions](.github/workflows/deploy.yml) for automated container builds and deployments.

### Workflow Pipeline Steps:

1. **Build & Push Docker Image (`build-and-push`)**:
   - Builds the production Docker container in CI
   - Pushes the image to **GitHub Container Registry** (`ghcr.io/your-user/synccaster:latest`)
2. **Deploy Container to EC2 (`deploy`)**:
   - Connects to EC2 via SSH using `EC2_SSH`
   - Syncs **ONLY** `docker-compose.yml` and deployment scripts to EC2 (**No source code is pushed to EC2!**)
   - **Creates `.env` on EC2 from your single `APP_ENV` GitHub secret**
   - Triggers `scripts/ec2-deploy.sh` remotely to pull the pre-built image and run `docker compose up -d`

### Required GitHub Secrets

Add the following secrets under **GitHub Repository Settings → Secrets and variables → Actions**:

| Secret Name | Description | Example / Value |
| ----------- | ----------- | --------------- |
| `EC2_HOST` | Public IP or DNS of EC2 instance | `54.210.12.34` |
| `EC2_USER` | SSH User for EC2 instance | `ubuntu` |
| `EC2_SSH` | Private SSH key for EC2 authentication (PEM format) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `APP_DIR` | Application target path on EC2 | `/var/www/synccaster` |
| `APP_ENV` | **Entire `.env` file contents** (DATABASE_URL, S3_*, etc.) | *(Paste your full `.env` file text here)* |

---

## CSV Format

SyncCaster expects a CSV with the following columns:

| Column        | Type   | Description                           |
| ------------- | ------ | ------------------------------------- |
| `ayah`        | string | Segment label (e.g. `2:255`)          |
| `arabic`      | string | Arabic text for the overlay card      |
| `translation` | string | Translation text for the overlay card |
| `startTime`   | number | Overlay start time in seconds         |
| `endTime`     | number | Overlay end time in seconds           |

Example:

```csv
ayah,arabic,translation,startTime,endTime
2:255,اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ,Allah — there is no deity except Him,2.5,7.0
```

---

## Data Model

```text
Project
  ├── id, name, status (DRAFT → CSV_READY → OVERLAYS_READY → RENDERING → COMPLETE)
  ├── baseVideoPath, duration, resolution, frameRate
  ├── Segment[]
  │     └── ayah, arabic, translation, startTime, endTime, overlayAssetPath
  └── RenderJob[]
        └── status (PENDING → PROCESSING → DONE | FAILED), progress, stage, outputPath, error
```

---

## Useful Links

- [CI/CD workflow](.github/workflows/deploy.yml)
- [Docker Compose configuration](docker-compose.yml)
- [Dockerfile](Dockerfile)
- [EC2 Bootstrap Script](scripts/ec2-bootstrap.sh)
- [EC2 Deploy Script](scripts/ec2-deploy.sh)
- [Prisma schema](prisma/schema.prisma)

