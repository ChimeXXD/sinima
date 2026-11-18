import { formatLateTime } from "@/lib/time/lagos";
import { list } from "@/lib/wording/list";

// Every sentence on the Cinemas tab (Figma Cinemas 200:6415).

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "6 sinimas", "1 sinima". */
export const cinemaCount = (n: number) => plural(n, "sinima");

/** Handwritten under the title: "22 of them!". */
export const cinemasTitleNote = (n: number) => `${n} of them!`;

/**
 * A cinema row's second line, in pieces so the time can be a <time>: "Next at 6:00 PM · 3 films
 * tonight". `when` is null before the page knows the time (rule 3): "First at 6:00 PM · 3 films".
 * On a later day `weekday` names it ("Sunday"), and a sinima that hasn't put it up says so (D-146).
 */
export function cinemaLine(input: { next: string | null; films: number; listed: boolean; when: "tonight" | "today" | "tomorrow" | null; weekday?: string }): { lead: string; time: string | null; rest: string } {
  const { next, films, listed, when, weekday } = input;
  if (!listed) return { lead: "Times not available yet", time: null, rest: "" };
  if (weekday) return next === null ? { lead: `Hasn't listed ${weekday} yet`, time: null, rest: "" } : { lead: "First at", time: formatLateTime(next), rest: ` · ${plural(films, "film")} on ${weekday}` };
  if (next === null) {
    const lead = when === "tonight" || when === "today" ? "Nothing more today" : when === "tomorrow" ? "No times tomorrow" : "No times listed";
    return { lead, time: null, rest: "" };
  }
  return { lead: when === "tonight" || when === "today" ? "Next at" : "First at", time: formatLateTime(next), rest: ` · ${plural(films, "film")}${when ? ` ${when}` : ""}` };
}

type HeadingInput =
  | { key: "area"; area: string; count: number }
  | { key: "next"; area: string; neighbours: readonly string[] }
  | { key: "rest"; city: string }
  | { key: "all"; count: number; format: string | null };

/** A group's heading and the line under it. */
export function cinemasHeading(input: HeadingInput): { title: string; note: string } {
  switch (input.key) {
    case "area":
      return { title: `In ${input.area}`, note: `Your area · ${cinemaCount(input.count)}, soonest first` };
    case "next":
      return { title: `Next to ${input.area}`, note: list([...input.neighbours]) };
    case "rest":
      return { title: `Elsewhere in ${input.city}`, note: "Soonest first" };
    case "all":
      return { title: input.format ? `Showing in ${input.format}` : "All sinimas", note: `${cinemaCount(input.count)}, soonest first` };
  }
}

/** What each picker says it is set to. */
export const pickerValue = {
  area: (name: string | null) => name ?? "All",
  format: (tag: string | null) => tag ?? "Any",
};

/** Under the list, when a cinema on it says "Times not available yet". */
export const NO_TIMES_NOTE = "“Times not available yet”: we can't read this sinima's times yet. Check its own site.";

/** The picker sheets' titles. */
export const PICKER_SHEETS: Record<"area" | "day" | "format", { title: string; subtitle?: string }> = {
  area: { title: "Choose an area", subtitle: "Sinimas in your area come first, then the areas next to it." },
  day: { title: "Choose a day" },
  format: { title: "Choose a format" },
};
