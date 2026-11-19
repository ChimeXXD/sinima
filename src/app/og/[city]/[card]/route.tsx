import { ImageResponse } from "next/og";
import { CITY_NAMES } from "@/lib/city";
import { filmIn, filmPageParams } from "@/lib/data/filmPages";
import { cityParam } from "@/lib/data/load";
import { cardFonts, missingGlyphs, posterImage } from "@/lib/share/assets";
import { FilmCard, SiteCard } from "@/lib/share/cards";
import { CARD_SIZE } from "@/lib/share/meta";

// A film's share card in a city (D-149), one per film page: out/og/<city>/<slug>.png, written at
// build time with the film's TMDB poster (read then, never at a visit).
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => filmPageParams().map(({ city, slug }) => ({ city, card: `${slug}.png` }));

type Context = { params: Promise<{ city: string; card: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { city: slugOfCity, card } = await params;
  const city = cityParam(slugOfCity);
  const film = filmIn(city, card.replace(/\.png$/, ""));
  const options = { ...CARD_SIZE, fonts: cardFonts() };
  // next/og would fetch a font from the network for a letter Urbanist lacks; such a film gets the
  // site's card instead, and the log says so.
  const missing = missingGlyphs(film.title);
  if (missing.length > 0) {
    console.warn(`share card: ${city}/${film.id}: Urbanist has no ${missing.join(" ")}; its card is the site's.`);
    return new ImageResponse(<SiteCard />, options);
  }
  const poster = await posterImage(film.posterPath, `${city}/${film.id}`);
  return new ImageResponse(<FilmCard title={film.title} city={CITY_NAMES[city]} poster={poster} />, options);
}
