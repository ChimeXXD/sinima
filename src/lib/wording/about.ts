import type { SourceStatus } from "@/lib/data/about";
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

export const STEPS = [
  { title: "We read each cinema's public listings", body: "Only pages anyone can open, at most once every 5 seconds, with our name on every request." },
  { title: "Old times say so", body: "If a cinema's times are more than a day old, the page tells you, so you can check before you travel." },
  { title: "You book on the cinema's own site", body: "We never sell tickets, take a cut or add tracking to the links." },
] as const;

export const ABOUT = {
  title: "About Sinima",
  note: "made in Lagos",
  lead: "Every Lagos and Abuja cinema's times in one place, with where each time came from.",
  how: "How it works",
  sources: "Where the times come from",
  lagos: "Until a source says yes, Lagos shows saved sample pages.",
  columns: ["Source", "Cinemas", "Status"],
  abuja: "Abuja's cinemas and sources are being researched. Until then, Abuja shows sample data.",
  films: "Films and credits scenes",
  tmdb: "Posters, runtimes and Stay or Go come from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.",
  logos: "Logos and removal",
  owners: "Cinema names and logos belong to their owners. They're shown only to say where a time comes from.",
  removal: "Run a cinema and want your times or logo taken down? Open an issue on GitHub and we'll remove them the same day.",
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
  body: "The link may be old, or the film has left the cinemas. Everything showing now is on Films.",
  action: (city: string) => `See what's on in ${city}`,
} as const;
