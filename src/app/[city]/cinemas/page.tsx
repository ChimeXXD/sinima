import type { Metadata } from "next";
import { areas, cityParam, loadAll } from "@/lib/data/load";
import { CinemasScreen } from "@/components/cinemas/CinemasScreen";
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
  return { title: `${sectionTitle("cinemas", city)} · Sinima` };
}

/** The Cinemas tab: every cinema in Lagos, the area kept on this phone first (Figma Cinemas, D-91). */
export default async function CinemasPage({ params }: CityProps) {
  cityParam((await params).city);
  return <CinemasScreen data={toListData(loadAll())} areas={areas} bg={pageColours()} />;
}
