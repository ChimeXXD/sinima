"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { CITY_KEY, cityOfPath, cityPath, isCity, type City } from "@/lib/city";
import { linkTapped } from "./tabSlide";

// Links inside the site carry the city (D-98). A page's city is the first part of its address; on
// a page for both cities (About, the 404) it is the one kept on this phone, or Lagos. Screens write
// "/cinemas" and these put the city in front, so every screen works in both cities.

const noop = () => () => {};
function readKept(): City | null {
  try {
    const kept = localStorage.getItem(CITY_KEY);
    return isCity(kept) ? kept : null;
  } catch {
    return null; // storage can be switched off
  }
}

/** The city kept on this phone; null on the server and when none is kept. */
export function useKeptCity(): City | null {
  return useSyncExternalStore(noop, readKept, () => null);
}

/** The page's city. */
export function useCity(): City {
  const fromPath = cityOfPath(usePathname() ?? "/");
  const kept = useKeptCity();
  return fromPath ?? kept ?? "lagos";
}

/** Puts the page's city in front of a site path. */
export function useCityPath(): (path: string) => string {
  const city = useCity();
  return useMemo(() => (path: string) => cityPath(city, path), [city]);
}

/** next/link, with the city in front of a site path. */
export function Link(props: React.ComponentProps<typeof NextLink>) {
  const path = useCityPath();
  const href = typeof props.href === "string" ? path(props.href) : props.href;
  // D-106 g: the next page slides in from the way the visitor went (deeper, or back up).
  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof href === "string") linkTapped(href, event);
    props.onClick?.(event);
  };
  return <NextLink {...props} href={href} onClick={onClick} />;
}

/** next/navigation's router, with the city in front of a site path. */
export function useCityRouter() {
  const router = useRouter();
  const path = useCityPath();
  return useMemo(() => ({ ...router, push: (href: string) => router.push(path(href)), replace: (href: string) => router.replace(path(href)) }), [router, path]);
}
