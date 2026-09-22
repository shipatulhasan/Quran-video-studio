import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const timingSchema = z.object({
  startTime: z.number().finite().nonnegative(),
  endTime: z.number().finite().nonnegative(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; segmentId: string }> }) {
  const { id, segmentId } = await params;
  const parsed = timingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Start and end times must be non-negative numbers" }, { status: 400 });
  const { startTime, endTime } = parsed.data;
  if (endTime <= startTime) return NextResponse.json({ error: "End time must be after start time" }, { status: 422 });

  const segment = await db.segment.findFirst({ where: { id: segmentId, projectId: id }, select: { id: true } });
  if (!segment) return NextResponse.json({ error: "Segment not found" }, { status: 404 });
  const project = await db.project.findUnique({ where: { id }, select: { duration: true } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.duration != null && endTime > project.duration) return NextResponse.json({ error: "End time cannot exceed the video duration" }, { status: 422 });

  const updated = await db.segment.update({ where: { id: segmentId }, data: { startTime, endTime } });
  return NextResponse.json({ segment: updated });
}
