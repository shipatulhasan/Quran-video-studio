"use client";

import { useEffect, useRef, useState } from "react";
import { DoneRenderState, ErrorRenderState, IdleRenderState, QueuedRenderState, RenderingState } from "@/components/steps/render/render-states";

type Phase = "idle" | "queued" | "rendering" | "done" | "error";
type RenderJobResponse = { id: string; status: "PENDING" | "PROCESSING" | "DONE" | "FAILED"; progress: number; stage: string | null; outputPath: string | null; error: string | null };

export default function RenderStep({ onBack, projectId, segmentCount = 7 }: { onBack: () => void; projectId: string | null; segmentCount?: number }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("FFmpeg process failed while rendering the final video.");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRender = async () => {
    if (!projectId) { setErrorMessage("This render is not attached to a project."); setPhase("error"); return; }
    setPhase("queued"); setProgress(0); setEta(""); setDownloadUrl(null); setJobId(null); setErrorMessage("FFmpeg process failed while rendering the final video.");
    try {
      const response = await fetch(`/api/projects/${projectId}/render`, { method: "POST" });
      const data = await response.json() as { job?: RenderJobResponse; error?: string };
      if (!response.ok || !data.job) throw new Error(data.error ?? "Could not start render");
      setJobId(data.job.id);
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Could not start render"); setPhase("error"); }
  };

  useEffect(() => {
    if (!projectId || !jobId || phase === "done" || phase === "error" || phase === "idle") return;
    const poll = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/render-status`);
        const data = await response.json() as { job?: RenderJobResponse; error?: string };
        if (!response.ok || !data.job) throw new Error(data.error ?? "Could not read render status");
        const job = data.job;
        setProgress(job.progress);
        if (job.status === "PENDING") setPhase("queued");
        if (job.status === "PROCESSING") { setPhase("rendering"); const remaining = Math.round((100 - job.progress) / 100 * 38); setEta(job.stage ? `${job.stage}${remaining > 0 ? ` · ~${remaining}s remaining` : " · Finalizing…"}` : (remaining > 0 ? `~${remaining}s remaining` : "Finalizing…")); }
        if (job.status === "DONE") { setProgress(100); setDownloadUrl(job.outputPath); setPhase("done"); }
        if (job.status === "FAILED") { setErrorMessage(job.error ?? "FFmpeg process failed while rendering the final video."); setPhase("error"); }
      } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Could not read render status"); setPhase("error"); }
    };
    void poll();
    pollingRef.current = setInterval(() => void poll(), 1000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [jobId, phase, projectId]);

  const resetRender = () => { setPhase("idle"); setProgress(0); setJobId(null); setDownloadUrl(null); };
  return <div className="flex flex-col items-center space-y-6 py-4"><div className="w-full max-w-[600px] space-y-6"><div className="space-y-1 text-center"><h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Render &amp; Export</h1><p className="text-sm text-slate-500 dark:text-slate-400">Composite overlay cards onto the background video and export the final MP4.</p></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Render configuration</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[["Output Format", "MP4 (H.264)"], ["Resolution", "1920 × 1080"], ["Frame Rate", "29.97 fps"], ["Segments", `${segmentCount} overlay cards`], ["Duration", "30:42"], ["Audio", "Passthrough AAC"]].map(([label, value]) => <div key={label} className="space-y-0.5"><p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p><p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{value}</p></div>)}</div></div><div className="px-6 py-8">{phase === "idle" && <IdleRenderState onRender={() => void startRender()} />}{phase === "queued" && <QueuedRenderState />}{phase === "rendering" && <RenderingState progress={progress} eta={eta} />}{phase === "done" && <DoneRenderState downloadUrl={downloadUrl} onRenderAgain={resetRender} />}{phase === "error" && <ErrorRenderState message={errorMessage} onRetry={() => void startRender()} />}</div></div>{(phase === "idle" || phase === "done") && <div className="flex items-center justify-center gap-3"><button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">← Back to Sync</button>{phase === "idle" && <><span className="text-slate-300 dark:text-slate-700">·</span><button type="button" onClick={() => { setErrorMessage("Preview error state"); setPhase("error"); }} className="text-sm text-slate-400 transition-colors hover:text-red-500 dark:text-slate-500">Preview error state</button></>}</div>}</div></div>;
}
