import { mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { renderFinal } from "@/lib/video/renderFinal";

export const runtime = "nodejs";

function storageRoot() { return process.env.STORAGE_DIR ? path.resolve(process.env.STORAGE_DIR) : path.join(process.cwd(), "public", "uploads"); }

async function runRender(projectId: string, jobId: string, segments: Array<{ segmentIndex: number; startTime: number; endTime: number }>) {
  const root = storageRoot();
  const projectDirectory = path.join(root, projectId);
  const outputPath = path.join(projectDirectory, "final.mp4");
  try {
    await db.renderJob.update({ where: { id: jobId }, data: { status: "PROCESSING", progress: 0 } });
    await renderFinal({ sourcePath: path.join(projectDirectory, "source.mp4"), outputPath, overlayRoot: path.join(projectDirectory, "overlays"), segments, onProgress: (progress) => { void db.renderJob.update({ where: { id: jobId }, data: { progress } }).catch(() => undefined); } });
    await db.renderJob.update({ where: { id: jobId }, data: { status: "DONE", progress: 100, outputPath: `/uploads/${projectId}/final.mp4` } });
  } catch (error) {
    console.error("Final video render failed", error);
    await db.renderJob.update({ where: { id: jobId }, data: { status: "FAILED", error: error instanceof Error ? error.message : "Render failed" } }).catch(() => undefined);
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({ where: { id }, include: { segments: { orderBy: { segmentIndex: "asc" }, select: { segmentIndex: true, startTime: true, endTime: true, overlayAssetPath: true } } } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!project.baseVideoPath) return NextResponse.json({ error: "Upload a background video first" }, { status: 422 });
  if (!project.segments.length) return NextResponse.json({ error: "No segments are available for rendering" }, { status: 422 });
  if (project.segments.some((segment) => !segment.overlayAssetPath)) return NextResponse.json({ error: "Generate overlay assets before rendering" }, { status: 422 });

  const job = await db.renderJob.create({ data: { projectId: id, status: "PENDING", progress: 0 } });
  await db.project.update({ where: { id }, data: { status: "RENDERING" } });
  await mkdir(path.join(storageRoot(), id), { recursive: true });
  void runRender(id, job.id, project.segments);
  return NextResponse.json({ job }, { status: 202 });
}
