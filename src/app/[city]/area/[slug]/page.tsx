import type { Metadata } from "next";
import { AreaScreen } from "@/components/area/AreaScreen";
import { areaBySlug, areas, areasIn, cityParam, loadCity } from "@/lib/data/load";
import { toListData } from "@/lib/data/listData";
import { pageMeta } from "@/lib/share/meta";
import { pageColours } from "@/lib/theme/pageColours";
import { areaTitle } from "@/lib/wording/areaPage";

type Props = { params: Promise<{ city: string; slug: string }> };

export const dynamicParams = false;
// Each area under its own city only (D-120).
export const generateStaticParams = () => areas.map((area) => ({ city: area.city, slug: area.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return pageMeta(`${areaTitle(areaBySlug((await params).slug).name)} · Sinima`);
}

/** One area's cinemas, then the areas next to it (Figma Area, build unit 7). The page carries only those areas' showings. */
export default async function AreaPage({ params }: Props) {
  const { city: slugOfCity, slug } = await params;
  const city = cityParam(slugOfCity);
  const area = areaBySlug(slug);
  const file = loadCity(city);
  const shown = new Set([area.slug, ...area.neighbours]);
  const areaOf = new Map(file.cinemas.map((cinema) => [cinema.id, cinema.area]));
  const data = toListData({ ...file, showings: file.showings.filter((showing) => shown.has(areaOf.get(showing.cinemaId) ?? "")) });
  return <AreaScreen data={data} areas={areasIn(city)} slug={area.slug} city={city} bg={pageColours()} />;
}
