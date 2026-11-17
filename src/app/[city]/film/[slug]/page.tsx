import type { Metadata } from "next";
import { FilmScreen } from "@/components/film/FilmScreen";
import { CITIES } from "@/lib/city";
import { areasIn, cityParam, loadCity } from "@/lib/data/load";
import { toListData } from "@/lib/data/select";
import { pageColours } from "@/lib/theme/pageColours";

type Props = { params: Promise<{ city: string; slug: string }> };

export const dynamicParams = false;
// A film has a page in each city it is showing in (D-120): search and Films link to that city's.
export const generateStaticParams = () => CITIES.flatMap((city) => loadCity(city).films.map((film) => ({ city, slug: film.id })));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, slug } = await params;
  return { title: `${loadCity(cityParam(city)).films.find((film) => film.id === slug)?.title ?? "Film"} · Sinima` };
}

/** One film: its poster and Stay or Go, then every cinema in the city showing it, by area (Figma Film). */
export default async function FilmPage({ params }: Props) {
  const { city: slugOfCity, slug } = await params;
  const city = cityParam(slugOfCity);
  const data = toListData(loadCity(city), { filmId: slug });
  if (!data.films[0]) throw new Error(`No film "${slug}" in ${city}'s data`);
  return <FilmScreen data={data} areas={areasIn(city)} city={city} bg={pageColours()} />;
}
