// Filmhouse's times read by hand on its own site (D-200). Filmhouse's ticket system (CINEsync)
// turns our bot away, so the bot never reads it; a person opens each film's day pages
// (www.filmhouseng.com/movies/<page>/showtimes/<date>?location=<location>) in a browser and writes
// what they show into data/filmhouse-checked.json. This reader turns that file into rows and never
// touches the network. Each time is "HH:MM" on the day page it was listed on (a 12:45 AM on the
// 19 Dec page is 00:45 on 19 Dec), with " Closed" when Filmhouse marks it so.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lagosDayKey, lagosLocalToUtc } from "../../src/lib/time/lagos.ts";
import type { ParsedPage, RawShowing, Reader } from "./raw.ts";

export const CHECKED_PATH = "data/filmhouse-checked.json";

const TIME = /^(\d{2}):(\d{2})( Closed)?$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z$/;
const PAGE = /^[a-z0-9-]+$/;

type CheckedFilm = { title: string; page: string; days: Record<string, Record<string, string[]>> };
type CheckedFile = { checkedAt: string; locations: Record<string, string>; films: CheckedFilm[] };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** The file's rows from today (Lagos) on. Throws on anything it cannot read exactly. */
export function parseChecked(input: unknown, now: string): ParsedPage {
  if (!isRecord(input)) throw new Error(`${CHECKED_PATH} is not an object`);
  const { checkedAt, locations, films } = input as Partial<CheckedFile>;
  if (typeof checkedAt !== "string" || !UTC.test(checkedAt)) throw new Error(`${CHECKED_PATH}: checkedAt must be a UTC time, got ${JSON.stringify(checkedAt)}`);
  // A check from the future would outrank the other sources for ever (scripts/checkedFirst.ts).
  if (Date.parse(checkedAt) > Date.parse(now)) throw new Error(`${CHECKED_PATH}: checkedAt ${checkedAt} is after now (${now})`);
  if (!isRecord(locations) || !Array.isArray(films)) throw new Error(`${CHECKED_PATH} needs "locations" and a list of "films"`);
  const today = lagosDayKey(now);
  const showings: RawShowing[] = [];
  let past = 0;
  for (const film of films) {
    if (!isRecord(film) || typeof film.title !== "string" || !isRecord(film.days)) throw new Error(`${CHECKED_PATH}: each film needs a title and its days`);
    if (typeof film.page !== "string" || !PAGE.test(film.page)) throw new Error(`${CHECKED_PATH}: ${JSON.stringify(film.page)} is not a Filmhouse film page name`);
    for (const [day, cinemas] of Object.entries(film.days)) {
      const date = DATE.exec(day);
      if (!date) throw new Error(`${CHECKED_PATH}: ${JSON.stringify(day)} is not a date (yyyy-mm-dd)`);
      if (!isRecord(cinemas)) throw new Error(`${CHECKED_PATH}: ${day} must map cinema ids to times`);
      for (const [cinemaId, times] of Object.entries(cinemas)) {
        const location = locations[cinemaId];
        if (typeof location !== "string" || !PAGE.test(location)) throw new Error(`${CHECKED_PATH}: ${cinemaId} has no Filmhouse location in "locations"`);
        if (!Array.isArray(times)) throw new Error(`${CHECKED_PATH}: ${cinemaId} on ${day} must be a list of times`);
        const bookingUrl = `https://www.filmhouseng.com/movies/${film.page}/showtimes/${day}?location=${location}`;
        for (const time of times) {
          const found = typeof time === "string" ? TIME.exec(time) : null;
          if (!found) throw new Error(`${CHECKED_PATH}: ${JSON.stringify(time)} at ${cinemaId} on ${day} is not "HH:MM" or "HH:MM Closed"`);
          if (day < today) {
            past += 1;
            continue;
          }
          const [year, month, dayOfMonth] = date.slice(1).map(Number) as [number, number, number];
          const startsAt = lagosLocalToUtc({ year, month, day: dayOfMonth, hour: Number(found[1]), minute: Number(found[2]) });
          showings.push({ cinemaId, filmTitle: film.title, rating: null, startsAt, format: null, bookingUrl, ...(found[3] ? { closed: true as const } : {}) });
        }
      }
    }
  }
  return { showings, builtAt: null, readAt: checkedAt, ...(past > 0 ? { notes: [`left out ${past} ${past === 1 ? "time" : "times"} on days before today`] } : {}) };
}

/** The hand-checked file under the run's root, as one page. */
export const readChecked: Reader = async ({ now, root = "." }) => [parseChecked(JSON.parse(readFileSync(join(root, CHECKED_PATH), "utf8")), now)];
