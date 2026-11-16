import type { FolderTint } from "@/components/ui/Cards";
import { showingOn } from "@/lib/data/programme";
import type { ListRow } from "@/lib/data/select";

// Your cinemas (Figma 206:8570): the cinemas saved on this phone, soonest first. Each folder counts
// its showings still to start tonight and shows the films they are; one with nothing left today
// stays and shows what it showed (or tomorrow's), then come those whose times we can't read (D-61).

/** `next` and `tonight` are today's showings still to start; `films` the folder's posters; `listed` whether we have any times for it. */
export type YourCinema = { cinema: number; next: ListRow | null; tonight: number; films: number[]; listed: boolean };

const POSTERS = 3;
const filmsOf = (rows: ListRow[]) => [...new Set(rows.map((row) => row.film))].slice(0, POSTERS);

/** `saved`: cinema indexes in the order they were saved. Empty until the page knows the time (rule 3). */
export function yourCinemas(input: { rows: ListRow[]; saved: number[]; now: string | null }): YourCinema[] {
  const { rows, saved, now } = input;
  if (now === null) return [];
  const left = showingOn(rows, 0, now);
  const today = showingOn(rows, 0, now, null, true);
  const tomorrow = showingOn(rows, 1, now);
  const at = (list: ListRow[], cinema: number) => list.filter((row) => row.cinema === cinema);
  const cinemas = saved.map((cinema): YourCinema => {
    const tonight = at(left, cinema);
    const earlier = tonight.length > 0 ? [] : at(today, cinema);
    const films = filmsOf(tonight.length > 0 ? tonight : earlier.length > 0 ? earlier : at(tomorrow, cinema));
    return { cinema, next: tonight[0] ?? null, tonight: tonight.length, films, listed: rows.some((row) => row.cinema === cinema) };
  });
  // Soonest first; then nothing left today; then no times at all. Sort is stable: saved order among equals.
  const rank = (entry: YourCinema) => (entry.next ? 0 : entry.listed ? 1 : 2);
  return cinemas.sort((a, b) => rank(a) - rank(b) || (a.next && b.next ? a.next.at.localeCompare(b.next.at) : 0));
}

const TINTS: FolderTint[] = ["blue", "violet", "pink", "green"];
/** Figma's folders: Ozone green, EbonyLife blue, Genesis pink, Filmhouse violet. */
const CHAIN_TINTS: Record<string, FolderTint> = { Ozone: "green", EbonyLife: "blue", Genesis: "pink", Filmhouse: "violet" };

/** A chain's folder colour: Figma's for the chains it draws, and always the same one for the rest. */
export function folderTint(chain: string): FolderTint {
  return CHAIN_TINTS[chain] ?? TINTS[[...chain].reduce((sum, char) => sum + char.charCodeAt(0), 0) % TINTS.length]!;
}
