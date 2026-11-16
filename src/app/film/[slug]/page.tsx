import type { Metadata } from "next";
import { Forward } from "@/components/city/Forward";
import { loadAll } from "@/lib/data/load";

export const metadata: Metadata = { title: "Sinima", robots: { index: false } };
export const dynamicParams = false;
export const generateStaticParams = () => loadAll().films.map((film) => ({ slug: film.id }));

/** The old /film/<slug>, before the city came first (D-98). */
export default async function Old({ params }: { params: Promise<{ slug: string }> }) {
  return <Forward to={`/lagos/film/${(await params).slug}`} />;
}
