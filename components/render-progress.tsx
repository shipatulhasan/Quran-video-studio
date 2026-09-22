import type { RenderJob } from "@prisma/client";
import { Progress } from "@/components/ui/progress";

type RenderProgressProps = { job: RenderJob; label?: string };

export function RenderProgress({ job, label = "Rendering video" }: RenderProgressProps) {
  return <div className="space-y-2"><div className="flex items-center justify-between text-sm"><span>{label}</span><span className="font-mono text-muted-foreground">{Math.round(job.progress)}%</span></div><Progress value={job.progress} aria-label={`${label}: ${Math.round(job.progress)} percent`} /><p className="text-xs capitalize text-muted-foreground">{job.status.toLowerCase()}</p></div>;
}
