import sharp from "sharp";
import type { Segment } from "@prisma/client";

const WIDTH = 1920;
const HEIGHT = 1080;
const CARD_WIDTH = 1500;
const CARD_X = (WIDTH - CARD_WIDTH) / 2;

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

export async function renderOverlay(segment: Pick<Segment, "arabic" | "translation" | "ayah">, outputPath: string) {
  const arabicLines = wrapText(segment.arabic, 28);
  const translationLines = wrapText(segment.translation, 64);
  const cardHeight = 150 + arabicLines.length * 76 + translationLines.length * 38;
  const cardY = HEIGHT - cardHeight - 86;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs><clipPath id="cardClip"><rect x="${CARD_X}" y="${cardY}" width="${CARD_WIDTH}" height="${cardHeight}" rx="28"/></clipPath></defs>
    <rect x="${CARD_X}" y="${cardY}" width="${CARD_WIDTH}" height="${cardHeight}" rx="28" fill="#000000" fill-opacity="0.78" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2"/>
    <g clip-path="url(#cardClip)">
      ${textLines(arabicLines, WIDTH / 2, cardY + 92, 76, 'fill="#ffffff" font-family="Arial, Noto Naskh Arabic, sans-serif" font-size="58" text-anchor="middle" direction="rtl"')}
      ${textLines(translationLines, WIDTH / 2, cardY + 112 + arabicLines.length * 76, 38, 'fill="#ffffff" fill-opacity="0.82" font-family="Arial, sans-serif" font-size="28" text-anchor="middle"')}
      <text x="${CARD_X + 48}" y="${cardY + cardHeight - 34}" fill="#ffffff" fill-opacity="0.45" font-family="monospace" font-size="22">${escapeXml(segment.ayah)}</text>
    </g>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outputPath);
}
