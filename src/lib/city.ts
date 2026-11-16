// The two cities, and the city as the first part of every city page's address (D-98): /lagos/…
// and /abuja/…. About, the 404 and the site's own files belong to both and keep their paths.

export type City = "lagos" | "abuja";
export const CITIES: City[] = ["lagos", "abuja"];
export const CITY_NAMES: Record<City, string> = { lagos: "Lagos", abuja: "Abuja" };

/** Where the chosen city is kept: on this phone only, as its slug (D-65, D-98). */
export const CITY_KEY = "ls.city";

export const isCity = (value: unknown): value is City => value === "lagos" || value === "abuja";

/** Paths that are the same for both cities. */
const SHARED = /^\/(about|kit|data|_next|fonts|stickers|logos|icons|sw\.js|manifest)(\/|$|\.|\?|#)/;

/** The city from an address's first part, or null. */
export function cityOfPath(pathname: string): City | null {
  const first = pathname.split(/[/?#]/)[1] ?? "";
  return isCity(first) ? first : null;
}

/** A site path with the city in front: "/cinemas" → "/lagos/cinemas", "/" → "/lagos". Anything else is left alone. */
export function cityPath(city: City, path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || cityOfPath(path) || SHARED.test(path)) return path;
  const [, rest = ""] = path.match(/^\/([^]*)$/) ?? [];
  return rest === "" || rest.startsWith("?") || rest.startsWith("#") ? `/${city}${rest}` : `/${city}/${rest}`;
}
