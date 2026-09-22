"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type Segment = { id: string; ayah: string; arabic: string; translation: string; startTime: number; endTime: number };
type ValidationError = { row: number; field: string; message: string };

export default function CsvUploadPage() {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<File | null>(null); const [segments, setSegments] = useState<Segment[]>([]); const [errors, setErrors] = useState<ValidationError[]>([]); const [busy, setBusy] = useState(false);
  async function uploadCsv() {
    if (!file) return; setBusy(true); setErrors([]); const formData = new FormData(); formData.append("file", file);
    const response = await fetch(`/api/projects/${id}/csv`, { method: "POST", body: formData }); const data = await response.json();
    if (!response.ok) { setErrors(data.errors ?? [{ row: 0, field: "csv", message: data.error ?? "Upload failed" }]); toast.error("CSV could not be uploaded"); }
    else { setSegments(data.segments); toast.success(`${data.segments.length} segments uploaded`); }
    setBusy(false);
  }
  return <main className="mx-auto max-w-6xl p-8"><p className="text-sm tracking-[.3em] text-muted-foreground">STEP 1 / 4</p><h1 className="mt-3 text-4xl font-bold">Import timed ayahs</h1><Card className="mt-8"><CardHeader><CardTitle>Upload CSV</CardTitle><CardDescription>Required columns: ayah, arabic, translation, start_time, end_time. Timestamps use HH:MM:SS.mmm.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end"><Input className="max-w-md" type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><Button onClick={uploadCsv} disabled={!file || busy}>{busy ? "Validating…" : "Upload CSV"}</Button></CardContent></Card>{errors.length > 0 && <Alert variant="destructive" className="mt-6"><AlertTitle>CSV validation failed</AlertTitle><AlertDescription><ul className="list-disc space-y-1 pl-5">{errors.map((error, index) => <li key={`${error.row}-${error.field}-${index}`}>Row {error.row}, {error.field}: {error.message}</li>)}</ul></AlertDescription></Alert>}{segments.length > 0 && <Card className="mt-6"><CardHeader><CardTitle>Segment preview</CardTitle><CardDescription>{segments.length} validated rows are persisted for this project.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Ayah</TableHead><TableHead>Arabic</TableHead><TableHead>Translation</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead></TableRow></TableHeader><TableBody>{segments.map((segment, index) => <TableRow key={segment.id}><TableCell>{index + 1}</TableCell><TableCell>{segment.ayah}</TableCell><TableCell dir="rtl" className="min-w-48 text-right">{segment.arabic}</TableCell><TableCell className="min-w-56">{segment.translation}</TableCell><TableCell>{segment.startTime.toFixed(3)}s</TableCell><TableCell>{segment.endTime.toFixed(3)}s</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>}</main>;
}
