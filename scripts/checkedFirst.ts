// A hand check of a cinema's own site outranks the other sources for what it covers (D-200). Pure.
import type { Showing } from "../src/lib/data/types.ts";
import { eveningDayKey, lagosDaysFrom } from "../src/lib/time/lagos.ts";

/** How many Lagos days a hand check leads for: its times say "yesterday" the day after, "old" from the next (D-200). */
const LEADS_FOR_DAYS = 1;

/** When a row's times were really read: the original site's read for a row that came through a listing. */
const readAt = (showing: Showing) => showing.via?.fetchedAt ?? showing.fetchedAt;

/**
 * The showings with one set kept for each cinema, film and evening a hand check covers. A check
 * covers a film's evening at every cinema its source feeds (`fedBy`), as the person read every one
 * of them: a cinema it found nothing at had no times. For each, the check's set wins while it is
 * under two Lagos days old, and after that while no other source read the cinema more recently.
 * A hand-checked row that wins keeps the other source's format at the same start, as Filmhouse's
 * page names none. One log line per hand-checked source.
 */
export function checkedFirst(showings: Showing[], fedBy: Map<string, Set<string>>, now: string, log: string[]): Showing[] {
  if (fedBy.size === 0) return showings;
  const isChecked = (showing: Showing) => fedBy.has(showing.sourceId);
  // Each showing's film and evening, and its cinema with them, worked out once (an evening's day key is not free).
  const filmDays = new Map(showings.map((showing) => [showing, `${showing.filmId}|${eveningDayKey(showing.startsAt)}`]));
  const cell = (showing: Showing) => `${showing.cinemaId}|${filmDays.get(showing)}`;
  // Each check's film evenings, with when it was read.
  const checks = new Map<string, Map<string, string>>();
  for (const showing of showings.filter(isChecked)) {
    const days = checks.get(showing.sourceId) ?? new Map<string, string>();
    days.set(filmDays.get(showing) as string, showing.fetchedAt);
    checks.set(showing.sourceId, days);
  }
  // The newest read of each cinema, film and evening by the other sources.
  const otherRead = new Map<string, string>();
  for (const showing of showings.filter((s) => !isChecked(s))) {
    const at = readAt(showing);
    if ((otherRead.get(cell(showing)) ?? "") < at) otherRead.set(cell(showing), at);
  }
  const wins = (checkedAt: string, at: string) => -lagosDaysFrom(now, checkedAt) <= LEADS_FOR_DAYS || !otherRead.has(at) || (otherRead.get(at) as string) <= checkedAt;
  // The check covering an other source's row, if any: one whose source feeds its cinema and that has its film's evening.
  const coveringCheck = (showing: Showing) => {
    for (const [sourceId, days] of checks) {
      const checkedAt = days.get(filmDays.get(showing) as string);
      if (checkedAt !== undefined && fedBy.get(sourceId)!.has(showing.cinemaId)) return { sourceId, checkedAt };
    }
    return null;
  };
  const formats = new Map(showings.filter((s) => !isChecked(s) && s.format !== null).map((s) => [`${s.cinemaId}|${s.filmId}|${s.startsAt}`, s.format]));
  const replaced = new Map<string, number>();
  const setAside = new Map<string, { count: number; days: number }>();
  const kept = showings.flatMap((showing) => {
    if (isChecked(showing)) {
      if (wins(showing.fetchedAt, cell(showing))) {
        const format = showing.format ?? formats.get(`${showing.cinemaId}|${showing.filmId}|${showing.startsAt}`) ?? null;
        return [{ ...showing, format }];
      }
      const entry = setAside.get(showing.sourceId) ?? { count: 0, days: -lagosDaysFrom(now, showing.fetchedAt) };
      setAside.set(showing.sourceId, { ...entry, count: entry.count + 1 });
      return [];
    }
    const check = coveringCheck(showing);
    if (check && wins(check.checkedAt, cell(showing))) {
      replaced.set(check.sourceId, (replaced.get(check.sourceId) ?? 0) + 1);
      return [];
    }
    return [showing];
  });
  const showingsWord = (count: number) => `${count} ${count === 1 ? "showing" : "showings"}`;
  for (const [sourceId, count] of replaced) log.push(`${sourceId}: replaced ${showingsWord(count)} from other sources on the days it was checked for`);
  for (const [sourceId, { count, days }] of setAside) log.push(`${sourceId}: set aside ${showingsWord(count)} where another source read the cinema since; checked ${days} days ago`);
  return kept;
}
