"use client";

import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import type { Segment } from "@prisma/client";
import { ColumnSpec } from "@/components/step1/column-spec";
import { Step1ErrorBanner } from "@/components/step1/error-banner";
import { Step1GeneratingPreview } from "@/components/step1/generating-preview";
import { Step1Header } from "@/components/step1/step1-header";
import { Step1LoadingTable } from "@/components/step1/loading-table";
import { Step1UploadDropzone } from "@/components/step1/upload-dropzone";
import { Step1ValidatedTable } from "@/components/step1/validated-table";
import type { Step1Row } from "@/components/step1/types";
import type { ValidationError } from "@/components/validation-alert";

type Phase = "idle" | "dragover" | "loaded" | "generating" | "done";

type CsvImportStepProps = {
  onNext: () => void;
  onComplete?: (segments: Segment[]) => void;
};

function mapSegment(segment: Segment): Step1Row {
  return {
    id: segment.id,
    ayah: segment.ayah,
    seg: segment.segmentIndex + 1,
    arabic: segment.arabic,
    translation: segment.translation,
    start: segment.startTime.toFixed(2),
    end: segment.endTime.toFixed(2),
  };
}

function formatFileSize(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function asValidationErrors(value: unknown): ValidationError[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const error = item as Record<string, unknown>;
    return [{
      row: typeof error.row === "number" ? error.row : 0,
      field: typeof error.field === "string" ? error.field : "csv",
      message: typeof error.message === "string" ? error.message : "Invalid CSV row",
    }];
  });
}

export default function CsvImportStep({ onNext, onComplete }: CsvImportStepProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [genCount, setGenCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Step1Row[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const uploadFile = useCallback(async (selectedFile: File) => {
    setLoading(true);
    setErrors([]);
    setFile(selectedFile);
    setPhase("idle");
    const minimumWait = new Promise<void>((resolve) => setTimeout(resolve, 900));

    try {
      let activeProjectId = projectId;
      if (!activeProjectId) {
        const projectResponse = await fetch("/api/projects", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "Quran Video Project" }),
        });
        const project = (await projectResponse.json()) as { projectId?: string; error?: string };
        if (!projectResponse.ok || !project.projectId) throw new Error(project.error ?? "Could not create project");
        activeProjectId = project.projectId;
        setProjectId(activeProjectId);
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      const csvResponse = await fetch(`/api/projects/${activeProjectId}/csv`, { method: "POST", body: formData });
      const data = (await csvResponse.json()) as { segments?: Segment[]; errors?: unknown; error?: string };
      await minimumWait;

      if (!csvResponse.ok || !data.segments) {
        const apiErrors = asValidationErrors(data.errors);
        setErrors(apiErrors.length ? apiErrors : [{ row: 0, field: "csv", message: data.error ?? "CSV upload failed" }]);
        setPhase("idle");
        return;
      }

      setSegments(data.segments);
      setRows(data.segments.map(mapSegment));
      onComplete?.(data.segments);
      setPhase("loaded");
    } catch (error) {
      await minimumWait;
      setErrors([{ row: 0, field: "request", message: error instanceof Error ? error.message : "Upload failed" }]);
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  }, [onComplete, projectId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) void uploadFile(selectedFile);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const selectedFile = event.dataTransfer.files?.[0];
    setPhase("idle");
    if (selectedFile) void uploadFile(selectedFile);
  };

  const handleGenerate = async () => {
    setPhase("generating");
    setProgress(0);
    setGenCount(0);
    let count = 0;
    timerRef.current = setInterval(() => {
      count += 1;
      setGenCount(count);
      setProgress(Math.round((count / rows.length) * 100));
      if (count >= rows.length) {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 320);

    try {
      if (!projectId) throw new Error("This CSV is not attached to a project");
      const response = await fetch(`/api/projects/${projectId}/generate-overlays`, { method: "POST" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Overlay generation failed");
      if (timerRef.current) clearInterval(timerRef.current);
      setGenCount(rows.length);
      setProgress(100);
      setTimeout(() => {
        setPhase("done");
        onNext();
      }, 500);
    } catch (error) {
      if (timerRef.current) clearInterval(timerRef.current);
      setErrors([{ row: 0, field: "overlays", message: error instanceof Error ? error.message : "Overlay generation failed" }]);
      setPhase("idle");
    }
  };

  if (loading) {
    return <div className="space-y-6"><Step1Header title="Parsing CSV…" subtitle="Reading and validating your timing data." /><Step1LoadingTable /></div>;
  }

  if (phase === "idle" || phase === "dragover") {
    return (
      <div className="animate-[fadeIn_0.2s_ease] space-y-6">
        <Step1Header title="Upload Timing CSV" subtitle="Provide a structured CSV file with ayah timing data to generate overlay cards." />
        <Step1ErrorBanner errors={errors} />
        <Step1UploadDropzone
          dragover={phase === "dragover"}
          inputRef={inputRef}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setPhase("dragover"); }}
          onDragLeave={() => setPhase("idle")}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
        />
        <ColumnSpec />
      </div>
    );
  }

  if (phase === "generating") return <Step1GeneratingPreview rows={rows} count={genCount} progress={progress} />;

  return (
    <div className="animate-[fadeIn_0.2s_ease] space-y-6">
      <div className="flex items-start justify-between gap-4">
        <Step1Header title="CSV Validated" subtitle={`${rows.length} segments · ${file?.name ?? "Al-Fatihah.csv"} · ${file ? formatFileSize(file.size) : "2.1 KB"}`} />
        <button type="button" onClick={() => { setPhase("idle"); setErrors([]); if (inputRef.current) inputRef.current.value = ""; }} className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">Replace file</button>
      </div>
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/40">
        <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        <div><p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">All {rows.length} rows validated successfully</p><p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-500">No formatting errors or missing required fields detected.</p></div>
      </div>
      <Step1ValidatedTable rows={rows} />
      <div className="flex items-center justify-end gap-3">
        {phase === "done" ? (
          <button type="button" onClick={onNext} className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400">Continue to Add Video<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7-7" /></svg></button>
        ) : (
          <button type="button" onClick={handleGenerate} className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400">Generate Overlay Cards<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg></button>
        )}
      </div>
    </div>
  );
}
