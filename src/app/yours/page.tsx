import type { Metadata } from "next";
import { Forward } from "@/components/city/Forward";

export const metadata: Metadata = { title: "Sinima", robots: { index: false } };

/** The old /yours, before the city came first (D-98). */
export default function Old() {
  return <Forward to="/lagos/yours" />;
}
