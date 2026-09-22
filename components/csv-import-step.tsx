"use client";

import { useState } from "react";
import type { Segment } from "@prisma/client";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploadDropzone } from "@/components/file-upload-dropzone";
import { CsvPreviewTable } from "@/components/csv-preview-table";
import {
  ValidationAlert,
  type ValidationError,
} from "@/components/validation-alert";
import { toast } from "sonner";

type CsvImportStepProps = { onComplete: (segments: Segment[]) => void };

export function CsvImportStep({ onComplete }: CsvImportStepProps) {
  const [name, setName] = useState("Ramadan Recitation");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [busy, setBusy] = useState(false);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setErrors([]);
    try {
      let activeProjectId = projectId;
      if (!activeProjectId) {
        const projectResponse = await fetch("/api/projects", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const project = await projectResponse.json();
        if (!projectResponse.ok)
          throw new Error(project.error ?? "Could not create project");
        activeProjectId = project.projectId;
        setProjectId(activeProjectId);
      }
      const formData = new FormData();
      formData.append("file", file);
      const csvResponse = await fetch(`/api/projects/${activeProjectId}/csv`, {
        method: "POST",
        body: formData,
      });
      const data = await csvResponse.json();
      if (!csvResponse.ok) {
        setErrors(
          data.errors ?? [
            {
              row: 0,
              field: "csv",
              message: data.error ?? "CSV upload failed",
            },
          ],
        );
        toast.error("CSV validation failed");
        return;
      }
      setSegments(data.segments);
      toast.success(`${data.segments.length} segments uploaded`);
      onComplete(data.segments);
    } catch (error) {
      setErrors([
        {
          row: 0,
          field: "request",
          message: error instanceof Error ? error.message : "Upload failed",
        },
      ]);
      toast.error("Could not upload project");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Upload timing CSV
        </h1>
        <p className="text-sm text-muted-foreground">
          Provide structured ayah timing data to prepare overlay cards.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>
            Create the project and upload its first segment list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={upload}>
            <div className="space-y-2">
              <Label htmlFor="wizard-project-name">Project name</Label>
              <Input
                id="wizard-project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <FileUploadDropzone
              accept=".csv,text/csv"
              title={file?.name ?? "Drag & drop your CSV or click to browse"}
              description="CSV files with ayah, arabic, translation, start_time, and end_time columns."
              actionLabel={file ? "Replace file" : "Browse files"}
              onFileSelect={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <Button type="submit" disabled={!file || busy}>
              {busy ? "Validating…" : "Upload and validate CSV"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <ValidationAlert errors={errors} />
      {segments.length > 0 && (
        <>
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                All {segments.length} rows validated successfully
              </p>
              <p className="text-xs opacity-80">
                The segments are persisted in the new project.
              </p>
            </div>
          </div>
          <CsvPreviewTable segments={segments} />
        </>
      )}
    </div>
  );
}
