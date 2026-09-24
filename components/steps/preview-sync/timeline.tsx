import type { SyncSegment } from "@/components/steps/preview-sync/types";

export function SyncTimeline({
  segments,
  total,
  time,
  activeIndex,
  onSeek,
}: {
  segments: SyncSegment[];
  total: number;
  time: number;
  activeIndex: number;
  onSeek: (time: number) => void;
}) {
  const pct = total === 0 ? 0 : (time / total) * 100;
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
      <div
        className="group relative h-10 cursor-pointer overflow-hidden rounded-lg"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onSeek(
            Math.max(
              0,
              Math.min(
                total,
                ((event.clientX - rect.left) / rect.width) * total,
              ),
            ),
          );
        }}
      >
        <div className="absolute inset-0 rounded-lg bg-slate-100 dark:bg-slate-800" />
        {segments.map((segment, index) => (
          <div
            key={segment.id}
            title={`${segment.ayah}: ${segment.start}–${segment.end}s`}
            className={`absolute bottom-1 top-1 rounded-md transition-all ${index === activeIndex ? "bg-teal-500 shadow-sm dark:bg-teal-400" : "bg-slate-300 group-hover:bg-slate-400 dark:bg-slate-600 dark:group-hover:bg-slate-500"}`}
            style={{
              left: `${(segment.start / total) * 100}%`,
              width: `${Math.max(((segment.end - segment.start) / total) * 100, 0.5)}%`,
            }}
          />
        ))}
        <div
          className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-teal-600 shadow-[0_0_4px_rgba(13,148,136,0.5)] dark:bg-teal-400"
          style={{ left: `${pct}%` }}
        >
          <div className="absolute -top-0.5 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-teal-600 shadow-sm dark:bg-teal-400" />
        </div>
      </div>
      <div className="relative h-4">
        {segments.map((segment, index) => (
          <span
            key={segment.id}
            className={`absolute -translate-x-1/2 text-[9px] font-mono transition-colors ${index === activeIndex ? "font-semibold text-teal-600 dark:text-teal-400" : "text-slate-400 dark:text-slate-500"}`}
            style={{ left: `${(segment.start / total) * 100}%` }}
          >
            {segment.ayah}
          </span>
        ))}
      </div>
    </div>
  );
}
