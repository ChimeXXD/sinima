import type { Metadata } from "next";
import { Forward } from "@/components/city/Forward";
import { loadCity } from "@/lib/data/load";

export const metadata: Metadata = { title: "Sinima", robots: { index: false } };
export const dynamicParams = false;
// Every old address was a Lagos page: only Lagos's films forward (D-120).
export const generateStaticParams = () => loadCity("lagos").films.map((film) => ({ slug: film.id }));

/** The old /film/<slug>, before the city came first (D-98). */
export default async function Old({ params }: { params: Promise<{ slug: string }> }) {
  return <Forward to={`/lagos/film/${(await params).slug}`} />;
}
