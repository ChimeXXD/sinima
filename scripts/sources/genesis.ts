// Parsers and reader for Genesis's own site (genesiscinemas.com, D-122). A location page
// (/freedom-way-lekki/) holds today's programme there: the date in a hidden field, times on a
// 24-hour clock. A film page (/<site>/film/<id>/<slug>) holds that film's times at every Genesis
// location for about three days, dated "Tuesday, November 17th" with no year. Each time links to
// its booking page, /<site>/booknow/<id>, on Genesis's own site; the <site> part says which location.
import * as cheerio from "cheerio";
import { filmIdFromTitle } from "../pipeline.ts";
import { clock24h, dateNearest, lagosDay, monthNumber, showStart, withinDays, type Day } from "./dates.ts";
import { pageMissingOrSlow } from "./polite.ts";
import { clean, type ParsedPage, type RawShowing, type Reader } from "./raw.ts";

const BOOKING = /^https:\/\/genesiscinemas\.com\/([a-z0-9-]+)\/booknow\/\d+$/;
const FILM_PAGE = /^https:\/\/genesiscinemas\.com\/[a-z0-9-]+\/film\/\d+\/[a-z0-9-]*$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ROW_DATE = /^([A-Za-z]+), ([A-Za-z]+) (\d{1,2})(?:st|nd|rd|th)?$/;
const NO_SHOWTIMES = "Genesis film page: no showtimes found. Has the page layout changed?";
const VIP = /\(\s*VIP\s*\)|\bVIP\b/gi;
/** The most film pages one run reads (D-122): about 26 films were on at the four locations on 17 Nov 2026. */
export const MAX_FILM_PAGES = 30;

/** Genesis lists its VIP screen as its own film ("GHOST SOLDIER VIP", "FIVE FIGURINES(VIP)"): VIP is the format. */
export function genesisTitle(text: string): { title: string; format: string | null } {
  const tidy = clean(text) ?? "";
  if (!tidy.match(VIP)) return { title: tidy, format: null };
  const title = tidy.replace(VIP, " ").replace(/:(?=\S)/g, ": ").replace(/\s+/g, " ").replace(/\s+([:,])/g, "$1").trim();
  return { title, format: "VIP" };
}

/** "09:15" or "11:20  VIP" as a clock time. */
function time(text: string) {
  const found = clock24h((clean(text) ?? "").split(" ")[0] ?? "");
  if (!found) throw new Error(`Genesis page: cannot read the time "${clean(text)}"`);
  return found;
}

/** The location a booking link is for ("lekki-purple"); throws for a link that is not a Genesis booking page. */
function siteOf(href: string | undefined): { url: string; site: string } {
  const url = clean(href) ?? "";
  const found = BOOKING.exec(url);
  if (!found) throw new Error(`Genesis page: "${url}" is not a Genesis booking page.`);
  return { url, site: found[1] as string };
}

const rating = (text: string | undefined) => clean(text)?.toUpperCase() ?? null;

/** A time's format: the film's own (from its title), or VIP when only the time says so ("11:20  VIP"). */
const linkFormat = (format: string | null, text: string) => format ?? (/\bVIP\b/i.test(text) ? "VIP" : null);

export type GenesisLocation = { cinemaId: string; date: Day; site: string | null; films: { title: string; url: string }[]; showings: RawShowing[] };

/** https://genesiscinemas.com/<location>/ The page does not name our cinema id, so the caller gives it. */
export function parseGenesisLocation(html: string, options: { cinemaId: string }): GenesisLocation {
  const $ = cheerio.load(html);
  const day = ISO_DATE.exec($("#film_date").attr("value") ?? "");
  const section = $("#film_section");
  if (!day || section.length === 0) throw new Error("Genesis location page: no date or no programme found. Has the page layout changed?");
  const date = { year: Number(day[1]), month: Number(day[2]), day: Number(day[3]) };

  const films: GenesisLocation["films"] = [];
  const showings: RawShowing[] = [];
  const sites = new Set<string>();
  section.find(".movie-tabs").each((_, row) => {
    const heading = $(row).find("h3").first();
    const listed = clean(heading.text());
    if (!listed) throw new Error("Genesis location page: a film has no title.");
    const { title, format } = genesisTitle(listed);
    const filmUrl = clean(heading.find("a").attr("href"));
    if (filmUrl !== null && !FILM_PAGE.test(filmUrl)) throw new Error(`Genesis location page: "${filmUrl}" is not a Genesis film page.`);
    if (filmUrl !== null) films.push({ title: listed, url: filmUrl });
    $(row).find(".neworderpf a.perfbtn").each((_, link) => {
      const { url, site } = siteOf($(link).attr("href"));
      sites.add(site);
      showings.push({ cinemaId: options.cinemaId, filmTitle: title, rating: rating($(row).find(".certificate").first().text()), startsAt: showStart(date, time($(link).text())), format: linkFormat(format, $(link).text()), bookingUrl: url });
    });
  });
  if (sites.size > 1) throw new Error(`Genesis location page for ${options.cinemaId}: booking links for more than one location (${[...sites].join(", ")}). Not read.`);
  return { cinemaId: options.cinemaId, date, site: [...sites][0] ?? null, films, showings };
}

/**
 * https://genesiscinemas.com/<site>/film/<id>/<slug> Only the locations in `cinemaBySite` (Genesis
 * site -> our cinema id) are kept; Genesis's other cities are left out.
 */
export function parseGenesisFilm(html: string, options: { readOn: Day; cinemaBySite: Record<string, string> }): ParsedPage & { title: string } {
  const $ = cheerio.load(html);
  const main = $(".fw-main-row:has(.cinema-block-group)").first();
  const blocks = main.find(".cinema-block-group .cinema-block");
  if (blocks.length === 0) throw new Error(NO_SHOWTIMES);
  const listed = clean(main.find("h2.left").first().text());
  if (!listed) throw new Error("Genesis film page: the film has no title.");
  const { title, format } = genesisTitle(listed);
  const ratingItem = main.find("ul.movie-info li").filter((_, item) => clean($(item).find("i").text()) === "Rating");
  const filmRating = rating(ratingItem.text().replace(/^\s*Rating/, ""));

  const showings: RawShowing[] = [];
  blocks.each((_, block) => {
    $(block).find(".date-row").each((_, row) => {
      const text = clean($(row).children("span").first().text()) ?? "";
      const found = ROW_DATE.exec(text);
      const month = found ? monthNumber(found[2] as string) : 0;
      if (!found || month === 0) throw new Error(`Genesis film page: cannot read the date "${text}"`);
      const date = dateNearest({ month, day: Number(found[3]), weekday: found[1] as string }, options.readOn);
      $(row).find("a.perfbtn").each((_, link) => {
        const { url, site } = siteOf($(link).attr("href"));
        if (!Object.hasOwn(options.cinemaBySite, site)) return;
        showings.push({ cinemaId: options.cinemaBySite[site] as string, filmTitle: title, rating: filmRating, startsAt: showStart(date, time($(link).text())), format: linkFormat(format, $(link).text()), bookingUrl: url });
      });
    });
  });
  return { title: listed, showings, builtAt: null };
}

/** The message for a film page skipped because it was gone or slow (D-124). */
const unread = (url: string, error: unknown) => `${url} could not be read (${error instanceof Error ? error.message : String(error)}); that film has today's times only`;

/**
 * Each cinema's name in Genesis's booking links, from the data (`bookingSites`, D-124), checked
 * against the links on its location page when it has any today. Our cinema id by that name.
 */
function cinemasBySite(locations: GenesisLocation[], sites: Record<string, string>): Record<string, string> {
  const bySite: Record<string, string> = {};
  for (const { cinemaId, site: onPage } of locations) {
    const site = Object.hasOwn(sites, cinemaId) ? sites[cinemaId] : undefined;
    if (site === undefined) throw new Error(`Genesis: ${cinemaId} has no entry in bookingSites in data/sources.json.`);
    if (onPage !== null && onPage !== site) throw new Error(`Genesis: the page for ${cinemaId} books under "${onPage}", but bookingSites in data/sources.json says "${site}".`);
    if (Object.hasOwn(bySite, site)) throw new Error(`Genesis: ${bySite[site]} and ${cinemaId} are both "${site}". Check bookingSites in data/sources.json.`);
    bySite[site] = cinemaId;
  }
  return bySite;
}

/**
 * Each location page once (today there), then one film page per film on at any of them (that film
 * at every location, today and the next two days), at most `maxFilmPages`. A film past the cap
 * still has today's times from its location page, as does a film whose page shows no times (the
 * first live run met one) or is gone (404, 410) or slow (D-124); only when no film page shows any
 * does the read fail. A refusal (401, 403, 429) stops the whole read (D-77). Times that appear on
 * both are kept once. Which location a film page's link is for comes from the data, so a location
 * with nothing on today still gets its later days.
 */
export function genesisReader(maxFilmPages: number): Reader {
  return async ({ now, days, fetchText, pages, sites = {} }) => {
    const locations: GenesisLocation[] = [];
    for (const [cinemaId, url] of Object.entries(pages)) locations.push(parseGenesisLocation(await fetchText(url), { cinemaId }));
    const cinemaBySite = cinemasBySite(locations, sites);

    const rows = locations.flatMap((location) => location.showings);
    const done = new Set<string>();
    const notes: string[] = [];
    let read = 0;
    for (const film of locations.flatMap((location) => location.films)) {
      if (done.has(film.title)) continue;
      if (read === maxFilmPages) break;
      read += 1;
      done.add(film.title);
      let html: string;
      try {
        html = await fetchText(film.url);
      } catch (error) {
        if (!pageMissingOrSlow(error)) throw error;
        notes.push(unread(film.url, error));
        continue;
      }
      try {
        const page = parseGenesisFilm(html, { readOn: lagosDay(now), cinemaBySite });
        done.add(page.title);
        rows.push(...page.showings);
      } catch (error) {
        if (!(error instanceof Error) || error.message !== NO_SHOWTIMES) throw error;
        notes.push(`${film.url} showed no times; that film has today's times only`);
      }
    }
    if (read > 0 && notes.length === read) throw new Error(NO_SHOWTIMES);

    const seen = new Set<string>();
    const showings = withinDays(rows, now, days).filter((row) => {
      const key = `${row.cinemaId}|${filmIdFromTitle(row.filmTitle)}|${row.format}|${row.startsAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return [{ showings, builtAt: null, notes }];
  };
}
