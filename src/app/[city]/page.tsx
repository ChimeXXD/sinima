import type { Metadata } from "next";
import { CITIES } from "@/lib/city";
import { cityParam, loadCity, loadDays } from "@/lib/data/load";
import { FilmsScreen } from "@/components/films/FilmsScreen";
import { comingCards, soldBy } from "@/lib/data/comingPage";
import { comingIn, presalesIn } from "@/lib/data/filmPages";
import { toListData } from "@/lib/data/listData";
import { pageMeta } from "@/lib/share/meta";
import { pageColours } from "@/lib/theme/pageColours";
import { sectionTitle } from "@/lib/wording/city";

type CityProps = { params: Promise<{ city: string }> };

export const dynamicParams = false;
// Both cities, each from its own areas, cinemas and showings only (D-98, D-120).
export const generateStaticParams = () => CITIES.map((city) => ({ city }));

export async function generateMetadata({ params }: CityProps): Promise<Metadata> {
  const city = cityParam((await params).city);
  return pageMeta(`${sectionTitle("films", city)} · Sinima`);
}

/** Home: every film showing in the city, as posters, then the films coming (D-151). A visitor picks a film, then sees where it is on (D-55). */
export default async function FilmsPage({ params }: CityProps) {
  const city = cityParam((await params).city);
  // Coming soon (D-151): its cards' words are made here; a city with no coming film sends none and has no section.
  const cards = comingCards(comingIn(city), soldBy(presalesIn(city)));
  const coming = cards.length > 0 ? { coming: cards } : {};
  return <FilmsScreen data={{ ...toListData(loadCity(city)), days: loadDays(city) }} city={city} bg={pageColours()} {...coming} />;
}
