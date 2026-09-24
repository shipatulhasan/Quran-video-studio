"use client";

import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { VideoMetadata, type VideoMetadataValues } from "@/components/steps/video-upload/metadata";
import { VideoNavigation } from "@/components/steps/video-upload/navigation";
import { VideoUploadDropzone } from "@/components/steps/video-upload/dropzone";
import { VideoUploadLoading } from "@/components/steps/video-upload/loading";

type Phase = "idle" | "dragover" | "loading" | "loaded";

export default function VideoUploadStep({ onNext, onBack, projectId }: { onNext: () => void; onBack: () => void; projectId: string | null }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState("background-video.mp4");
  const [metadata, setMetadata] = useState<VideoMetadataValues | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = useCallback(async (file: File) => {
    if (!projectId) { setError("Upload and validate a CSV before adding a video."); return; }
    setPhase("loading"); setError(null);
    const minimumWait = new Promise<void>((resolve) => setTimeout(resolve, 1100));
    try {
      const formData = new FormData(); formData.append("file", file);
      const response = await fetch(`/api/projects/${projectId}/video`, { method: "POST", body: formData });
      const data = await response.json() as { metadata?: VideoMetadataValues; error?: string };
      await minimumWait;
      if (!response.ok || !data.metadata) throw new Error(data.error ?? "Video upload failed");
      setFilename(file.name); setMetadata({ ...data.metadata, size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, codec: "H.264", audio: "Passthrough" }); setPhase("loaded");
    } catch (uploadError) { await minimumWait; setError(uploadError instanceof Error ? uploadError.message : "Video upload failed"); setPhase("idle"); }
  }, [projectId]);
  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setPhase("idle"); const file = event.dataTransfer.files?.[0]; if (file) void handleFile(file); }, [handleFile]);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) void handleFile(file); };

  if (phase === "loading") return <VideoUploadLoading />;
  if (phase === "idle" || phase === "dragover") return <div className="animate-[fadeIn_0.2s_ease] space-y-6"><div className="space-y-1"><h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Add Background Video</h1><p className="text-sm text-slate-500 dark:text-slate-400">Upload the MP4 video that overlay cards will be synchronized to.</p></div>{error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">{error}</div>}<VideoUploadDropzone dragover={phase === "dragover"} inputRef={inputRef} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setPhase("dragover"); }} onDragLeave={() => setPhase("idle")} onDrop={handleDrop} onFileChange={handleChange} /><VideoNavigation onBack={onBack} onNext={onNext} disabled /></div>;

  return <div className="animate-[fadeIn_0.2s_ease] space-y-6"><div className="flex items-start justify-between gap-4"><div className="space-y-1"><h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Video Ready</h1><p className="text-sm text-slate-500 dark:text-slate-400">{filename} · {metadata?.size ?? "—"}</p></div><button type="button" onClick={() => setPhase("idle")} className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">Replace file</button></div><div className="flex flex-col gap-6 sm:flex-row"><div className="space-y-3 sm:w-[55%]"><div className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl bg-slate-900 shadow-md ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700"><div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-teal-950" /><div className="absolute inset-0 flex items-center justify-center"><div className="flex size-14 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm transition-colors group-hover:bg-white/20"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg></div></div><div className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-1 text-xs font-mono font-medium text-white backdrop-blur-sm">{metadata ? `${Math.floor(metadata.duration / 60)}:${String(Math.floor(metadata.duration % 60)).padStart(2, "0")}` : "—"}</div><div className="absolute left-3 top-3"><span className="rounded bg-teal-600/90 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">MP4</span></div></div><p className="text-center text-xs text-slate-400 dark:text-slate-500">Click to preview · {filename}</p></div><div className="space-y-3 sm:w-[45%]"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">File metadata</p><VideoMetadata values={metadata ?? undefined} /><div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/40"><div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="m2 5 2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div><p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Compatible with overlay system</p></div></div></div><VideoNavigation onBack={onBack} onNext={onNext} /></div>;
}
