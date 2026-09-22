import type { Segment } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SegmentCardProps = { segment: Segment; active?: boolean; onTimingChange?: (segment: Segment, field: "startTime" | "endTime", value: number) => void };

export function SegmentCard({ segment, active = false, onTimingChange }: SegmentCardProps) {
  return <Card className={active ? "border-primary ring-1 ring-primary/20" : ""}><CardContent className="space-y-3 p-4"><div className="flex items-center justify-between gap-2"><Badge variant={active ? "default" : "outline"}>{segment.ayah}</Badge><span className="font-mono text-xs text-muted-foreground">{segment.startTime.toFixed(1)}–{segment.endTime.toFixed(1)}s</span></div><p dir="rtl" className="text-right leading-relaxed">{segment.arabic}</p><p className="line-clamp-2 text-sm text-muted-foreground">{segment.translation}</p><div className="grid grid-cols-2 gap-2"><label className="space-y-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Start<Input type="number" step="0.01" value={segment.startTime} onChange={(event) => onTimingChange?.(segment, "startTime", Number(event.target.value))} /></label><label className="space-y-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">End<Input type="number" step="0.01" value={segment.endTime} onChange={(event) => onTimingChange?.(segment, "endTime", Number(event.target.value))} /></label></div></CardContent></Card>;
}
