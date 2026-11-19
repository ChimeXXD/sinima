// The Home Screen guide's words (D-162, mockup/home-screen/).

export const HOME_SHEET = {
  title: "Keep Sinima on your Home Screen",
  why: "It opens like an app: pull down for new times, and Add to calendar goes straight to Calendar.",
  whyAndroid: "It opens like an app: pull down for new times, and Add to calendar goes straight to your calendar.",
  notNow: "Not now",
  gotIt: "Got it",
  add: "Add to Home Screen",
} as const;

export const HOME_CARD = {
  title: "Keep Sinima on your Home Screen",
  why: "It opens like an app, and you can pull down for new times.",
  show: "Show me how",
  close: "Close",
} as const;

/** The sheet "Show me how" opens. */
export const HOME_STEPS_TITLE = "Add Sinima to your Home Screen";

export type HomeStep = { title: string; note?: string; glyph: "share" | "add" | "menu" | "word"; word?: string };

/** The steps on an iPhone (Safari's Share, under ••• on newer ones), or in a browser on Android (its menu). */
export function homeSteps(phone: "ios" | "android"): HomeStep[] {
  if (phone === "android") {
    return [
      { title: "Open your browser's menu", note: "In Chrome, ⋮ at the top right", glyph: "menu" },
      { title: "Tap Add to Home screen", note: "Some browsers say Install app", glyph: "add" },
      { title: "Tap Add", glyph: "word", word: "Add" },
    ];
  }
  return [
    { title: "Tap Share", note: "On newer iPhones, it's under •••", glyph: "share" },
    { title: "Tap Add to Home Screen", note: "Scroll down the list if you don't see it", glyph: "add" },
    { title: "Tap Add", glyph: "word", word: "Add" },
  ];
}
