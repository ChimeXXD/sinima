import type { Metadata } from "next";
import { CITIES } from "@/lib/city";
import { areasIn, cityParam, loadCity } from "@/lib/data/load";
import { SoonScreen } from "@/components/soon/SoonScreen";
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
  return pageMeta(`${sectionTitle("soon", city)} · Sinima`);
}

/** What starts in the next 2 hours in your area, then later tonight (Figma Starting soon, build unit 9). */
export default async function SoonPage({ params }: CityProps) {
  const city = cityParam((await params).city);
  return <SoonScreen data={toListData(loadCity(city))} areas={areasIn(city).map(({ slug, name, neighbours }) => ({ slug, name, neighbours }))} city={city} bg={pageColours()} />;
}
