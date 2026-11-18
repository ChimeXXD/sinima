import { CITY_NAMES, type City } from "@/lib/city";
import type { CityReading, SourceStatus } from "@/lib/data/about";
import { LOGO_NOTE } from "@/lib/wording/films";

// Every sentence on About (Figma 208:9122).

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A source's status in the table: "Permission asked 11 Nov", "Not used yet", "In use". */
export function sourceStatus(status: SourceStatus): string {
  if (status.kind === "used") return "In use";
  if (status.kind === "unused") return "Not used yet";
  const [, month, day] = status.on.split("-").map(Number);
  return `Permission asked ${day} ${MONTHS[month! - 1]}`;
}

/** "In Lagos, 9 sinimas are read from their own sites and 14 through Lagocine." (D-122) */
export function cityReadingLine(city: City, { own, through, none }: CityReading): string {
  const name = CITY_NAMES[city];
  if (own === 0 && through === 0) return `${name}'s times aren't online yet.`;
  const cinemas = (n: number) => `${n} ${n === 1 ? "sinima is" : "sinimas are"}`;
  const parts = [
    own > 0 ? `${cinemas(own)} read from ${own === 1 ? "its own site" : "their own sites"}` : null,
    through > 0 ? (own > 0 ? `${through} through Lagocine` : `${cinemas(through)} read through Lagocine`) : null,
  ].filter((part) => part !== null);
  const missing = none > 0 ? ` ${none} ${none === 1 ? "has" : "have"} no times online yet.` : "";
  return `In ${name}, ${parts.join(" and ")}.${missing}`;
}

export const STEPS = [
  { title: "We read each sinima's public listings", body: "Only pages anyone can open, at most once every 5 seconds, with our name on every request." },
  { title: "Old times say so", body: "If a sinima's times are more than a day old, the page tells you, so you can check before you travel." },
  { title: "You book on the sinima's own site", body: "We never sell tickets, take a cut or add tracking to the links." },
] as const;

export const ABOUT = {
  title: "About Sinima",
  note: "made in Lagos",
  lead: "Every Lagos and Abuja sinima's times in one place, with where each time came from.",
  how: "How it works",
  sources: "Where the times come from",
  columns: ["Source", "Sinimas", "Status"],
  films: "Films and credits scenes",
  tmdb: "Posters, runtimes and Stay or Go come from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.",
  logos: "Logos and removal",
  owners: "Each sinima's name and logo belong to its owner. They're shown only to say where a time comes from.",
  removal: "Run a sinima and want your times or logo taken down? Open an issue on GitHub and we'll remove them the same day.",
  ask: "Ask for removal on GitHub",
  code: "Read the code (MIT)",
  footer: "Sinima is free and has no ads, accounts or tracking. Your city and area are kept on your phone.",
  stickers: "The film stickers are Fluent Emoji by Microsoft (MIT licence).",
} as const;

export const ISSUES_URL = LOGO_NOTE.href;
export const REPO_URL = "https://github.com/ChimeXXD/sinima";

/** 404 (Figma 208:9467). */
export const NOT_FOUND = {
  note: "this one's not showing",
  title: "We can't find that page",
  body: "The link may be old, or the film has left the sinimas. Everything showing now is on Films.",
  action: (city: string) => `See what's on in ${city}`,
} as const;
