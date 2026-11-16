import type { Metadata } from "next";
import { ForwardToCity } from "@/components/city/Forward";

export const metadata: Metadata = { title: "Sinima" };

/** "/": the city kept on this phone, or Lagos (D-98). */
export default function Home() {
  return <ForwardToCity />;
}
