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

/** None saved yet (Figma 206:8921). */
export const EMPTY = (city: string) => ({
  title: "Keep your usual cinemas here",
  body: "Tap the heart on any cinema's page. Its next times show up here first, and the tab bar counts them.",
  action: `Browse cinemas in ${city}`,
  note: "Saved on this phone only. Nothing is sent anywhere.",
});

/** The dashed card after the folders. */
export const ADD = { title: "Save a cinema to see its times first", body: "Tap the heart on any cinema page." } as const;

/** The + by the title, read out. */
export const addLabel = (city: string) => `Find a cinema to save in ${city}`;

export const FOOTER = "Saved on this phone only, soonest first. Nothing is sent anywhere, and there's no account.";
