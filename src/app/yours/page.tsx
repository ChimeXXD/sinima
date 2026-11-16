import type { Metadata } from "next";
import { YoursScreen } from "@/components/yours/YoursScreen";
import { areas, loadAll } from "@/lib/data/load";
import { toListData } from "@/lib/data/select";
import { pageColours } from "@/lib/theme/pageColours";

export const metadata: Metadata = { title: "Your cinemas · Sinima" };

/** The Your cinemas tab: the cinemas saved on this phone, soonest first (Figma Your cinemas, build unit 10). */
export default function YoursPage() {
  return <YoursScreen data={toListData(loadAll())} areas={areas.map(({ slug, name }) => ({ slug, name }))} bg={pageColours()} />;
}
