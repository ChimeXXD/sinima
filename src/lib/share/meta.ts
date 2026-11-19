import type { Metadata } from "next";
import type { City } from "@/lib/city";
import { missingGlyphs } from "@/lib/share/assets";
import { filmShare, SITE_SHARE } from "@/lib/wording/share";

// The link preview every page gives WhatsApp and X (D-145, D-149). A film's page points at its own
// card, one per film per city; every other page at the site's own card. The cards are PNGs written at
// build time by the routes under src/app/og/. Next joins these relative addresses to `metadataBase`,
// so the HTML carries absolute https://sinima.com.ng ones, which link previews need.

export const SITE_URL = "https://sinima.com.ng";
export const CARD_SIZE = { width: 1200, height: 630 } as const;

/** The site's own card. */
export const SITE_CARD = "/og/site.png";
/** A film's card in a city. */
export const filmCard = (city: City, slug: string) => `/og/${city}/${slug}.png`;

const image = (url: string, alt: string) => ({ url, ...CARD_SIZE, alt });
const siteImage = () => image(SITE_CARD, SITE_SHARE.alt);
const shared = { siteName: "Sinima", locale: "en_NG", type: "website" } as const;

/** The root layout's defaults: every page without its own preview inherits these. */
export function siteMeta(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    description: SITE_SHARE.description,
    openGraph: { ...shared, title: SITE_SHARE.title, description: SITE_SHARE.description, images: [siteImage()] },
    // X reads og:title, og:description and og:image when its own tags are missing; this asks for
    // the large picture.
    twitter: { card: "summary_large_image" },
  };
}

/**
 * A page with its own title and the site's card. A page's `openGraph` replaces the layout's whole
 * (Next does not merge it), so the card and the site's words are given again here.
 */
export function pageMeta(title: string): Metadata {
  return { title, openGraph: { ...shared, title, description: SITE_SHARE.description, images: [siteImage()] } };
}

/**
 * A film's page in a city: its own card and words. A title the card's font can't draw gets the site's
 * card (og/[city]/[card]), so its alt text is the site's too, never a description of a card not drawn.
 */
export function filmMeta(film: { id: string; title: string }, city: City): Metadata {
  const words = filmShare(film.title, city);
  const card = missingGlyphs(film.title).length > 0 ? siteImage() : image(filmCard(city, film.id), words.alt);
  return {
    title: `${film.title} · Sinima`,
    description: words.description,
    openGraph: { ...shared, title: words.title, description: words.description, url: `/${city}/film/${film.id}`, images: [card] },
  };
}
