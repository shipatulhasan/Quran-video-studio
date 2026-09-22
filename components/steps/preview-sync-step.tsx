"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PreviewPlayer } from "@/components/steps/preview-sync/player";
import { SyncSegmentList } from "@/components/steps/preview-sync/segment-list";
import { SyncTimeline } from "@/components/steps/preview-sync/timeline";
import { findActiveSegmentIndex, SAMPLE_SYNC_SEGMENTS, type SyncSegment } from "@/components/steps/preview-sync/types";

type ApiSegment = { id: string; ayah: string; arabic: string; translation: string; startTime: number; endTime: number; overlayAssetPath: string | null };

function mapApiSegment(segment: ApiSegment): SyncSegment { return { id: segment.id, ayah: segment.ayah, arabic: segment.arabic, translation: segment.translation, start: segment.startTime, end: segment.endTime, overlayAssetPath: segment.overlayAssetPath }; }

export default function PreviewSyncStep({ onNext, onBack, initialSegments, projectId }: { onNext: () => void; onBack: () => void; initialSegments?: SyncSegment[]; projectId: string | null }) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [saved, setSaved] = useState(false);
  const [segments, setSegments] = useState<SyncSegment[]>(initialSegments?.length ? initialSegments : SAMPLE_SYNC_SEGMENTS);
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const total = mediaDuration && Number.isFinite(mediaDuration) ? mediaDuration : Math.max(30, ...segments.map((segment) => segment.end));
  const activeIndex = findActiveSegmentIndex(segments, time);
  const activeSegment = segments[activeIndex];

  useEffect(() => { if (activeIndex < 0 || !listRef.current) return; const element = listRef.current.children[activeIndex] as HTMLElement; element?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [activeIndex]);
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void fetch(`/api/projects/${projectId}/segments`).then(async (response) => {
      const data = await response.json() as { segments?: ApiSegment[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load project segments");
      if (!cancelled && data.segments?.length) setSegments(data.segments.map(mapApiSegment));
    }).catch((error: unknown) => { if (!cancelled) setLoadError(error instanceof Error ? error.message : "Could not load project segments"); });
    return () => { cancelled = true; };
  }, [projectId]);
  const togglePlayback = () => {
    if (!videoRef.current) { setPlaying((value) => !value); return; }
    if (videoRef.current.paused) void videoRef.current.play(); else videoRef.current.pause();
  };
  const seekTo = (value: number) => { setTime(value); if (videoRef.current) videoRef.current.currentTime = value; };
  const handleTimeChange = (index: number, key: "start" | "end", value: string) => { const number = parseFloat(value); if (Number.isNaN(number)) return; setSegments((previous) => previous.map((segment, segmentIndex) => segmentIndex === index ? { ...segment, [key]: number } : segment)); setSaved(false); };
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return <div className="animate-[fadeIn_0.2s_ease] space-y-6"><div className="space-y-1"><h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Preview &amp; Sync</h1><p className="text-sm text-slate-500 dark:text-slate-400">Review overlay timing and fine-tune segment start/end times before rendering.</p></div>{loadError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">{loadError}</div>}<div className="flex flex-col gap-5 lg:flex-row"><div className="space-y-3 lg:w-[63%]"><PreviewPlayer activeSegment={activeSegment} playing={playing} time={time} total={total} videoSrc={projectId ? `/uploads/${projectId}/source.mp4` : undefined} videoRef={videoRef} onToggle={togglePlayback} onTimeUpdate={setTime} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setTime(0); }} onLoadedMetadata={setMediaDuration} /><SyncTimeline segments={segments} total={total} time={time} activeIndex={activeIndex} onSeek={seekTo} /></div><SyncSegmentList segments={segments} activeIndex={activeIndex} listRef={listRef} onSeek={seekTo} onTimeChange={handleTimeChange} /></div><div className="mt-4 space-y-2.5 border-t border-slate-200 pt-4 dark:border-slate-700 lg:ml-[63%]"><button type="button" onClick={handleSave} className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${saved ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-teal-600 text-white shadow-sm hover:bg-teal-700 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"}`}>{saved ? "✓  Changes saved" : "▣  Save Changes"}</button><div className="flex gap-2"><button type="button" onClick={onBack} className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">← &nbsp;Back</button><button type="button" onClick={onNext} className="flex-1 rounded-lg border border-teal-200 py-2 text-xs font-medium text-teal-600 transition-colors hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950">Proceed to Render&nbsp; →</button></div></div></div>;
}
