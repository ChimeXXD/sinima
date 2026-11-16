import type { Metadata } from "next";
import { FilmScreen } from "@/components/film/FilmScreen";
import { areas, loadAll } from "@/lib/data/load";
import { toListData } from "@/lib/data/select";
import { pageColours } from "@/lib/theme/pageColours";

type Props = { params: Promise<{ city: string; slug: string }> };

export const dynamicParams = false;
// Abuja has no cinemas in the data yet (D-98): its slug pages come with its times.
export const generateStaticParams = () => loadAll().films.map((film) => ({ city: "lagos", slug: film.id }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${loadAll().films.find((film) => film.id === slug)?.title ?? "Film"} · Sinima` };
}

/** One film: its poster and Stay or Go, then every cinema showing it, by area (Figma Film). */
export default async function FilmPage({ params }: Props) {
  const { slug } = await params;
  const data = toListData(loadAll(), { filmId: slug });
  if (!data.films[0]) throw new Error(`No film "${slug}" in the data`);
  return <FilmScreen data={data} areas={areas} bg={pageColours()} />;
}
