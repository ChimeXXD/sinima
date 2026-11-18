import type { Metadata } from "next";
import { CITIES } from "@/lib/city";
import { areasIn, cityParam, loadCity, loadDays } from "@/lib/data/load";
import { CinemasScreen } from "@/components/cinemas/CinemasScreen";
import { toListData } from "@/lib/data/listData";
import { pageColours } from "@/lib/theme/pageColours";
import { sectionTitle } from "@/lib/wording/city";

type CityProps = { params: Promise<{ city: string }> };

export const dynamicParams = false;
// Both cities, each from its own areas, cinemas and showings only (D-98, D-120).
export const generateStaticParams = () => CITIES.map((city) => ({ city }));

export async function generateMetadata({ params }: CityProps): Promise<Metadata> {
  const city = cityParam((await params).city);
  return { title: `${sectionTitle("cinemas", city)} · Sinima` };
}

/** The Cinemas tab: every cinema in the city, the area kept on this phone first (Figma Cinemas, D-91). */
export default async function CinemasPage({ params }: CityProps) {
  const city = cityParam((await params).city);
  return <CinemasScreen data={{ ...toListData(loadCity(city)), days: loadDays(city) }} areas={areasIn(city)} city={city} bg={pageColours()} />;
}
