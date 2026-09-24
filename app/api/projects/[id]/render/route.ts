import { mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { overlayDimensions, renderOverlay } from "@/lib/overlay/renderOverlay";
import { renderFinal } from "@/lib/video/renderFinal";
import {
  downloadFile,
  isObjectStorageConfigured,
  isStorageRef,
  objectKey,
  uploadFile,
} from "@/lib/storage";

export const runtime = "nodejs";

function storageRoot() {
  return process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.join(process.cwd(), "public", "uploads");
}

async function runRender(
  projectId: string,
  jobId: string,
  baseVideoPath: string,
  resolution: string | null,
  segments: Array<{
    segmentIndex: number;
    startTime: number;
    endTime: number;
    ayah: string;
    arabic: string;
    translation: string;
    overlayAssetPath: string | null;
  }>,
) {
  const root = storageRoot();
  const projectDirectory = path.join(root, projectId);
  const workspace = isObjectStorageConfigured()
    ? await mkdtemp(path.join("/tmp", "fytobyte-render-"))
    : projectDirectory;
  const outputPath = path.join(workspace, "final.mp4");
  const sourcePath = isStorageRef(baseVideoPath)
    ? path.join(workspace, "source.mp4")
    : path.join(projectDirectory, "source.mp4");
  let encodingProgress = 10;
  let encodingTarget = 10;
  let progressTimer: ReturnType<typeof setInterval> | undefined;
  try {
    await db.renderJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING", progress: 0, stage: "Preparing render" },
    });
    if (isStorageRef(baseVideoPath))
      await downloadFile(baseVideoPath, sourcePath);
    const overlayDirectory = path.join(workspace, "overlays");
    await mkdir(overlayDirectory, { recursive: true });
    for (const [index, segment] of segments.entries()) {
      const filename = `${String(segment.segmentIndex + 1).padStart(4, "0")}.png`;
      const overlayPath = path.join(overlayDirectory, filename);
      // Always regenerate with the current source dimensions. This prevents
      // stale fixed-size S3 overlays from producing a left-aligned final video.
      await renderOverlay(segment, overlayPath, overlayDimensions(resolution));
      await db.renderJob.update({
        where: { id: jobId },
        data: {
          progress: Math.round(((index + 1) / segments.length) * 10),
          stage: `Preparing overlay ${index + 1} of ${segments.length}`,
        },
      });
    }
    await db.renderJob.update({
      where: { id: jobId },
      data: { progress: 10, stage: "Encoding video" },
    });
    progressTimer = setInterval(() => {
      // Complex FFmpeg filters can emit very few progress events. Advance
      // gradually toward the latest target so the UI never jumps from 10% to
      // 100% while encoding is still running.
      encodingProgress = Math.min(
        95,
        Math.max(
          encodingProgress + 1,
          Math.min(encodingTarget, encodingProgress + 3),
        ),
      );
      void db.renderJob
        .update({
          where: { id: jobId },
          data: { progress: encodingProgress, stage: "Encoding video" },
        })
        .catch(() => undefined);
    }, 1000);
    await renderFinal({
      sourcePath,
      outputPath,
      overlayRoot: overlayDirectory,
      segments,
      onProgress: (progress) => {
        encodingTarget = Math.min(95, 10 + progress * 0.9);
      },
    });
    if (progressTimer) clearInterval(progressTimer);
    await db.renderJob.update({
      where: { id: jobId },
      data: { progress: 97, stage: "Finalizing video" },
    });
    const finalRef = isObjectStorageConfigured()
      ? await uploadFile(
          outputPath,
          objectKey(projectId, "final.mp4"),
          "video/mp4",
        )
      : `/uploads/${projectId}/final.mp4`;
    await db.renderJob.update({
      where: { id: jobId },
      data: {
        status: "DONE",
        progress: 100,
        stage: "Complete",
        outputPath: finalRef,
      },
    });
  } catch (error) {
    console.error("Final video render failed", error);
    await db.renderJob
      .update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          stage: "Failed",
          error: error instanceof Error ? error.message : "Render failed",
        },
      })
      .catch(() => undefined);
  } finally {
    if (progressTimer) clearInterval(progressTimer);
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      segments: {
        orderBy: { segmentIndex: "asc" },
        select: {
          segmentIndex: true,
          startTime: true,
          endTime: true,
          overlayAssetPath: true,
          ayah: true,
          arabic: true,
          translation: true,
        },
      },
    },
  });
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!project.baseVideoPath)
    return NextResponse.json(
      { error: "Upload a background video first" },
      { status: 422 },
    );
  if (!project.segments.length)
    return NextResponse.json(
      { error: "No segments are available for rendering" },
      { status: 422 },
    );
  if (project.segments.some((segment) => !segment.overlayAssetPath))
    return NextResponse.json(
      { error: "Generate overlay assets before rendering" },
      { status: 422 },
    );

  const job = await db.renderJob.create({
    data: { projectId: id, status: "PENDING", progress: 0, stage: "Queued" },
  });
  await db.project.update({ where: { id }, data: { status: "RENDERING" } });
  await mkdir(path.join(storageRoot(), id), { recursive: true });
  void runRender(
    id,
    job.id,
    project.baseVideoPath,
    project.resolution,
    project.segments,
  );
  return NextResponse.json({ job }, { status: 202 });
}
