import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicUrl } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.renderJob.findFirst({ where: { projectId: id }, orderBy: { createdAt: "desc" } });
  if (!job) return NextResponse.json({ error: "No render job found" }, { status: 404 });
  return NextResponse.json({ job: { ...job, outputPath: await publicUrl(job.outputPath) } });
}
