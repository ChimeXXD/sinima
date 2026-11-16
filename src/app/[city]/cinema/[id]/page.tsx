import type { Metadata } from "next";
import { CinemaScreen } from "@/components/cinema/CinemaScreen";
import { areaBySlug, loadAll } from "@/lib/data/load";
import { toListData } from "@/lib/data/select";
import { pageColours } from "@/lib/theme/pageColours";

type Props = { params: Promise<{ city: string; id: string }> };

export const dynamicParams = false;
// Abuja has no cinemas in the data yet (D-98): its id pages come with its times.
export const generateStaticParams = () => loadAll().cinemas.map((cinema) => ({ city: "lagos", id: cinema.id }));

const cinemaById = (id: string) => {
  const cinema = loadAll().cinemas.find((candidate) => candidate.id === id);
  if (!cinema) throw new Error(`No cinema "${id}" in the data`);
  return cinema;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `${cinemaById((await params).id).name} · Sinima` };
}

/** One cinema: where it is, Save and Book, then its films on the day (Figma Cinema, build unit 8). */
export default async function CinemaPage({ params }: Props) {
  const cinema = cinemaById((await params).id);
  const area = areaBySlug(cinema.area);
  return <CinemaScreen data={toListData(loadAll(), { cinemaId: cinema.id })} id={cinema.id} area={{ slug: area.slug, name: area.name }} bg={pageColours()} />;
}
