import type { Metadata } from "next";
import { SoonScreen } from "@/components/soon/SoonScreen";
import { areas, loadAll } from "@/lib/data/load";
import { toListData } from "@/lib/data/select";
import { pageColours } from "@/lib/theme/pageColours";

export const metadata: Metadata = { title: "Starting soon in Lagos · Sinima" };

/** What starts in the next 2 hours in your area, then later tonight (Figma Starting soon, build unit 9). */
export default function SoonPage() {
  return <SoonScreen data={toListData(loadAll())} areas={areas.map(({ slug, name, neighbours }) => ({ slug, name, neighbours }))} bg={pageColours()} />;
}
