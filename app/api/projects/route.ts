import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const projectSchema = z.object({ name: z.string().trim().min(1, "Project name is required") });

export async function POST(request: Request) {
  try {
    const { name } = projectSchema.parse(await request.json());
    const project = await db.project.create({ data: { name } });
    return NextResponse.json({ projectId: project.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid project" }, { status: 400 });
    return NextResponse.json({ error: "Could not create project" }, { status: 500 });
  }
}
