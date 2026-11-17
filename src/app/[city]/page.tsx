import type { Metadata } from "next";
import { CITIES } from "@/lib/city";
import { cityParam, loadCity } from "@/lib/data/load";
import { FilmsScreen } from "@/components/films/FilmsScreen";
import { toListData } from "@/lib/data/select";
import { pageColours } from "@/lib/theme/pageColours";
import { sectionTitle } from "@/lib/wording/city";

type CityProps = { params: Promise<{ city: string }> };

export const dynamicParams = false;
// Both cities, each from its own areas, cinemas and showings only (D-98, D-120).
export const generateStaticParams = () => CITIES.map((city) => ({ city }));

export async function generateMetadata({ params }: CityProps): Promise<Metadata> {
  const city = cityParam((await params).city);
  return { title: `${sectionTitle("films", city)} · Sinima` };
}

/** Home: every film showing in the city, as posters. A visitor picks a film, then sees where it is on (D-55). */
export default async function FilmsPage({ params }: CityProps) {
  const city = cityParam((await params).city);
  return <FilmsScreen data={toListData(loadCity(city))} city={city} bg={pageColours()} />;
}
