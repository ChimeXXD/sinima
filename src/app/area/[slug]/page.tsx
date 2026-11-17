import type { Metadata } from "next";
import { Forward } from "@/components/city/Forward";
import { areasIn } from "@/lib/data/load";

export const metadata: Metadata = { title: "Sinima", robots: { index: false } };
export const dynamicParams = false;
// Every old address was a Lagos page: only Lagos's areas forward (D-120).
export const generateStaticParams = () => areasIn("lagos").map((area) => ({ slug: area.slug }));

/** The old /area/<slug>, before the city came first (D-98). */
export default async function Old({ params }: { params: Promise<{ slug: string }> }) {
  return <Forward to={`/lagos/area/${(await params).slug}`} />;
}
