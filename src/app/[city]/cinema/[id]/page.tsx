import type { Metadata } from "next";
import { CinemaScreen } from "@/components/cinema/CinemaScreen";
import { CITIES, type City } from "@/lib/city";
import { areaBySlug, cityParam, loadCity } from "@/lib/data/load";
import { toListData } from "@/lib/data/select";
import type { ShowtimesFile } from "@/lib/data/types";
import { pageColours } from "@/lib/theme/pageColours";

type Props = { params: Promise<{ city: string; id: string }> };

export const dynamicParams = false;
// Each cinema under its own city only (D-120).
export const generateStaticParams = () => CITIES.flatMap((city) => loadCity(city).cinemas.map((cinema) => ({ city, id: cinema.id })));

const cinemaById = (file: ShowtimesFile, city: City, id: string) => {
  const cinema = file.cinemas.find((candidate) => candidate.id === id);
  if (!cinema) throw new Error(`No cinema "${id}" in ${city}'s data`);
  return cinema;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slugOfCity, id } = await params;
  const city = cityParam(slugOfCity);
  return { title: `${cinemaById(loadCity(city), city, id).name} · Sinima` };
}

/** One cinema: where it is, Save and Book, then its films on the day (Figma Cinema, build unit 8). */
export default async function CinemaPage({ params }: Props) {
  const { city: slugOfCity, id } = await params;
  const city = cityParam(slugOfCity);
  const file = loadCity(city);
  const cinema = cinemaById(file, city, id);
  const area = areaBySlug(cinema.area);
  return <CinemaScreen data={toListData(file, { cinemaId: cinema.id })} id={cinema.id} area={{ slug: area.slug, name: area.name }} city={city} bg={pageColours()} />;
}
