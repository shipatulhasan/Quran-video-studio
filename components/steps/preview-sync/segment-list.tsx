import type { SyncSegment } from "@/components/steps/preview-sync/types";
import { Slider } from "@/components/ui/slider";

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-1 flex-col gap-0.5">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <div className="relative">
        <input
          type="number"
          step="0.01"
          min="0"
          defaultValue={value.toFixed(2)}
          onBlur={(event) => onChange(event.target.value)}
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-mono text-slate-700 transition-colors focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:focus:border-teal-500 dark:focus:ring-teal-400"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">
          s
        </span>
      </div>
    </label>
  );
}

export function SyncSegmentList({
  segments,
  activeIndex,
  listRef,
  onSeek,
  onTimeChange,
  onRangeChange,
  maxDuration,
  className = "",
}: {
  segments: SyncSegment[];
  activeIndex: number;
  listRef: React.RefObject<HTMLDivElement | null>;
  onSeek: (time: number) => void;
  onTimeChange: (index: number, key: "start" | "end", value: string) => void;
  onRangeChange: (index: number, range: [number, number]) => void;
  maxDuration: number;
  className?: string;
}) {
  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {segments.length} Segments
        </p>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Click to seek
        </span>
      </div>
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
      >
        {segments.map((segment, index) => {
          const active = index === activeIndex;
          return (
            <div
              key={segment.id}
              onClick={() => onSeek(segment.start)}
              className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-150 ${active ? "border-teal-300 bg-teal-50/70 shadow-sm dark:border-teal-700 dark:bg-teal-950/40" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800/50"}`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
                  >
                    {segment.ayah}
                  </span>
                  {active && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-teal-600 dark:text-teal-400">
                      <span className="size-1.5 animate-pulse rounded-full bg-teal-500" />
                      active
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  {segment.start.toFixed(1)}–{segment.end.toFixed(1)}s
                </span>
              </div>
              <p
                className="mb-1.5 text-right text-sm leading-relaxed text-slate-900 dark:text-slate-100"
                dir="rtl"
                style={{ fontFamily: "serif, system-ui", fontSize: "0.9rem" }}
              >
                {segment.arabic}
              </p>
              <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {segment.translation}
              </p>
              <div
                className="mt-3 flex items-center gap-2"
                onClick={(event) => event.stopPropagation()}
              >
                <TimeInput
                  label="Start"
                  value={segment.start}
                  onChange={(value) => onTimeChange(index, "start", value)}
                />
                <div className="h-px w-3 shrink-0 bg-slate-300 dark:bg-slate-600" />
                <TimeInput
                  label="End"
                  value={segment.end}
                  onChange={(value) => onTimeChange(index, "end", value)}
                />
              </div>
              <div
                className="mt-3 px-1"
                onClick={(event) => event.stopPropagation()}
              >
                <Slider
                  min={0}
                  max={maxDuration}
                  step={0.01}
                  value={[segment.start, segment.end]}
                  onValueChange={(value) => {
                    if (Array.isArray(value) && value.length === 2)
                      onRangeChange(index, [value[0], value[1]]);
                  }}
                  aria-label={`Timing for ${segment.ayah}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
