import { formatDate, lagosNoon } from "@/lib/time/lagos";
import { list } from "@/lib/wording/list";

// Coming soon's words (D-151): the section on Films, a card's line and date sticker, and a coming
// film's page. `firstDay` is the sinima's own first date, a Lagos date ("2026-12-18"), or null when
// it gives none: then "Date not announced", never a guess (rule 8). Dates are read in Lagos.

// The section's heading is in films.ts, which the Films page's script carries anyway; this file's
// date and calendar words are used only on the server.
export { COMING_SECTION } from "@/lib/wording/films";

/** "Fri 18 Dec". */
const opening = (firstDay: string) => formatDate(lagosNoon(firstDay));

/** Under a card's title: "Opens Fri 18 Dec", or "Date not announced". */
export const opensLine = (firstDay: string | null) => (firstDay ? `Opens ${opening(firstDay)}` : "Date not announced");

/** The calendar leaf on a poster: the month over the day, "Dec" over "18". Only for a dated film. */
export function leafWords(firstDay: string): { month: string; day: string } {
  // formatDate's "Fri 18 Dec": its day and month, so the month names live in one place (lib/time/lagos).
  const [, day, month] = formatDate(lagosNoon(firstDay)).split(" ");
  return { month: month!, day: day! };
}

/** The chip under a coming film's title: "Opens Fri 18 Dec at Filmhouse". */
export const opensChip = (firstDay: string | null, sinimas: string[]) => (firstDay ? `Opens ${opening(firstDay)} at ${list(sinimas)}` : `Coming to ${list(sinimas)}, date not announced`);

/** Who lists it, and who will put the times up: one sinima by name, more as "they". */
function whose(sinimas: string[]) {
  const one = sinimas.length === 1;
  return { names: list(sinimas), lists: one ? "lists" : "list", its: one ? "its" : "their", Its: one ? "Its" : "Their", puts: one ? `${sinimas[0]} puts` : "they put" };
}

/** In place of the times on a coming film's page. */
export function timesNotUp(film: string, sinimas: string[], firstDay: string | null): string {
  const w = whose(sinimas);
  const when = firstDay ? `from ${opening(firstDay)}` : "as coming soon, with no date yet";
  return `Times aren't up yet. ${w.names} ${w.lists} ${film} ${when}; ${w.its} times will show here as soon as ${w.puts} them up.`;
}

/** The calendar button on a coming film's page: "Add 18 Dec to my calendar". Only for a dated film. */
export function calendarAction(firstDay: string): string {
  const { month, day } = leafWords(firstDay);
  return `Add ${day} ${month} to my calendar`;
}

/**
 * The all-day calendar event for a coming film's first day (lib/ics buildAllDayIcs): its words, a UID
 * that is the same each time (adding it again updates one event). Its file is /cal/ (D-160).
 */
export function comingCalendar(input: { film: string; filmId: string; sinimas: string[]; firstDay: string; city: string; url: string }) {
  const { film, filmId, sinimas, firstDay, city, url } = input;
  const w = whose(sinimas);
  return {
    uid: `opens-${city}-${filmId}@sinima`,
    day: firstDay,
    summary: `${film} opens at ${w.names}`,
    description: `${w.names} ${w.lists} ${film} from ${opening(firstDay)}. ${w.Its} times will be on Sinima as soon as ${w.puts} them up: ${url}`,
    alert: `${film} opens today at ${w.names}`,
  };
}
