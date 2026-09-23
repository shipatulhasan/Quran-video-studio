import sharp from "sharp";
import type { Segment } from "@prisma/client";

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[character] ?? character);
}

function wrapText(value: string, maxCharacters: number) {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > maxCharacters) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function textLines(lines: string[], x: number, firstBaseline: number, lineHeight: number, attributes: string) {
  return lines.map((line, index) => `<text x="${x}" y="${firstBaseline + index * lineHeight}" ${attributes}>${escapeXml(line)}</text>`).join("");
}

export async function renderOverlay(
  segment: Pick<Segment, "arabic" | "translation" | "ayah">,
  outputPath: string,
  dimensions: { width: number; height: number } = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
) {
  const width = Math.max(1, dimensions.width);
  const height = Math.max(1, dimensions.height);
  const scale = width / DEFAULT_WIDTH;
  const cardWidth = width * 0.88;
  const cardX = (width - cardWidth) / 2;
  // Font and card scale together. Keeping these limits stable preserves the
  // same line width at every output resolution.
  const arabicLines = wrapText(segment.arabic, 28);
  const translationLines = wrapText(segment.translation, 64);
  const cardHeight = 150 * scale + arabicLines.length * 76 * scale + translationLines.length * 38 * scale;
  const cardY = height - cardHeight - 86 * scale;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><clipPath id="cardClip"><rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="${28 * scale}"/></clipPath></defs>
    <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="${28 * scale}" fill="#000000" fill-opacity="0.78" stroke="#ffffff" stroke-opacity="0.12" stroke-width="${2 * scale}"/>
    <g clip-path="url(#cardClip)">
      ${textLines(arabicLines, width / 2, cardY + 92 * scale, 76 * scale, `fill="#ffffff" font-family="Arial, Noto Naskh Arabic, sans-serif" font-size="${58 * scale}" text-anchor="middle" direction="rtl"`)}
      ${textLines(translationLines, width / 2, cardY + (112 + arabicLines.length * 76) * scale, 38 * scale, `fill="#ffffff" fill-opacity="0.82" font-family="Arial, sans-serif" font-size="${28 * scale}" text-anchor="middle"`)}
      <text x="${cardX + 48 * scale}" y="${cardY + cardHeight - 34 * scale}" fill="#ffffff" fill-opacity="0.45" font-family="monospace" font-size="${22 * scale}">${escapeXml(segment.ayah)}</text>
    </g>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outputPath);
}
