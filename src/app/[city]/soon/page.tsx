import type { Metadata } from "next";
import { areas, cityParam, loadAll } from "@/lib/data/load";
import { SoonScreen } from "@/components/soon/SoonScreen";
import { toListData } from "@/lib/data/select";
import { pageColours } from "@/lib/theme/pageColours";
import { sectionTitle } from "@/lib/wording/city";

type CityProps = { params: Promise<{ city: string }> };

export const dynamicParams = false;
// Lagos here; Abuja's tabs are their own pages under app/abuja/ until it has times (D-98), so
// Lagos pages don't carry them.
export const generateStaticParams = () => [{ city: "lagos" }];

export async function generateMetadata({ params }: CityProps): Promise<Metadata> {
  const city = cityParam((await params).city);
  return { title: `${sectionTitle("soon", city)} · Sinima` };
}

/** What starts in the next 2 hours in your area, then later tonight (Figma Starting soon, build unit 9). */
export default async function SoonPage({ params }: CityProps) {
  cityParam((await params).city);
  return <SoonScreen data={toListData(loadAll())} areas={areas.map(({ slug, name, neighbours }) => ({ slug, name, neighbours }))} bg={pageColours()} />;
}
