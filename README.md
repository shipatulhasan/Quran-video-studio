# SyncCaster

[![Live App](https://img.shields.io/badge/Live%20App-Render-46E3B7?style=for-the-badge)](https://quran-video-studio.onrender.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](.github/workflows/deploy.yml)
[![Next.js](https://img.shields.io/badge/Next.js%2015-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00E699?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)

SyncCaster is a browser-based video production tool that composites timed overlay cards onto a background video and exports a broadcast-ready MP4. Upload a timing CSV, attach a background video, preview and adjust segment sync points, then render — all in one guided workflow.

**Live application:** [https://quran-video-studio.onrender.com/](https://quran-video-studio.onrender.com/)

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
- **Docker-ready** — Dockerfile with system FFmpeg for reliable deployment on Render

## Tech Stack

| Area           | Technology                                               |
| -------------- | -------------------------------------------------------- |
| Framework      | Next.js 15 (App Router, Server Actions)                  |
| Language       | TypeScript                                               |
| UI             | Tailwind CSS v4, shadcn-style components, Lucide React   |
| State          | React `useState` / `useEffect`, `next-themes`            |
| ORM            | Prisma 6 with PostgreSQL (Neon)                          |
| Video          | FFmpeg (system binary via Docker), `fluent-ffmpeg`       |
| Image          | Sharp (SVG → PNG overlay rendering)                      |
| Storage        | S3-compatible object storage (optional)                  |
| CI/CD          | GitHub Actions, Render deploy hooks                      |
| Deployment     | Render (Docker runtime)                                  |

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
├── Dockerfile
├── .dockerignore
└── .github/workflows/deploy.yml
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL connection string (e.g. [Neon](https://neon.tech) free tier)
- FFmpeg installed locally (`brew install ffmpeg` / `apt install ffmpeg`) **or** Docker

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
# Required
DATABASE_URL="postgresql://user:pass@host/db?schema=public"

# FFmpeg — leave empty to use ffmpeg-static (local dev), or set to /usr/bin/ffmpeg in Docker
FFMPEG_PATH=""

# S3-compatible object storage (optional — files stored in public/uploads/ when unset)
S3_ENDPOINT=""
S3_REGION="auto"
S3_BUCKET=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_FORCE_PATH_STYLE="true"
```

### Database Setup

```bash
npx prisma migrate deploy
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
npm run start
```

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

## API Overview

All routes are Next.js Route Handlers under `/api/projects`.

| Method | Route                                     | Purpose                          |
| ------ | ----------------------------------------- | -------------------------------- |
| POST   | `/api/projects`                           | Create a new project             |
| POST   | `/api/projects/:id/csv`                   | Upload and validate a timing CSV |
| POST   | `/api/projects/:id/video`                 | Upload the background video      |
| GET    | `/api/projects/:id/segments`              | List all segments                |
| PATCH  | `/api/projects/:id/segments/:segmentId`   | Update a segment's timing        |
| POST   | `/api/projects/:id/generate-overlays`     | Generate overlay PNG assets      |
| POST   | `/api/projects/:id/render`                | Start an FFmpeg render job       |
| GET    | `/api/projects/:id/render-status`         | Poll render job progress         |

## CI/CD and Deployment

This project uses [GitHub Actions](.github/workflows/deploy.yml) for CI/CD.

On every push to `main`, the workflow:

1. Checks out the repository
2. Sets up Node.js 20
3. Installs dependencies with `npm ci`
4. Generates the Prisma client
5. Runs the TypeScript type check (`npm run lint`)
6. Triggers the Render deploy hook to redeploy the service

Deployment is also available manually through `workflow_dispatch`.

### Render Deployment (Docker)

The `Dockerfile` in the repository root installs system FFmpeg and builds a production Next.js standalone image. Render auto-detects it when Docker is selected as the runtime.

**Required Render environment variables:**

```
DATABASE_URL
FFMPEG_PATH=/usr/bin/ffmpeg
S3_ENDPOINT
S3_BUCKET
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
```

**Required GitHub secret:**

| Secret               | Value                                    |
| -------------------- | ---------------------------------------- |
| `RENDER_DEPLOY_HOOK` | Deploy hook URL from your Render service |
| `DATABASE_URL`       | PostgreSQL connection string             |

## Data Model

```
Project
  ├── id, name, status (DRAFT → CSV_READY → OVERLAYS_READY → RENDERING → COMPLETE)
  ├── baseVideoPath, duration, resolution, frameRate
  ├── Segment[]
  │     └── ayah, arabic, translation, startTime, endTime, overlayAssetPath
  └── RenderJob[]
        └── status (PENDING → PROCESSING → DONE | FAILED), progress, stage, outputPath, error
```

## Useful Links

- [Live App](https://quran-video-studio.onrender.com/)
- [CI/CD workflow](.github/workflows/deploy.yml)
- [Dockerfile](Dockerfile)
- [Prisma schema](prisma/schema.prisma)
- [Environment example](.env.example)
