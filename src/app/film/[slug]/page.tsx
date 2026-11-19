import type { Metadata } from "next";
import { Forward } from "@/components/city/Forward";
import { filmsWithShowings } from "@/lib/data/coming";
import { loadCity } from "@/lib/data/load";

export const metadata: Metadata = { title: "Sinima", robots: { index: false } };
export const dynamicParams = false;
// Every old address was a Lagos page: only Lagos's films forward (D-120), those with showings (a
// coming-only film, D-151, came after the old addresses, so none of them names one).
export const generateStaticParams = () => filmsWithShowings(loadCity("lagos")).map((film) => ({ slug: film.id }));

/** The old /film/<slug>, before the city came first (D-98). */
export default async function Old({ params }: { params: Promise<{ slug: string }> }) {
  return <Forward to={`/lagos/film/${(await params).slug}`} />;
}
