export type VideoMetadataValues = { duration: number; resolution: string; frameRate: number | null; size?: string; codec?: string; audio?: string };
const META: VideoMetadataValues = { duration: 1842, resolution: "1920 × 1080", frameRate: 29.97, size: "842 MB", codec: "H.264", audio: "48 kHz / Stereo" };

function formatDuration(seconds: number) { return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`; }

export function VideoMetadata({ values = META }: { values?: VideoMetadataValues }) {
  const items = { Duration: formatDuration(values.duration), Resolution: values.resolution, "Frame Rate": values.frameRate == null ? "—" : `${values.frameRate.toFixed(2)} fps`, "File Size": values.size ?? "—", "Video Codec": values.codec ?? "—", Audio: values.audio ?? "—" };
  return <div className="grid grid-cols-2 gap-2.5">{Object.entries(items).map(([label, value]) => <div key={label} className="space-y-0.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p></div>)}</div>;
}

export const VIDEO_META = { duration: formatDuration(META.duration), resolution: META.resolution, framerate: `${META.frameRate?.toFixed(2)} fps`, size: META.size ?? "—" };
