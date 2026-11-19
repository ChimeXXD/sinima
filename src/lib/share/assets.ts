import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TMDB_IMAGES } from "@/lib/data/posters";

// Build time only: what the share cards are drawn with. Fonts are full TTFs kept in assets/fonts/
// (OFL, see the OFL.txt there): the site's woff2 files are cut to the letters the pages use, and
// next/og can't read woff2. Nothing is fetched for them: a card is drawn only with these fonts.

const ROOT = process.cwd();
const read = (...path: string[]) => readFileSync(join(ROOT, ...path));

type Weight = 300 | 400 | 500 | 600 | 700;
export type CardFont = { name: string; data: ArrayBuffer; weight: Weight; style: "normal" };

const buffer = (bytes: Buffer): ArrayBuffer => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const URBANIST: [Weight, string][] = [[300, "Light"], [500, "Medium"], [600, "SemiBold"], [700, "Bold"]];

let fonts: CardFont[] | undefined;
/** Urbanist Light, Medium, SemiBold and Bold, and Story Script. */
export function cardFonts(): CardFont[] {
  return (fonts ??= [
    ...URBANIST.map(([weight, style]): CardFont => ({ name: "Urbanist", data: buffer(read("assets", "fonts", `Urbanist-${style}.ttf`)), weight, style: "normal" })),
    { name: "Story Script", data: buffer(read("assets", "fonts", "StoryScript-Regular.ttf")), weight: 400, style: "normal" },
  ]);
}

/** The code points a TrueType font has glyphs for, from its cmap (formats 4 and 12). */
export function fontCodePoints(font: Buffer): Set<number> {
  const points = new Set<number>();
  const tables = font.readUInt16BE(4);
  let cmap = -1;
  for (let i = 0; i < tables; i++) if (font.toString("latin1", 12 + i * 16, 16 + i * 16) === "cmap") cmap = font.readUInt32BE(12 + i * 16 + 8);
  if (cmap < 0) throw new Error("font has no cmap");
  for (let i = 0; i < font.readUInt16BE(cmap + 2); i++) {
    const at = cmap + font.readUInt32BE(cmap + 4 + i * 8 + 4);
    const format = font.readUInt16BE(at);
    if (format === 4) {
      const segs = font.readUInt16BE(at + 6) / 2;
      const ends = at + 14;
      const starts = ends + segs * 2 + 2;
      const deltas = starts + segs * 2;
      const offsets = deltas + segs * 2;
      for (let s = 0; s < segs; s++) {
        const [end, start] = [font.readUInt16BE(ends + s * 2), font.readUInt16BE(starts + s * 2)];
        const [delta, offset] = [font.readInt16BE(deltas + s * 2), font.readUInt16BE(offsets + s * 2)];
        for (let c = start; c <= end && c !== 0xffff; c++) {
          const glyph = offset === 0 ? (c + delta) & 0xffff : font.readUInt16BE(offsets + s * 2 + offset + (c - start) * 2);
          if (glyph !== 0) points.add(c);
        }
      }
    } else if (format === 12) {
      for (let g = 0; g < font.readUInt32BE(at + 12); g++) {
        const [start, end] = [font.readUInt32BE(at + 16 + g * 12), font.readUInt32BE(at + 20 + g * 12)];
        for (let c = start; c <= end; c++) points.add(c);
      }
    }
  }
  return points;
}

let titleGlyphs: Set<number> | undefined;
/**
 * The letters of `text` the card's title font can't draw (spaces aside). next/og would fetch a
 * font from Google for them at build time, so a title with any is not drawn (cards.tsx).
 */
export function missingGlyphs(text: string): string[] {
  titleGlyphs ??= fontCodePoints(read("assets", "fonts", "Urbanist-Bold.ttf"));
  return [...new Set([...text].filter((char) => !/\s/.test(char) && !titleGlyphs!.has(char.codePointAt(0)!)))];
}

const dataUrl = (bytes: Buffer, type: string) => `data:${type};base64,${bytes.toString("base64")}`;
const cache = new Map<string, string>();
const file = (key: string, path: string[], type: string) => {
  if (!cache.has(key)) cache.set(key, dataUrl(read(...path), type));
  return cache.get(key)!;
};

/** A Keepsy sticker from public/stickers, as a data URL. */
export const sticker = (name: "popcorn" | "clapper" | "glasses" | "drink") => file(name, ["public", "stickers", `${name}.png`], "image/png");
/** The ticket sticker (the NoPoster face's) and the wordmark. */
export const ticketSticker = () => file("ticket", ["public", "stickers", "ticket.svg"], "image/svg+xml");
export const wordmark = () => file("wordmark", ["public", "brand", "wordmark.svg"], "image/svg+xml");

/** TMDB's poster size for a card: 342 px wide for a 300 px poster. */
const POSTER = "w342";

const posters = new Map<string, Promise<string | null>>();
/**
 * A film's TMDB poster as a data URL, read at build time (never a cinema site's poster). A build
 * that can't reach TMDB still finishes: the card shows the no-poster face, and the log says so.
 */
export function posterImage(path: string | null | undefined, label: string): Promise<string | null> {
  if (!path) return Promise.resolve(null);
  // A film showing in both cities has two cards: its poster is fetched once.
  if (!posters.has(path)) posters.set(path, fetchPoster(path, label));
  return posters.get(path)!;
}

async function fetchPoster(path: string, label: string): Promise<string | null> {
  try {
    const response = await fetch(`${TMDB_IMAGES}${POSTER}${path}`, { signal: AbortSignal.timeout(15_000) });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !/^image\/(jpeg|png)/.test(type)) throw new Error(`${response.status} ${type}`);
    return dataUrl(Buffer.from(await response.arrayBuffer()), type.split(";")[0]!);
  } catch (error) {
    console.warn(`share card: ${label}: TMDB poster not read (${error instanceof Error ? error.message : String(error)}); its card shows the no-poster face.`);
    return null;
  }
}
