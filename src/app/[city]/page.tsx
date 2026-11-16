import type { Metadata } from "next";
import { cityParam, loadAll } from "@/lib/data/load";
import { FilmsScreen } from "@/components/films/FilmsScreen";
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
  return { title: `${sectionTitle("films", city)} · Sinima` };
}

/** Home: every film showing in Lagos, as posters. A visitor picks a film, then sees where it is on (D-55). */
export default async function FilmsPage({ params }: CityProps) {
  cityParam((await params).city);
  return <FilmsScreen data={toListData(loadAll())} bg={pageColours()} />;
}
