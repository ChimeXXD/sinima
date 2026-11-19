import { clock24, lagosDayKey } from "@/lib/time/lagos";

// Where each calendar file is (D-160). An iPhone adds an event to Calendar only from a file at a real
// web address, so the site writes these at build time (src/app/cal/[file]/route.ts) and the buttons
// link to them. Small and pure: the pages' scripts carry only this, not the calendar code.

/**
 * A showing's file: "/cal/dune-part-three_filmhouse-lekki-imax_2026-12-18-1930.ics", by its Lagos day
 * and time. "_" joins the parts: ids are made of letters, digits and "-", so no two showings share a name.
 */
export const showingCal = (filmId: string, cinemaId: string, startsAt: string) => `/cal/${filmId}_${cinemaId}_${lagosDayKey(startsAt)}-${clock24(startsAt).replace(":", "")}.ics`;

/** A coming film's first day in a city: "/cal/lagos_avengers-doomsday_opens-2026-12-18.ics". */
export const comingCal = (city: string, filmId: string, day: string) => `/cal/${city}_${filmId}_opens-${day}.ics`;
