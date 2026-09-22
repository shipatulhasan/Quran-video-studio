import type { Project, RenderJob } from "@prisma/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RenderProgress } from "@/components/render-progress";

type RenderDownloadPanelProps = { project: Project; job: RenderJob; onRender?: () => void; onRetry?: () => void };

export function RenderDownloadPanel({ project, job, onRender, onRetry }: RenderDownloadPanelProps) {
  return <Card><CardHeader><CardTitle>Render & export</CardTitle><CardDescription>Composite the overlay cards onto {project.resolution ?? "the source video"}.</CardDescription></CardHeader><CardContent className="space-y-5">{job.status === "FAILED" && <Alert variant="destructive"><AlertTitle>Render failed</AlertTitle><AlertDescription>{job.error ?? "The render process failed."}</AlertDescription></Alert>}{job.status === "PROCESSING" || job.status === "PENDING" ? <RenderProgress job={job} /> : null}{job.status === "DONE" && job.outputPath ? <a className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground" href={job.outputPath} download>Download MP4</a> : job.status === "FAILED" ? <Button variant="destructive" onClick={onRetry}>Retry render</Button> : <Button onClick={onRender}>Render final video</Button>}</CardContent></Card>;
}
