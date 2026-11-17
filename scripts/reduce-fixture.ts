// Cut a saved listing page down to the markup a parser reads, before it is committed (D-24).
// Full saved pages stay in the git-ignored tmp/. Posters, synopses, scripts and styles never
// enter the repo.
//
//   node scripts/reduce-fixture.ts <source> <saved.html> <out.html> <page-url> <saved-on yyyy-mm-dd>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import * as cheerio from "cheerio";
import { bannerData } from "./sources/filmhouse.ts";

type Rule = {
  /** The one element that holds the listing. */
  keep: string;
  /** Removed from inside it, on top of ALWAYS_DROP. */
  drop: string[];
  /** Elements outside the listing that the parser also reads (a build stamp), kept ahead of it. */
  alsoKeep?: string[];
  /** Said in the fixture's header comment. */
  kept: string;
  removed: string;
  /** For a page whose listing is data in its scripts, not markup: the fixture's body, made from the saved page. */
  extract?: (saved: string) => string;
};

/** The banner fields the Filmhouse parser reads; images, trailers and genres are left out. */
const FILMHOUSE_FIELDS = ["type", "movie_id", "movie_name", "url_key", "page_link", "duration", "movie_certification_short_code", "is_booking_open", "is_coming_soon", "nearest_show_times_date"];

/** Filmhouse's banner data again, as the page ships it (one `self.__next_f` string), cut to FILMHOUSE_FIELDS. */
function filmhouseBanner(saved: string): string {
  const { location, list } = bannerData(saved);
  const items = list.map((item) => Object.fromEntries(FILMHOUSE_FIELDS.filter((key) => key in item).map((key) => [key, item[key]])));
  const payload = `"widgetId":"banner","widgetData":${JSON.stringify({ page_location: { cinema_location_name: location }, list: items })}`;
  return `<script>self.__next_f.push([1,${JSON.stringify(payload)}])</script>`;
}

// Never needed by a parser, whatever the source: code, styling and media (posters, D-08).
const ALWAYS_DROP = [
  "script", "style", "noscript", "iframe", "link", "meta", "object", "embed",
  "img", "picture", "source", "video", "audio", "svg", "canvas",
];
// Attributes that can carry a poster URL, styling or code on an element that stays.
const DROP_ATTRS = new Set(["style", "src", "srcset", "poster", "background"]);

const RULES: Record<string, Rule> = {
  // Veezi sessions pages (Silverbird): films, ratings, dates, times and purchase links.
  veezi: {
    keep: "#sessionsByDateConent",
    drop: [".poster-container"],
    kept: "titles, ratings, dates, times, links",
    removed: "page chrome, scripts, styles, the cinema banner and every poster image",
  },
  // A Veezi sessions page with nothing on: only its "No shows currently scheduled" line.
  "veezi-empty": {
    keep: "p.empty",
    drop: [],
    alsoKeep: ["h2.times-header"],
    kept: "the heading and the line saying no shows are scheduled",
    removed: "page chrome, scripts, styles and the cinema banner",
  },
  // A Genesis location page (/<location>/): today's programme there, and the date it is for.
  "genesis-location": {
    keep: "#film_section",
    drop: ["p", ".innercatdived", ".col-md-2"],
    alsoKeep: ["#film_date"],
    kept: "titles, ratings, today's times, booking and film links, and the page's date",
    removed: "page chrome, scripts, styles, the date and cinema menus, every poster image, the synopses and the hidden copy of each time list",
  },
  // A Genesis film page (/<location>/film/<id>/<slug>): the film's times at every location for a few days.
  "genesis-film": {
    keep: ".fw-main-row:has(.cinema-block-group)",
    drop: ["p", ".poster"],
    kept: "the title, rating, each location's dated times and booking links",
    removed: "page chrome, scripts, styles, the poster and the synopsis",
  },
  // Grand Cinemas' home page: the week's programme, one tab per weekday.
  grand: {
    keep: ".fw-tabs.movies",
    drop: ["p", ".col-md-2"],
    kept: "the weekday tabs, titles, ratings and each weekday's times",
    removed: "page chrome, scripts, styles, the coming-soon slider, every poster image, the synopses and ticket prices",
  },
  // Blue Pictures' home page: the "Movies Now Showing" list, with each film's times.
  bluepictures: {
    keep: '.elementor-widget-wrap:has(> .elementor-widget-movie_list):has(h2.title:contains("Movies Now Showing"))',
    drop: [".movie-image"],
    kept: "the heading, titles, times and the ticket links",
    removed: "page chrome, scripts, styles, the other sections, the coming-soon list and every poster image",
  },
  // A Reach Cinema showtimes page with its days as dated slides (Ozone, Viva, Nova; D-125), rendered.
  "reach-day": {
    keep: "main",
    drop: ["p[title]", "a[target='_blank']", ".skeleton", "h1"],
    kept: "the date slides, the cinema picked, titles, ratings, times, halls and Book Now links",
    removed: "page chrome, scripts, styles, every poster image, the synopses and the trailer links",
  },
  // A Reach Cinema showtimes page with its days as tabs (Sky; D-125), rendered after a tab was clicked.
  "reach-tabs": {
    keep: "main article",
    drop: ["p.font-nunito", "h3"],
    kept: "the date tabs (the clicked one marked), the cinema picked, titles, times, halls and film links",
    removed: "page chrome, scripts, styles, every poster image and the synopses",
  },
  // EbonyLife's /movies page, rendered after a date was clicked (D-125).
  ebonylife: {
    keep: '[class*="MovieListContainer_containerGrid"]',
    drop: ['[class*="MovieList_poster"]', '[class*="TitleDesc_text"]', '[class*="DatePicker_chevron"]'],
    kept: "the date picker, titles, times, screens and each time's booking link",
    removed: "page chrome, scripts, styles, every poster image and the synopses",
  },
  // Cinemax THC's home page "Now Showing" section, rendered after a date was clicked (D-125).
  thc: {
    keep: 'section:has(> h2:contains("Now Showing"))',
    drop: ["div:has(> img)", ".place-content-center", "input"],
    kept: "the date tabs, titles, film links and times",
    removed: "page chrome, scripts, styles, the hero slider, every poster and trailer button, the loading spinner and the search box",
  },
  // Magnificent's review.html ("Movies and showtimes"), rendered after a day was clicked (D-125).
  magnificent: {
    keep: "main.wrap",
    drop: [".pos", ".cats", "input"],
    kept: "the day tabs, the day's heading, titles, times and cinemas",
    removed: "page chrome, scripts, styles, every poster image, the category filter and the date box",
  },
  // Filmhouse's home page (D-131): its banner's data, the only films the HTML carries (its "Now
  // Showing" list is filled in the browser from CINEsync, which refuses our bot).
  "filmhouse-home": {
    keep: 'the banner\'s data in self.__next_f ("widgetId":"banner")',
    drop: [],
    extract: filmhouseBanner,
    kept: "where the banner is for, and each banner film's title, page, runtime, rating, booking and coming-soon flags and nearest showtimes date",
    removed: "all the markup (the empty Now Showing and Coming Soon sections, the menus), every image, trailer link and genre, and every other script",
  },
  // Lagocine's day page: one card per film, with every showing in Lagos that day (D-33).
  "lagocine-day": {
    keep: ".movie-grid",
    drop: [".next-popover", "button"],
    alsoKeep: ['meta[name="lagocine-built"]'],
    kept: "titles, ratings, cinemas, times, formats, booking links, and the page's build stamp",
    removed: "page chrome, scripts, styles, the pop-ups, every poster image and the embedded film descriptions",
  },
  // Lagocine's page for one cinema: one row per film, with its times for each day.
  "lagocine-cinema": {
    keep: ".programme",
    drop: [],
    alsoKeep: ['meta[name="lagocine-built"]'],
    kept: "titles, ratings, days, times, booking links, and the page's build stamp",
    removed: "page chrome, scripts, styles, every poster image and the embedded film descriptions",
  },
};

const [source, input, output, pageUrl, savedOn] = process.argv.slice(2);
const rule = source && Object.hasOwn(RULES, source) ? RULES[source] : undefined;

function fail(message: string): never {
  console.error(`reduce-fixture: ${message}`);
  process.exit(1);
}

/** A real calendar date, not just the right shape ("2026-13-45" is refused). */
function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

if (!rule || !input || !output || !pageUrl || !savedOn) {
  fail(
    "usage: node scripts/reduce-fixture.ts <source> <saved.html> <out.html> <page-url> <saved-on yyyy-mm-dd>\n" +
      `sources: ${Object.keys(RULES).join(", ")}`,
  );
}
if (!isDate(savedOn)) fail(`"${savedOn}" is not a date (yyyy-mm-dd).`);
// The header is an HTML comment: "--" inside it would end it early or make it invalid.
if (!/^https?:\/\//.test(pageUrl) || !URL.canParse(pageUrl) || pageUrl.includes("--")) {
  fail(`"${pageUrl}" is not an http(s) page URL that fits in an HTML comment.`);
}
if (resolve(input) === resolve(output)) fail("the output would overwrite the saved page.");
if (!basename(output).startsWith(savedOn)) {
  fail(`the fixture's file name must start with the date it was saved (${savedOn}-...).`);
}

let saved: string;
try {
  saved = readFileSync(input, "utf8");
} catch (error) {
  fail(`cannot read ${input}: ${error instanceof Error ? error.message : String(error)}`);
}

function reduceMarkup(saved: string, rule: Rule): string {
  const $ = cheerio.load(saved);
  const listing = $(rule.keep);
  if (listing.length !== 1) {
    fail(`"${rule.keep}" matched ${listing.length} elements in ${input}, expected 1. Has the page layout changed?`);
  }
  const extras = (rule.alsoKeep ?? []).map((selector) => {
    const found = $(selector);
    if (found.length !== 1) fail(`"${selector}" matched ${found.length} elements in ${input}, expected 1.`);
    return $.html(found);
  });
  listing.find([...ALWAYS_DROP, ...rule.drop].join(", ")).remove();
  listing.find("*").addBack().each((_, el) => {
    if (el.type !== "tag") return;
    for (const name of Object.keys(el.attribs)) {
      if (DROP_ATTRS.has(name) || name.startsWith("on")) $(el).removeAttr(name);
    }
  });
  // The page's own comments go too, so the only comment in a fixture is our header.
  listing.find("*").addBack().contents().filter((_, node) => node.type === "comment").remove();

  // Collapse the blank lines the removals leave behind.
  return [...extras, $.html(listing) ?? ""]
    .join("\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "")
    .join("\n");
}

let body: string;
try {
  body = rule.extract ? rule.extract(saved) : reduceMarkup(saved, rule);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const header = [
  "<!--",
  `  FIXTURE. A cut-down copy of ${pageUrl}`,
  `  Saved on ${savedOn} (Africa/Lagos) with one manual request. Not live data.`,
  `  Kept: ${rule.extract ? "" : "the listing element "}${rule.keep} (${rule.kept}).`,
  `  Removed: ${rule.removed}.`,
  "  Made by scripts/reduce-fixture.ts (D-24).",
  "-->",
].join("\n");

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${header}\n${body}\n`);
console.log(`reduce-fixture: wrote ${output} (${Buffer.byteLength(body)} bytes of listing markup)`);
