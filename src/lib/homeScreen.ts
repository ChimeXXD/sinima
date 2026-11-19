// When the Home Screen guide shows (D-162): the sheet (A) on a second visit, the card at the end of
// Films (B), never on a first visit. Pure: the guide keeps this in the phone's storage, nothing more.

export type GuideState = {
  /** Visits on this phone: a page seen 30 minutes or more after the last one starts a new visit. */
  visits: number;
  /** The last page seen (a time in ms). */
  seenAt: number;
  /** The visit the sheet last showed in: once a visit at most. */
  shownVisit: number;
  /** The sheet waits until then (a time in ms): 14 days after Not now. */
  sheetAfter: number;
  /** How many times the sheet was put off. Twice: never again. */
  notNow: number;
  /** The sheet is done: Got it, or the app was added. */
  sheetDone: boolean;
  /** The card was closed, or the app was added. */
  cardDone: boolean;
};

export const FRESH: GuideState = { visits: 0, seenAt: 0, shownVisit: 0, sheetAfter: 0, notNow: 0, sheetDone: false, cardDone: false };

const SNOOZE_MS = 14 * 86_400_000;
/** A page seen this long after the last one is a new visit. Not the browser's session: Safari on an iPhone keeps a tab's session for days. */
const VISIT_GAP_MS = 30 * 60_000;

/** A page seen: a new visit when the last page was 30 minutes or more ago. */
export const pageSeen = (state: GuideState, now: number): GuideState => ({ ...state, visits: now - state.seenAt >= VISIT_GAP_MS ? state.visits + 1 : state.visits, seenAt: now });

export const sheetDue = (state: GuideState, now: number) => state.visits >= 2 && state.shownVisit !== state.visits && !state.sheetDone && state.notNow < 2 && now >= state.sheetAfter;

/** The sheet has shown in this visit. */
export const sheetShown = (state: GuideState): GuideState => ({ ...state, shownVisit: state.visits });

export const cardDue = (state: GuideState) => state.visits >= 2 && !state.cardDone;

export const closeCard = (state: GuideState): GuideState => ({ ...state, cardDone: true });

/** The sheet's answer: put off (Not now, the close button, Escape), Got it, or the app added. */
export function afterAnswer(state: GuideState, answer: "not-now" | "got-it" | "added", now: number): GuideState {
  if (answer === "added") return { ...state, sheetDone: true, cardDone: true };
  if (answer === "got-it") return { ...state, sheetDone: true };
  return { ...state, notNow: state.notNow + 1, sheetAfter: now + SNOOZE_MS };
}

/** Reads what this phone kept; anything missing or unreadable starts afresh. */
export function readGuide(text: string | null): GuideState {
  try {
    const kept = JSON.parse(text ?? "") as Partial<GuideState>;
    return { ...FRESH, ...Object.fromEntries(Object.entries(kept).filter(([key, value]) => key in FRESH && typeof value === typeof FRESH[key as keyof GuideState])) };
  } catch {
    return FRESH;
  }
}
