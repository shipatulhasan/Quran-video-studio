import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import ffmpeg from "fluent-ffmpeg";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type ProbeMetadata = { format?: { duration?: number | string }; streams?: Array<{ codec_type?: string; width?: number; height?: number; r_frame_rate?: string }> };

function resolveFfprobePath() {
  const binaryName = process.platform === "win32" ? "ffprobe.exe" : "ffprobe";
  const candidates = [
    process.env.FFPROBE_PATH,
    path.join(process.cwd(), "node_modules", "ffprobe-static", "bin", process.platform, process.arch, binaryName),
  ].filter((value): value is string => Boolean(value));
  const resolved = candidates.find((candidate) => existsSync(candidate));
  if (!resolved) throw new Error(`ffprobe binary not found. Set FFPROBE_PATH or install ffprobe-static for ${process.platform}/${process.arch}.`);
  return resolved;
}

function probeVideo(filePath: string) {
  ffmpeg.setFfprobePath(resolveFfprobePath());
  return new Promise<ProbeMetadata>((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, data) => error ? reject(error) : resolve(data as ProbeMetadata));
  });
}

function frameRate(value?: string) {
  if (!value) return null;
  const [numerator, denominator] = value.split("/").map(Number);
  if (!Number.isFinite(numerator)) return null;
  const rate = denominator ? numerator / denominator : numerator;
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({ where: { id }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "An MP4 video file is required" }, { status: 400 });
  if (file.type !== "video/mp4" && !file.name.toLowerCase().endsWith(".mp4")) return NextResponse.json({ error: "Only MP4 video files are supported" }, { status: 415 });

  const storageRoot = process.env.STORAGE_DIR ? path.resolve(process.env.STORAGE_DIR) : path.join(process.cwd(), "public", "uploads");
  const projectDirectory = path.join(storageRoot, id);
  const videoPath = path.join(projectDirectory, "source.mp4");
  try {
    await mkdir(projectDirectory, { recursive: true });
    await pipeline(Readable.fromWeb(file.stream() as never), createWriteStream(videoPath));
    const metadata = await probeVideo(videoPath);
    const videoStream = metadata.streams?.find((stream) => stream.codec_type === "video");
    const duration = Number(metadata.format?.duration);
    if (!videoStream?.width || !videoStream.height || !Number.isFinite(duration) || duration <= 0) throw new Error("Unable to read video metadata");
    const resolution = `${videoStream.width} × ${videoStream.height}`;
    const rate = frameRate(videoStream.r_frame_rate);
    const updatedProject = await db.project.update({ where: { id }, data: { baseVideoPath: `/uploads/${id}/source.mp4`, duration, resolution, frameRate: rate, status: "VIDEO_READY" } });
    return NextResponse.json({ project: updatedProject, metadata: { duration, resolution, frameRate: rate } }, { status: 201 });
  } catch (error) {
    await unlink(videoPath).catch(() => undefined);
    console.error("Video upload failed", error);
    const message = error instanceof Error && error.message.includes("ffprobe binary not found")
      ? "Video metadata tool is unavailable on the server. Install ffprobe-static or configure FFPROBE_PATH."
      : "Could not process the MP4 video";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
