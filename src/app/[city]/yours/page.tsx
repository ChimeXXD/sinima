import type { Metadata } from "next";
import { areas, cityParam, loadAll } from "@/lib/data/load";
import { YoursScreen } from "@/components/yours/YoursScreen";
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
  return { title: `${sectionTitle("yours", city)} · Sinima` };
}

/** The Your cinemas tab: the cinemas saved on this phone, soonest first (Figma Your cinemas, build unit 10). */
export default async function YoursPage({ params }: CityProps) {
  cityParam((await params).city);
  return <YoursScreen data={toListData(loadAll())} areas={areas.map(({ slug, name }) => ({ slug, name }))} bg={pageColours()} />;
}
