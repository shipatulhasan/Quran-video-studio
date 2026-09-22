import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    select: {
      id: true,
      baseVideoPath: true,
      duration: true,
      resolution: true,
      frameRate: true,
      status: true,
      segments: { orderBy: { segmentIndex: "asc" } },
    },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json(project);
}
