import type { Project } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

type VideoMetadataBadgesProps = { project: Project };

export function VideoMetadataBadges({ project }: VideoMetadataBadgesProps) {
  const values = [{ label: "Duration", value: project.duration == null ? "—" : `${Math.floor(project.duration / 60)}:${String(Math.floor(project.duration % 60)).padStart(2, "0")}` }, { label: "Resolution", value: project.resolution ?? "—" }, { label: "Frame rate", value: project.frameRate == null ? "—" : `${project.frameRate.toFixed(2)} fps` }];
  return <div className="flex flex-wrap gap-2">{values.map((item) => <Badge variant="secondary" key={item.label}><span className="mr-1 text-muted-foreground">{item.label}</span>{item.value}</Badge>)}</div>;
}
