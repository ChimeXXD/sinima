import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { APIRequestContext, Page } from "@playwright/test";

/** The registry's areas and their cities (D-120); read, as Playwright's loader won't import JSON. */
const registry = JSON.parse(readFileSync(join(import.meta.dirname, "../../data/cinemas.json"), "utf8")) as { areas: { slug: string; city: string }[] };

// The built site runs on sample data dated the day it was built and the day after (D-20). Tests
// freeze the browser's clock on the day after, which always holds a full programme whatever time
// the build ran.

export type DataFile = {
  generatedAt: string;
  cinemas: { id: string; name: string; area: string }[];
  films: { id: string; title: string; posterPath?: string | null }[];
  showings: { cinemaId: string; filmId: string; startsAt: string; format: string | null; fetchedAt: string }[];
};

const HOUR = 3_600_000;

/** A built data file: "all", an area's slug, or "lagos" / "abuja" for all.json cut to that city's cinemas (D-120). */
export async function dataFile(request: APIRequestContext, name: string): Promise<DataFile> {
  const city = name === "lagos" || name === "abuja" ? name : null;
  const file = (await (await request.get(`/data/${city ? "all" : name}.json`)).json()) as DataFile;
  if (!city) return file;
  const areas = new Set(registry.areas.filter((area) => area.city === city).map((area) => area.slug));
  const cinemas = file.cinemas.filter((cinema) => areas.has(cinema.area));
  const ids = new Set(cinemas.map((cinema) => cinema.id));
  const showings = file.showings.filter((showing) => ids.has(showing.cinemaId));
  const films = new Set(showings.map((showing) => showing.filmId));
  return { ...file, cinemas, showings, films: file.films.filter((film) => films.has(film.id)) };
}

/** The instant of `hh:mm` Lagos time on the sample data's second day. Lagos is UTC+1 all year. */
export async function sampleTime(request: APIRequestContext, hhmm: string): Promise<Date> {
  const { generatedAt } = await dataFile(request, "all");
  const nextDay = new Date(Date.parse(`${lagosDay(generatedAt)}T00:00:00Z`) + 24 * HOUR).toISOString().slice(0, 10);
  return new Date(Date.parse(`${nextDay}T${hhmm}:00Z`) - HOUR);
}

/** Freezes the page's clock; call before `page.goto`. */
export async function freeze(page: Page, at: Date): Promise<void> {
  await page.clock.install({ time: at });
  await page.clock.pauseAt(at);
}

/** "19:30" in Lagos for a UTC instant: to find a showing by its clock time. */
export const lagosClock = (iso: string) => new Date(Date.parse(iso) + HOUR).toISOString().slice(11, 16);
/** "7:30 PM", as the screen shows a time (D-114). Playwright reads the no-break space as a space. */
export const shownClock = (iso: string) => {
  const [hour, minute] = lagosClock(iso).split(":").map(Number) as [number, number];
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
};
/** The Lagos calendar day, "2026-11-12", of a UTC instant. */
export const lagosDay = (iso: string) => new Date(Date.parse(iso) + HOUR).toISOString().slice(0, 10);

/** The showings that have not started at `now` and fall on the same Lagos day, in time order. */
export function today(file: DataFile, now: Date): DataFile["showings"] {
  const day = lagosDay(now.toISOString());
  return file.showings.filter((s) => Date.parse(s.startsAt) > now.getTime() && lagosDay(s.startsAt) === day).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** Cinema ids in the order of their next showing. */
export function cinemasBySoonest(rows: DataFile["showings"]): string[] {
  return [...new Set(rows.map((s) => s.cinemaId))];
}
