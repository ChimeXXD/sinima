import type { Metadata } from "next";
import { Forward } from "@/components/city/Forward";
import { loadCity } from "@/lib/data/load";

export const metadata: Metadata = { title: "Sinima", robots: { index: false } };
export const dynamicParams = false;
// Every old address was a Lagos page: only Lagos's cinemas forward (D-120).
export const generateStaticParams = () => loadCity("lagos").cinemas.map((cinema) => ({ id: cinema.id }));

/** The old /cinema/<id>, before the city came first (D-98). */
export default async function Old({ params }: { params: Promise<{ id: string }> }) {
  return <Forward to={`/lagos/cinema/${(await params).id}`} />;
}
