import { mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { renderOverlay } from "@/lib/overlay/renderOverlay";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({ where: { id }, include: { segments: { orderBy: { segmentIndex: "asc" } } } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!project.segments.length) return NextResponse.json({ error: "Upload and validate CSV segments first" }, { status: 422 });

  const storageRoot = process.env.STORAGE_DIR ? path.resolve(process.env.STORAGE_DIR) : path.join(process.cwd(), "public", "uploads");
  const overlayDirectory = path.join(storageRoot, id, "overlays");
  try {
    await mkdir(overlayDirectory, { recursive: true });
    const generatedSegments = [];
    for (const segment of project.segments) {
      const filename = `${String(segment.segmentIndex + 1).padStart(4, "0")}.png`;
      await renderOverlay(segment, path.join(overlayDirectory, filename));
      const assetPath = `/uploads/${id}/overlays/${filename}`;
      generatedSegments.push(await db.segment.update({ where: { id: segment.id }, data: { overlayAssetPath: assetPath } }));
    }
    await db.project.update({ where: { id }, data: { status: "OVERLAYS_READY" } });
    return NextResponse.json({ projectId: id, segments: generatedSegments, count: generatedSegments.length }, { status: 201 });
  } catch (error) {
    console.error("Overlay generation failed", error);
    return NextResponse.json({ error: "Could not generate overlay assets" }, { status: 500 });
  }
}
