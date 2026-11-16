import type { Metadata } from "next";
import sources from "../../../data/sources.json";
import { AboutScreen } from "@/components/about/AboutScreen";
import { sourceRows } from "@/lib/data/about";
import { loadAll } from "@/lib/data/load";
import { pageColours } from "@/lib/theme/pageColours";

export const metadata: Metadata = { title: "About · Sinima" };

/** About: how it works, each source's real status, TMDB, and takedown (Figma About, build unit 11). */
export default function AboutPage() {
  return <AboutScreen sources={sourceRows(sources.sources, loadAll().sources)} bg={pageColours()} />;
}
