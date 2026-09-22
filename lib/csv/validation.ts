import { z } from "zod";

export const timestampPattern = /^\d{2}:\d{2}:\d{2}\.\d{3}$/;
export const segmentCsvRowSchema = z.object({
  ayah: z.string().trim().min(1, "Ayah is required"),
  arabic: z.string().trim().min(1, "Arabic text is required"),
  translation: z.string().trim().min(1, "Translation is required"),
  start_time: z.string().trim().regex(timestampPattern, "Use HH:MM:SS.mmm"),
  end_time: z.string().trim().regex(timestampPattern, "Use HH:MM:SS.mmm"),
});

export function timestampToSeconds(value: string) {
  const [hours, minutes, seconds] = value.split(":");
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}
