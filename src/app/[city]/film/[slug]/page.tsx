import type { Metadata } from "next";
import { FilmScreen } from "@/components/film/FilmScreen";
import { CITIES, type City } from "@/lib/city";
import { filmsWithShowings } from "@/lib/data/coming";
import { areasIn, cityParam, loadCity, loadDays, loadLater } from "@/lib/data/load";
import { toListData } from "@/lib/data/listData";
import { pageColours } from "@/lib/theme/pageColours";

type Props = { params: Promise<{ city: string; slug: string }> };

export const dynamicParams = false;
/**
 * Every film showing in a city in the five days shown (D-142): one showing only on Saturday has its
 * page too. Only films with showings: a coming-only film (D-151) is in a city file's films too, and
 * gets its page in the Coming soon UI unit.
 */
const filmsIn = (city: City) => [loadCity(city), ...loadLater(city).map((later) => later.file)].flatMap(filmsWithShowings);

// A film has a page in each city it is showing in (D-120): search and Films link to that city's.
export const generateStaticParams = () => CITIES.flatMap((city) => [...new Set(filmsIn(city).map((film) => film.id))].map((slug) => ({ city, slug })));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, slug } = await params;
  return { title: `${filmsIn(cityParam(city)).find((film) => film.id === slug)?.title ?? "Film"} · Sinima` };
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
