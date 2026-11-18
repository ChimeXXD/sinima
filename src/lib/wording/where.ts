import { CITY_NAMES, type City } from "@/lib/city";
import { list } from "@/lib/wording/credits";

// Every sentence on Where are you watching? (Figma 162:215, 162:262, 162:302 and their iPad and
// desktop frames).

const SHOWN = 5;

/** A city card's line: "Lekki, Victoria Island, Ikeja, Surulere, Yaba and 7 more areas". */
export function areasLine(names: string[]): string {
  if (names.length <= SHOWN) return list(names);
  const rest = names.length - SHOWN;
  return `${names.slice(0, SHOWN).join(", ")} and ${rest} more ${rest === 1 ? "area" : "areas"}`;
}

export const continueLabel = (city: City | null) => (city ? `Continue with ${CITY_NAMES[city]}` : "Continue");
export const foundNote = (city: City) => `found you in ${CITY_NAMES[city]}!`;

export const WHERE = {
  title: "Where are you watching?",
  lead: "Showtimes for every sinima in Lagos and Abuja, in one place.",
  asking: "finding your city…",
  fallback: "We couldn't place you in Lagos or Abuja, so here's Lagos. Switch any time in the search bar.",
  locate: "Use my location",
  /** Under the buttons: on a phone while it asks, on a phone after, and on an iPad or computer. */
  footAsking: "Asked as the site opens. Location stays on the phone; only the city is kept.",
  footPhone: "Location stays on your phone and only picks the city.",
  footWide: "Location stays on your phone; only the city is kept.",
} as const;
