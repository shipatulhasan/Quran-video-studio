import { useEffect, useState, type RefObject } from "react";
import type { SyncSegment } from "@/components/steps/preview-sync/types";

type PreviewPlayerProps = {
  activeSegment?: SyncSegment;
  playing: boolean;
  time: number;
  total: number;
  videoSrc?: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  onToggle: () => void;
  onTimeUpdate: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onLoadedMetadata: (duration: number) => void;
};

export function PreviewPlayer({
  activeSegment,
  playing,
  time,
  total,
  videoSrc,
  videoRef,
  onToggle,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnded,
  onLoadedMetadata,
}: PreviewPlayerProps) {
  const [showCenterButton, setShowCenterButton] = useState(true);

  useEffect(() => {
    if (playing) {
      setShowCenterButton(false);
      return;
    }
    setShowCenterButton(true);
    const timeout = window.setTimeout(() => setShowCenterButton(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [playing]);

  return (
    <div className="group relative aspect-video overflow-hidden rounded-xl bg-slate-900 shadow-lg ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700">
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="absolute inset-0 size-full object-cover"
          preload="metadata"
          playsInline
          controls
          onTimeUpdate={(event) =>
            onTimeUpdate(event.currentTarget.currentTime)
          }
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          onLoadedMetadata={(event) =>
            onLoadedMetadata(event.currentTarget.duration)
          }
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-teal-950" />
      )}

      {activeSegment && (
        <div className="absolute bottom-20 left-1/2 z-20 max-h-[42%] w-[88%] -translate-x-1/2 animate-[fadeIn_0.15s_ease] overflow-hidden">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/75 px-5 pb-3 pt-3 shadow-xl backdrop-blur-sm">
            <p
              className="break-words text-center text-xl leading-[1.65] text-white sm:text-2xl"
              dir="rtl"
              style={{
                fontFamily: "serif, system-ui",
                letterSpacing: "0.02em",
              }}
            >
              {activeSegment.arabic}
            </p>
            <p className="mt-1 break-words text-center text-xs leading-relaxed text-white/80 sm:text-sm">
              {activeSegment.translation}
            </p>
            <div className="mt-2 flex items-center justify-between">
              {/* <span className="text-[10px] font-mono text-white/45">
                {activeSegment.ayah}
              </span> */}
              {/* <span className="text-[10px] font-mono text-white/45">
                {time.toFixed(1)}s
              </span> */}
            </div>
          </div>
        </div>
      ) }

      <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-center pb-16">
        <button
          type="button"
          onClick={onToggle}
          className={`pointer-events-auto flex size-12 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95 ${showCenterButton ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>
      </div>
      <div className="absolute right-3 top-3 z-30 rounded-md bg-black/50 px-2 py-1 text-xs font-mono text-white/80 backdrop-blur-sm">
        {formatTime(time)} / {formatTime(total)}
      </div>
    </div>
  );
}

export function formatTime(value: number) {
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
}
