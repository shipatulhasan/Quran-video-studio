"use client";

import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { VideoMetadata, VIDEO_META } from "@/components/steps/video-upload/metadata";
import { VideoNavigation } from "@/components/steps/video-upload/navigation";
import { VideoUploadDropzone } from "@/components/steps/video-upload/dropzone";
import { VideoUploadLoading } from "@/components/steps/video-upload/loading";

type Phase = "idle" | "dragover" | "loading" | "loaded";

export default function VideoUploadStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = useCallback(() => { setPhase("loading"); setTimeout(() => setPhase("loaded"), 1100); }, []);
  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setPhase("idle"); handleFile(); }, [handleFile]);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files?.[0]) handleFile(); };

  if (phase === "loading") return <VideoUploadLoading />;
  if (phase === "idle" || phase === "dragover") return <div className="animate-[fadeIn_0.2s_ease] space-y-6"><div className="space-y-1"><h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Add Background Video</h1><p className="text-sm text-slate-500 dark:text-slate-400">Upload the MP4 recitation video that overlay cards will be synchronized to.</p></div><VideoUploadDropzone dragover={phase === "dragover"} inputRef={inputRef} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setPhase("dragover"); }} onDragLeave={() => setPhase("idle")} onDrop={handleDrop} onFileChange={handleChange} /><VideoNavigation onBack={onBack} onNext={onNext} disabled /></div>;

  return <div className="animate-[fadeIn_0.2s_ease] space-y-6"><div className="flex items-start justify-between gap-4"><div className="space-y-1"><h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Video Ready</h1><p className="text-sm text-slate-500 dark:text-slate-400">quran-recitation-mishary.mp4 · {VIDEO_META.size}</p></div><button type="button" onClick={() => setPhase("idle")} className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">Replace file</button></div><div className="flex flex-col gap-6 sm:flex-row"><div className="space-y-3 sm:w-[55%]"><div className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl bg-slate-900 shadow-md ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700"><div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-teal-950" /><div className="absolute inset-0 flex items-center justify-center"><div className="flex size-14 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm transition-colors group-hover:bg-white/20"><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg></div></div><div className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-1 text-xs font-mono font-medium text-white backdrop-blur-sm">{VIDEO_META.duration}</div><div className="absolute left-3 top-3"><span className="rounded bg-teal-600/90 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">MP4</span></div></div><p className="text-center text-xs text-slate-400 dark:text-slate-500">Click to preview · quran-recitation-mishary.mp4</p></div><div className="space-y-3 sm:w-[45%]"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">File metadata</p><VideoMetadata /><div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/40"><div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="m2 5 2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div><p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Compatible with overlay system</p></div></div></div><VideoNavigation onBack={onBack} onNext={onNext} /></div>;
}
