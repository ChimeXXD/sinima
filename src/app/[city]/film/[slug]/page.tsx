import type { Metadata } from "next";
import { FilmScreen } from "@/components/film/FilmScreen";
import { filmIn, filmPageParams } from "@/lib/data/filmPages";
import { areasIn, cityParam, loadCity, loadDays, loadLater } from "@/lib/data/load";
import { toListData } from "@/lib/data/listData";
import { filmMeta } from "@/lib/share/meta";
import { pageColours } from "@/lib/theme/pageColours";

type Props = { params: Promise<{ city: string; slug: string }> };

export const dynamicParams = false;
// A film has a page in each city it is showing in (D-120): search and Films link to that city's.
export const generateStaticParams = filmPageParams;

// Its title, and its own share card (D-149): /og/<city>/<slug>.png.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, slug } = await params;
  return filmMeta(filmIn(cityParam(city), slug), cityParam(city));
}

/** One film: its poster and Stay or Go, then every cinema in the city showing it, by area (Figma Film). */
export default async function FilmPage({ params }: Props) {
  const { city: slugOfCity, slug } = await params;
  const city = cityParam(slugOfCity);
  const data = toListData(loadCity(city), { filmId: slug });
  // A film with no times today or tomorrow: its details from the first later day that has it (D-147).
  const films = data.films[0] ? data.films : (loadLater(city).map((later) => toListData(later.file, { filmId: slug }).films).find((found) => found.length > 0) ?? []);
  if (!films[0]) throw new Error(`No film "${slug}" in ${city}'s data`);
  return <FilmScreen data={{ ...data, films, days: loadDays(city) }} areas={areasIn(city)} city={city} bg={pageColours()} />;
}
