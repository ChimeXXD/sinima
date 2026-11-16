import { cinemaNextLine } from "@/lib/wording/showing";

// Every sentence on Your cinemas (Figma 206:8570 Default, 206:8921 None saved).

/** Under the title: "4 saved on this phone", "None saved yet". */
export const savedCount = (n: number) => (n === 0 ? "None saved yet" : `${n} saved on this phone`);

/** The handwritten note beside it. */
export const NOTE = "your usual spots";

/** Under a folder: "Yaba · next 17:35"; with nothing left, or no times we can read, it says so (D-61, D-91). */
export function folderLine(input: { area: string; next: string | null; listed: boolean }): string {
  if (input.next) return cinemaNextLine(input.area, input.next);
  return `${input.area} · ${input.listed ? "nothing more today" : "times not available yet"}`;
}

/** None saved yet (Figma 206:8921; the action opens the list to pick from, D-106 f). */
export const EMPTY = {
  title: "Keep your usual cinemas here",
  body: "Tick the ones you go to, or tap the heart on any cinema. Their next times show up here first, and the tab bar counts them.",
  action: "Pick your cinemas",
  note: "Saved on this phone only. Nothing is sent anywhere.",
} as const;

/** The dashed card after the folders: it opens the list (D-106 f). */
export const ADD = { title: "Add your cinemas", body: "Tick them from a list, or tap a heart." } as const;

/** The + by the title, read out. */
export const addLabel = (city: string) => `Add cinemas in ${city}`;

/** The list the + opens: every cinema in the city, by area, to tick (D-106 f). */
export const PICK = (city: string) => ({ title: "Add your cinemas", subtitle: `Tick the cinemas you go to in ${city}. Saved on this phone only.`, done: "Done" });

export const FOOTER = "Saved on this phone only, soonest first. Nothing is sent anywhere, and there's no account.";
