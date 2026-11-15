import type { Metadata } from "next";
import { FilmsScreen } from "@/components/films/FilmsScreen";
import { loadAll } from "@/lib/data/load";
import { toListData } from "@/lib/data/select";
import { pageColours } from "@/lib/theme/pageColours";

export const metadata: Metadata = { title: "What's on in Lagos · Sinima" };

/** Home: every film showing in Lagos, as posters. A visitor picks a film, then sees where it is on (D-55). */
export default function FilmsPage() {
  return <FilmsScreen data={toListData(loadAll())} bg={pageColours()} />;
}
