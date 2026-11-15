import type { Metadata } from "next";
import { AreaScreen } from "@/components/area/AreaScreen";
import { areaBySlug, areas, loadAll } from "@/lib/data/load";
import { toListData } from "@/lib/data/select";
import { pageColours } from "@/lib/theme/pageColours";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => areas.map((area) => ({ slug: area.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Cinemas in ${areaBySlug((await params).slug).name} · Sinima` };
}

/** One area's cinemas, then the areas next to it (Figma Area, build unit 7). The page carries only those areas' showings. */
export default async function AreaPage({ params }: Props) {
  const area = areaBySlug((await params).slug);
  const file = loadAll();
  const shown = new Set([area.slug, ...area.neighbours]);
  const areaOf = new Map(file.cinemas.map((cinema) => [cinema.id, cinema.area]));
  const data = toListData({ ...file, showings: file.showings.filter((showing) => shown.has(areaOf.get(showing.cinemaId) ?? "")) });
  return <AreaScreen data={data} areas={areas} slug={area.slug} bg={pageColours()} />;
}
