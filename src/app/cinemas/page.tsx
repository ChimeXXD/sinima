import type { Metadata } from "next";
import { CinemasScreen } from "@/components/cinemas/CinemasScreen";
import { areas, loadAll } from "@/lib/data/load";
import { toListData } from "@/lib/data/select";
import { pageColours } from "@/lib/theme/pageColours";

export const metadata: Metadata = { title: "Cinemas in Lagos · Sinima" };

/** The Cinemas tab: every cinema in Lagos, the area kept on this phone first (Figma Cinemas, D-91). */
export default function CinemasPage() {
  return <CinemasScreen data={toListData(loadAll())} areas={areas} bg={pageColours()} />;
}
