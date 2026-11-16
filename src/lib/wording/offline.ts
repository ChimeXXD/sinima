import { formatDate, formatTime, utcMs } from "@/lib/time/lagos";

// The offline banner (Figma Offline · Films 208:9731): the phone has no connection, so the page is
// the copy saved the last time it loaded the site online, and says when that was.

const ago = (savedAt: string, now: string): string | null => {
  const minutes = Math.floor((utcMs(now) - utcMs(savedAt)) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} ${hours === 1 ? "hour" : "hours"} ago` : null;
};

/** "You're offline. These are the times saved on this phone at 17:05, 25 min ago. Booking needs a connection." */
export function offlineLine(savedAt: string | null, now: string): string {
  const when = savedAt === null ? "" : ((since) => (since ? ` at ${formatTime(savedAt)}, ${since}` : ` on ${formatDate(savedAt)} at ${formatTime(savedAt)}`))(ago(savedAt, now));
  return `You're offline. These are the times saved on this phone${when}. Booking needs a connection.`;
}
