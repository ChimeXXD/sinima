// Parser and reader for Veezi sessions pages (ticketing.eu.veezi.com/sessions/?siteToken=...), the
// booking engine Silverbird and Filmworld use. Its dates carry no year ("Wednesday 11, November")
// and its times are on a 12-hour clock ("6:35 PM"), so the caller says which day the page was read.
import * as cheerio from "cheerio";
import { lagosLocalToUtc } from "../../src/lib/time/lagos.ts";
import { clock12, dateNearest, lagosDay, monthNumber, withinDays, type Day } from "./dates.ts";
import { clean, type ParsedPage, type RawShowing, type Reader } from "./raw.ts";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DATE = /^([A-Za-z]+) (\d{1,2}), ([A-Za-z]+)$/;
/** Veezi's placeholder for a film not yet classified. */
const NOT_RATED = "TBC";
/** What Veezi says on a sessions page with nothing on (Silverbird Galleria since 6 Nov 2026). */
const NOTHING_ON = "No shows currently scheduled";
const VEEZI_HOST = "ticketing.eu.veezi.com";

/**
 * "Wednesday 11, November" as a full date: the year that puts it nearest the day the page was read
 * (a listing looks ahead, but a late show read just after New Year is still December's). The
 * weekday must then agree.
 */
function fullDate(text: string, readOn: Day): Day {
  const found = DATE.exec(text);
  const month = found ? monthNumber(found[3] as string) : 0;
  if (!found || month === 0) throw new Error(`Veezi page: cannot read the date "${text}"`);
  const date = dateNearest({ month, day: Number(found[2]) }, readOn);
  const weekday = WEEKDAYS[new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()];
  if (weekday !== (found[1] as string).toLowerCase()) throw new Error(`Veezi page: "${text}" is not a ${found[1]} in ${date.year}`);
  return date;
}

/** "6:35 PM" to 18:35; "12:05 AM" is five past midnight. */
function clock(text: string): { hour: number; minute: number } {
  const time = clock12(text);
  if (!time) throw new Error(`Veezi page: cannot read the time "${text}"`);
  return time;
}

export function parseVeeziSessions(html: string, options: { cinemaId: string; readOn: Day }): ParsedPage {
  const $ = cheerio.load(html);
  const films = $("#sessionsByDateConent .film");
  if (films.length === 0) {
    // A page that says nothing is on is a real answer; anything else means the layout moved.
    if (clean($("p.empty").text()) === NOTHING_ON) return { showings: [], builtAt: null };
    throw new Error("Veezi page: no films found. Has the page layout changed?");
  }

  const showings: RawShowing[] = [];
  films.each((_, film) => {
    const filmTitle = clean($(film).find("h3.title").text());
    if (!filmTitle) throw new Error("Veezi page: a film has no title.");
    const censor = clean($(film).find(".censor").first().text());
    $(film).find(".date-container").each((_, container) => {
      const date = fullDate(clean($(container).find("h4.date").text()) ?? "", options.readOn);
      $(container).find(".session-times li").each((_, session) => {
        showings.push({
          cinemaId: options.cinemaId,
          filmTitle,
          rating: censor === NOT_RATED ? null : censor,
          startsAt: lagosLocalToUtc({ ...date, ...clock(clean($(session).find("time").text()) ?? "") }),
          format: null,
          bookingUrl: clean($(session).find("a").attr("href")),
        });
      });
    });
  });
  return { showings, builtAt: null };
}

/** The siteToken of a Veezi sessions page's address; throws for any other address (a /purchase/ page is never read). */
export function veeziSiteToken(cinemaId: string, url: string): string {
  const parsed = URL.canParse(url) ? new URL(url) : null;
  const token = parsed?.searchParams.get("siteToken");
  if (!parsed || parsed.protocol !== "https:" || parsed.host !== VEEZI_HOST || parsed.pathname !== "/sessions/" || !token) {
    throw new Error(`${cinemaId}: ${url} is not a Veezi sessions page with a siteToken. Not read.`);
  }
  return token;
}

/**
 * Throws unless every booking link is a Veezi https link carrying this cinema's own siteToken:
 * Silverbird and Filmworld share Veezi's host, so the host alone does not say whose link it is.
 */
function checkLinks(page: ParsedPage, cinemaId: string, token: string): void {
  for (const { bookingUrl } of page.showings) {
    if (bookingUrl === null) continue;
    const link = URL.canParse(bookingUrl) ? new URL(bookingUrl) : null;
    if (!link || link.protocol !== "https:" || link.host !== VEEZI_HOST || link.searchParams.get("siteToken") !== token) {
      throw new Error(`Veezi page for ${cinemaId}: a booking link (${bookingUrl}) is not this cinema's (siteToken ${token}). Not read.`);
    }
  }
}

/** Every cinema's sessions page, one request each, read as of today in Lagos (Abuja's clock too). */
export const readVeezi: Reader = async ({ now, days, fetchText, pages }) => {
  const entries = Object.entries(pages).map(([cinemaId, url]) => ({ cinemaId, url, token: veeziSiteToken(cinemaId, url) }));
  const read: ParsedPage[] = [];
  for (const { cinemaId, url, token } of entries) {
    const page = parseVeeziSessions(await fetchText(url), { cinemaId, readOn: lagosDay(now) });
    checkLinks(page, cinemaId, token);
    read.push({ ...page, showings: withinDays(page.showings, now, days) });
  }
  return read;
};
