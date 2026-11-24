import type { Consent } from "@/lib/consent";

// The Cookie bite banner and About › Privacy (D-191, mockup/consent/). Sinima sets no cookies, so
// the banner asks to count the visit instead, and Privacy says what a count sees.

export const CONSENT = {
  label: "Counting visits",
  title: "Cookies? Not here.",
  body: "Can we count your visit instead? We’d see which films get opened, never who you are.",
  no: "No thanks",
  sure: "Sure",
  noteYes: "Thanks! Your visit counts",
  noteNo: "Not counted · change it in About",
} as const;

export const PRIVACY = {
  title: "Privacy",
  lead: "What Sinima keeps, and what it never does.",
  facts: [
    { title: "No cookies", body: "Sinima doesn’t set any. Not one." },
    { title: "Your picks stay on your phone", body: "Your city, area, theme and saved cinemas are kept in this browser. They’re never sent to us, except as the address of a page you open while visits are counted." },
    { title: "Location", body: "Asked once, to pick Lagos or Abuja, and again only when you tap “Use my location”. It never leaves your phone." },
  ],
  countTitle: "Counting visits",
  countBody:
    "With your OK, Vercel Web Analytics counts the pages you open, with your country, city, device and browser. We see totals, like “120 people opened Clayface today”. Never your name, your exact location, or anything that follows you to other sites.",
  /** The line beside the switch: what this phone has said. */
  state: (consent: Consent | null) => (consent === "yes" ? "On, on this phone" : "Off, on this phone"),
  /** The switch says what a tap will do. */
  action: (consent: Consent | null) => (consent === "yes" ? "Stop counting" : "Count my visits"),
  /** The toast after a tap, for the answer just given. */
  toast: (consent: Consent) => (consent === "yes" ? "Visits will be counted" : "Visits won’t be counted"),
} as const;
