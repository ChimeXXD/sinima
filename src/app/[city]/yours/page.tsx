import type { Metadata } from "next";
import { CITIES } from "@/lib/city";
import { areasIn, cityParam, loadCity } from "@/lib/data/load";
import { YoursScreen } from "@/components/yours/YoursScreen";
import { toListData } from "@/lib/data/select";
import { pageColours } from "@/lib/theme/pageColours";
import { sectionTitle } from "@/lib/wording/city";

type CityProps = { params: Promise<{ city: string }> };

export const dynamicParams = false;
// Both cities, each from its own areas, cinemas and showings only (D-98, D-120).
export const generateStaticParams = () => CITIES.map((city) => ({ city }));

export async function generateMetadata({ params }: CityProps): Promise<Metadata> {
  const city = cityParam((await params).city);
  return { title: `${sectionTitle("yours", city)} · Sinima` };
}

/** The Your cinemas tab: the cinemas saved on this phone, soonest first (Figma Your cinemas, build unit 10). */
export default async function YoursPage({ params }: CityProps) {
  const city = cityParam((await params).city);
  return <YoursScreen data={toListData(loadCity(city))} areas={areasIn(city).map(({ slug, name }) => ({ slug, name }))} city={city} bg={pageColours()} />;
}
