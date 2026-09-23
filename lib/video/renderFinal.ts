import { existsSync } from "node:fs";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import type { Segment } from "@prisma/client";

type RenderFinalOptions = {
  sourcePath: string;
  outputPath: string;
  overlayRoot: string;
  segments: Array<Pick<Segment, "segmentIndex" | "startTime" | "endTime">>;
  onProgress?: (progress: number) => void;
};

function resolveFfmpegPath() {
  const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const candidates = [
    process.env.FFMPEG_PATH,
    path.join(process.cwd(), "node_modules", "ffmpeg-static", binaryName),
  ].filter((value): value is string => Boolean(value));
  const resolved = candidates.find((candidate) => existsSync(candidate));
  if (!resolved) throw new Error(`ffmpeg binary not found. Set FFMPEG_PATH or install ffmpeg-static for ${process.platform}/${process.arch}.`);
  return resolved;
}

export function renderFinal({ sourcePath, outputPath, overlayRoot, segments, onProgress }: RenderFinalOptions) {
  if (!existsSync(sourcePath)) return Promise.reject(new Error("Source video was not found"));
  if (!segments.length) return Promise.reject(new Error("No segments are available for rendering"));

  const command = ffmpeg(sourcePath);
  const filters: Array<{ filter: string; options: Record<string, string | number>; inputs: string[]; outputs: string }> = [];
  let currentVideo = "0:v";

  for (const [index, segment] of segments.entries()) {
    const filename = `${String(segment.segmentIndex + 1).padStart(4, "0")}.png`;
    const overlayPath = path.join(overlayRoot, filename);
    if (!existsSync(overlayPath)) return Promise.reject(new Error(`Overlay asset is missing for segment ${segment.segmentIndex + 1}`));
    command.input(overlayPath);
    const nextVideo = `overlay${index}`;
    filters.push({
      filter: "overlay",
      options: { x: 0, y: 0, enable: `between(t,${segment.startTime},${segment.endTime})` },
      inputs: [currentVideo, `${index + 1}:v`],
      outputs: nextVideo,
    });
    currentVideo = nextVideo;
  }

  ffmpeg.setFfmpegPath(resolveFfmpegPath());
  return new Promise<void>((resolve, reject) => {
    command
      .complexFilter(filters, currentVideo)
      .outputOptions(["-y", "-map 0:a?", "-c:v libx264", "-c:a aac", "-pix_fmt yuv420p", "-movflags +faststart"])
      .on("start", (commandLine) => console.log("Starting final video render:", commandLine))
      .on("progress", (progress) => {
        if (typeof progress.percent === "number") onProgress?.(Math.min(100, Math.max(0, progress.percent)));
      })
      .on("error", reject)
      .on("end", () => { onProgress?.(100); resolve(); })
      .save(outputPath);
  });
}
