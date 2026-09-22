const META = { duration: "30:42", resolution: "1920 × 1080", framerate: "29.97 fps", size: "842 MB", codec: "H.264", audio: "48 kHz / Stereo" };

export function VideoMetadata() {
  return <div className="grid grid-cols-2 gap-2.5">{Object.entries({ Duration: META.duration, Resolution: META.resolution, "Frame Rate": META.framerate, "File Size": META.size, "Video Codec": META.codec, Audio: META.audio }).map(([label, value]) => <div key={label} className="space-y-0.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p></div>)}</div>;
}

export const VIDEO_META = META;
