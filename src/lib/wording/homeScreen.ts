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

export type HomeStep = { title: string; note?: string; glyph: "share" | "add" | "menu" | "more" | "word"; word?: string };

/** Which browser's steps: Safari on an iPhone or iPad, Chrome on an iPhone, another iPhone browser, or Android. */
export type HomeBrowser = "safari" | "ipad" | "chrome-ios" | "other-ios" | "android";

/**
 * The browser, from its user agent; null inside an app's own browser (Instagram, Facebook and the
 * like), which can't add to the Home Screen, so the guide stays away. An iPad says Macintosh; `touch`
 * (navigator.maxTouchPoints > 1) tells it from a Mac.
 */
export function homeBrowser(ua: string, touch = false): HomeBrowser | null {
  if (/Instagram|FBAN|FBAV|FB_IAB|Line\/|Snapchat|TikTok|musical_ly|BytedanceWebview/i.test(ua)) return null;
  if (/Android/i.test(ua)) return "android";
  if (/CriOS/.test(ua)) return "chrome-ios";
  if (/FxiOS|EdgiOS|OPiOS|OPT\/|DuckDuckGo|YaBrowser|GSA\//.test(ua)) return "other-ios";
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touch)) return "ipad";
  return "safari";
}

/**
 * The steps to add Sinima, in the browser's own words (D-163): Safari on an iPhone keeps Share under
 * More (•••), Chrome on an iPhone next to the address bar, an iPad at the top right, a browser on
 * Android in its menu. "•••" in a title is drawn but not read aloud: a screen reader hears "More".
 */
export function homeSteps(browser: HomeBrowser): HomeStep[] {
  const add: HomeStep = { title: "Tap Add", glyph: "word", word: "Add" };
  if (browser === "android") {
    return [
      { title: "Open your browser's menu", note: "In Chrome, ⋮ at the top right", glyph: "menu" },
      { title: "Tap Add to Home screen", note: "Some browsers say Install app", glyph: "add" },
      add,
    ];
  }
  const toHome: HomeStep = { title: "Tap Add to Home Screen", note: "Scroll down the list if you don't see it", glyph: "add" };
  const share: Record<Exclude<HomeBrowser, "android">, HomeStep> = {
    safari: { title: "Tap More (•••), then Share", note: "Older iPhones: Share is in the bar", glyph: "more" },
    ipad: { title: "Tap Share", note: "At the top right, or under •••", glyph: "share" },
    "chrome-ios": { title: "Tap Share", note: "Next to the address bar", glyph: "share" },
    "other-ios": { title: "Tap Share", note: "In your browser's menu or bar", glyph: "share" },
  };
  return [share[browser], toHome, add];
}
