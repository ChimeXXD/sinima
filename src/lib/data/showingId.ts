import type { Showing, ShowtimesFile } from "@/lib/data/types";

// D-156: the files a page loads leave out each showing's id when it is the usual one, about a
// quarter of a city file gzipped; every reader (load.ts at build time, fetchDay in the browser)
// puts it back, so the rest of the code always sees an id.

/** A showing's id: `<cinemaId>_<filmId>_<startsAt>` (DATA §Showings). */
export const showingId = ({ cinemaId, filmId, startsAt }: Pick<Showing, "cinemaId" | "filmId" | "startsAt">) => `${cinemaId}_${filmId}_${startsAt}`;

/** The file as written for a page: an id that is the usual one is left out; any other stays. */
export function withoutShowingIds(file: ShowtimesFile): ShowtimesFile {
  const showings = file.showings.map((showing) => {
    if (showing.id !== showingId(showing)) return showing;
    const rest: Partial<Showing> = { ...showing };
    delete rest.id;
    return rest as Showing;
  });
  return { ...file, showings };
}

/** The file as read: each showing without an id gets the usual one back, as its first key. */
export function withShowingIds(file: ShowtimesFile): ShowtimesFile {
  if (file.showings.every((showing) => typeof showing.id === "string")) return file;
  const showings = file.showings.map((showing): Showing => {
    if (typeof showing.id === "string") return showing;
    const rest: Partial<Showing> = { ...showing };
    delete rest.id;
    return { id: showingId(showing), ...(rest as Omit<Showing, "id">) };
  });
  return { ...file, showings };
}
