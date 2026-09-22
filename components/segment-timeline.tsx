import type { Project, Segment } from "@prisma/client";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type SegmentTimelineProps = { project: Project; segments: Segment[]; currentTime?: number; selectedSegmentId?: string; onRangeChange?: (segment: Segment, range: [number, number]) => void; className?: string };

export function SegmentTimeline({ project, segments, currentTime = 0, selectedSegmentId, onRangeChange, className }: SegmentTimelineProps) {
  const duration = project.duration ?? Math.max(...segments.map((segment) => segment.endTime), 1);
  return <div className={cn("space-y-4 rounded-xl border bg-card p-4", className)}><div className="relative h-10 rounded-lg bg-muted"><div className="absolute inset-y-0 left-0 rounded-lg bg-primary/15" style={{ width: `${Math.min(100, (currentTime / duration) * 100)}%` }} />{segments.map((segment) => <span key={segment.id} title={segment.ayah} className={cn("absolute inset-y-1 rounded bg-primary/70", selectedSegmentId === segment.id && "bg-primary ring-2 ring-primary/30")} style={{ left: `${(segment.startTime / duration) * 100}%`, width: `${Math.max(0.5, ((segment.endTime - segment.startTime) / duration) * 100)}%` }} />)}</div>{selectedSegmentId && (() => { const segment = segments.find((item) => item.id === selectedSegmentId); if (!segment) return null; return <div className="space-y-2"><div className="flex justify-between text-xs text-muted-foreground"><span>{segment.ayah}</span><span>{segment.startTime.toFixed(2)}s – {segment.endTime.toFixed(2)}s</span></div><Slider min={0} max={duration} step={0.01} value={[segment.startTime, segment.endTime]} onValueChange={(value) => { if (Array.isArray(value)) onRangeChange?.(segment, [value[0], value[1]]); }} /></div>; })()}</div>;
}
