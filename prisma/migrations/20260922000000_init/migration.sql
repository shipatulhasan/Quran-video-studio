CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'CSV_READY', 'OVERLAYS_READY', 'VIDEO_READY', 'RENDERING', 'COMPLETE');

CREATE TYPE "RenderStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseVideoPath" TEXT,
    "duration" DOUBLE PRECISION,
    "resolution" TEXT,
    "frameRate" DOUBLE PRECISION,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Segment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ayah" TEXT NOT NULL,
    "segmentIndex" INTEGER NOT NULL,
    "arabic" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,
    "overlayAssetPath" TEXT,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RenderJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "RenderStatus" NOT NULL DEFAULT 'PENDING',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outputPath" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenderJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Segment_projectId_segmentIndex_idx" ON "Segment"("projectId", "segmentIndex");

ALTER TABLE "Segment" ADD CONSTRAINT "Segment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RenderJob" ADD CONSTRAINT "RenderJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
