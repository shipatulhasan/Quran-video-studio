import Papa from "papaparse";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { segmentCsvRowSchema, timestampToSeconds } from "@/lib/csv/validation";

type CsvRecord = Record<string, string>;
function normalizeRecord(record: CsvRecord): CsvRecord {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key.trim().toLowerCase().replace(/\s+/g, "_"), value ?? ""]));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (!(await db.project.findUnique({ where: { id }, select: { id: true } }))) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "A CSV file is required" }, { status: 400 });

    const parsed = Papa.parse<CsvRecord>(await file.text(), { header: true, skipEmptyLines: true });
    const errors: Array<{ row: number; field: string; message: string }> = parsed.errors.map((error) => ({ row: (error.row ?? 0) + 2, field: "csv", message: error.message }));
    const records: Array<{ projectId: string; ayah: string; segmentIndex: number; arabic: string; translation: string; startTime: number; endTime: number }> = [];
    parsed.data.forEach((rawRecord, index) => {
      const row = index + 2;
      const result = segmentCsvRowSchema.safeParse(normalizeRecord(rawRecord));
      if (!result.success) { result.error.issues.forEach((issue) => errors.push({ row, field: String(issue.path[0] ?? "row"), message: issue.message })); return; }
      const startTime = timestampToSeconds(result.data.start_time);
      const endTime = timestampToSeconds(result.data.end_time);
      if (endTime <= startTime) { errors.push({ row, field: "end_time", message: "Must be after start_time" }); return; }
      records.push({ projectId: id, ayah: result.data.ayah, segmentIndex: records.length, arabic: result.data.arabic, translation: result.data.translation, startTime, endTime });
    });
    if (errors.length) return NextResponse.json({ errors }, { status: 422 });
    if (!records.length) return NextResponse.json({ error: "The CSV contains no data rows" }, { status: 422 });
    await db.segment.deleteMany({ where: { projectId: id } });
    await db.segment.createMany({ data: records });
    await db.project.update({ where: { id }, data: { status: "CSV_READY" } });
    return NextResponse.json({ segments: await db.segment.findMany({ where: { projectId: id }, orderBy: { segmentIndex: "asc" } }) }, { status: 201 });
  } catch (error) {
    console.error("CSV upload failed", error);
    return NextResponse.json({ error: "Could not process CSV upload" }, { status: 500 });
  }
}
