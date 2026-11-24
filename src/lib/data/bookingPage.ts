// A booking link as we may give it (rule 5, D-194): never into a cinema's checkout or seat plan.
// Lagocine links Filmhouse showings straight into Filmhouse's checkout ("…/<cinema>/select-tickets?
// showtime=…"), which Filmhouse's robots.txt disallows. Such a link is cut back to the film's public
// showtimes page for that day, or dropped when no such page can be made from it. Applied to every row
// by the validator, so links in older files and kept reads are cut too. Relative import-free so the
// refresh scripts can run it under plain Node.

const CHECKOUT = /\/(?:select-tickets|seat-plan|select-guest|select-movie)(?:\/|$)/;
const SHOWTIMES = /^\/movies\/([^/]+)\/showtimes\/(\d{4}-\d{2}-\d{2})(?:\/|$)/;

/** The link as given, cut back to the film's showtimes page when it leads into Filmhouse's checkout; null if it can't be. */
export function publicBookingPage(url: string | null): string | null {
  if (url === null || !URL.canParse(url)) return url;
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, "");
  if (host !== "filmhouseng.com" || !CHECKOUT.test(parsed.pathname)) return url;
  const page = SHOWTIMES.exec(parsed.pathname);
  return page ? `https://www.filmhouseng.com/movies/${page[1]}/showtimes/${page[2]}` : null;
}
