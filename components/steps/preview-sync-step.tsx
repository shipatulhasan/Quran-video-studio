"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PreviewPlayer } from "@/components/steps/preview-sync/player";
import { SyncSegmentList } from "@/components/steps/preview-sync/segment-list";
import { SyncTimeline } from "@/components/steps/preview-sync/timeline";
import {
  findActiveSegmentIndex,
  SAMPLE_SYNC_SEGMENTS,
  type SyncSegment,
} from "@/components/steps/preview-sync/types";

type ApiSegment = {
  id: string;
  ayah: string;
  arabic: string;
  translation: string;
  startTime: number;
  endTime: number;
  overlayAssetPath: string | null;
};

function mapApiSegment(segment: ApiSegment): SyncSegment {
  return {
    id: segment.id,
    ayah: segment.ayah,
    arabic: segment.arabic,
    translation: segment.translation,
    start: segment.startTime,
    end: segment.endTime,
    overlayAssetPath: segment.overlayAssetPath,
  };
}

export default function PreviewSyncStep({
  onNext,
  onBack,
  initialSegments,
  projectId,
}: {
  onNext: () => void;
  onBack: () => void;
  initialSegments?: SyncSegment[];
  projectId: string | null;
}) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [segments, setSegments] = useState<SyncSegment[]>(
    initialSegments?.length ? initialSegments : SAMPLE_SYNC_SEGMENTS,
  );
  const [savedTimes, setSavedTimes] = useState<
    Record<string, { start: number; end: number }>
  >(() =>
    Object.fromEntries(
      (initialSegments ?? []).map((segment) => [
        String(segment.id),
        { start: segment.start, end: segment.end },
      ]),
    ),
  );
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const total = mediaDuration && Number.isFinite(mediaDuration)
    ? mediaDuration
    : Math.max(30, ...segments.map((segment) => segment.end));
  const activeIndex = findActiveSegmentIndex(segments, time);
  const activeSegment = segments[activeIndex];

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const element = listRef.current.children[activeIndex] as HTMLElement;
    element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void fetch(`/api/projects/${projectId}/segments`)
      .then(async (response) => {
        const data = (await response.json()) as {
          segments?: ApiSegment[];
          duration?: number | null;
          error?: string;
        };
        if (!response.ok)
          throw new Error(data.error ?? "Could not load project segments");
        if (!cancelled && data.segments?.length) {
          const nextSegments = data.segments.map(mapApiSegment);
          setMediaDuration(data.duration ?? null);
          setSegments(nextSegments);
          setSavedTimes(
            Object.fromEntries(
              nextSegments.map((segment) => [
                String(segment.id),
                { start: segment.start, end: segment.end },
              ]),
              ),
            );
        }
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load project segments",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);
  const togglePlayback = () => {
    if (!videoRef.current) {
      setPlaying((value) => !value);
      return;
    }
    if (videoRef.current.paused) void videoRef.current.play();
    else videoRef.current.pause();
  };
  const seekTo = (value: number) => {
    setTime(value);
    if (videoRef.current) videoRef.current.currentTime = value;
  };
  const updateTiming = (index: number, start: number, end: number) => {
    setSegments((previous) =>
      previous.map((segment, segmentIndex) =>
        segmentIndex === index ? { ...segment, start, end } : segment,
      ),
    );
    setSaved(false);
    setSaveError(null);
  };
  const handleTimeChange = (
    index: number,
    key: "start" | "end",
    value: string,
  ) => {
    const number = parseFloat(value);
    if (Number.isNaN(number)) return;
    const segment = segments[index];
    updateTiming(
      index,
      key === "start" ? number : segment.start,
      key === "end" ? number : segment.end,
    );
  };
  const handleRangeChange = (index: number, range: [number, number]) =>
    updateTiming(index, range[0], range[1]);
  const handleSave = async () => {
    if (!projectId) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    const changed = segments.filter((segment) => {
      const original = savedTimes[String(segment.id)];
      return (
        original &&
        (original.start !== segment.start || original.end !== segment.end)
      );
    });
    if (!changed.length) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const responses = await Promise.all(
        changed.map(async (segment) => {
          const response = await fetch(
            `/api/projects/${projectId}/segments/${segment.id}`,
            {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                startTime: segment.start,
                endTime: segment.end,
              }),
            },
          );
          const data = (await response.json()) as { error?: string };
          if (!response.ok)
            throw new Error(data.error ?? `Could not save ${segment.ayah}`);
          return segment;
        }),
      );
      setSavedTimes((previous) =>
        Object.fromEntries([
          ...Object.entries(previous),
          ...responses.map((segment) => [
            String(segment.id),
            { start: segment.start, end: segment.end },
          ]),
        ]),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save timing changes",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-[fadeIn_0.2s_ease] space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Preview &amp; Sync
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Review overlay timing and fine-tune segment start/end times before
          rendering.
        </p>
      </div>
      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {loadError}
        </div>
      )}
      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
          {saveError}
        </div>
      )}
      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,63fr)_minmax(0,37fr)]">
        <div className="min-w-0 space-y-3">
          <PreviewPlayer
            activeSegment={activeSegment}
            playing={playing}
            time={time}
            total={total}
            videoSrc={
              projectId ? `/api/projects/${projectId}/video` : undefined
            }
            videoRef={videoRef}
            onToggle={togglePlayback}
            onTimeUpdate={setTime}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false);
              setTime(0);
            }}
            onLoadedMetadata={setMediaDuration}
          />
          <SyncTimeline
            segments={segments}
            total={total}
            time={time}
            activeIndex={activeIndex}
            onSeek={seekTo}
          />
        </div>
        <div className="flex max-h-[645px] min-w-0 flex-col">
          <SyncSegmentList
            segments={segments}
            activeIndex={activeIndex}
            listRef={listRef}
            onSeek={seekTo}
            onTimeChange={handleTimeChange}
            onRangeChange={handleRangeChange}
            maxDuration={total}
          />
          <div className="mt-4 space-y-2.5 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button type="button" onClick={() => void handleSave()} disabled={saving} className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${saved ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-teal-600 text-white shadow-sm hover:bg-teal-700 disabled:cursor-wait disabled:opacity-70 dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-400"}`}>{saving ? "Saving Changes…" : saved ? "✓  Changes saved" : "▣  Save Changes"}</button>
            <div className="flex gap-2"><button type="button" onClick={onBack} className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">← &nbsp;Back</button><button type="button" onClick={onNext} className="flex-1 rounded-lg border border-teal-200 py-2 text-xs font-medium text-teal-600 transition-colors hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950">Proceed to Render&nbsp; →</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
