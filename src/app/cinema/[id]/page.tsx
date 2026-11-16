import type { Metadata } from "next";
import { Forward } from "@/components/city/Forward";
import { loadAll } from "@/lib/data/load";

export const metadata: Metadata = { title: "Sinima", robots: { index: false } };
export const dynamicParams = false;
export const generateStaticParams = () => loadAll().cinemas.map((cinema) => ({ id: cinema.id }));

/** The old /cinema/<id>, before the city came first (D-98). */
export default async function Old({ params }: { params: Promise<{ id: string }> }) {
  return <Forward to={`/lagos/cinema/${(await params).id}`} />;
}
