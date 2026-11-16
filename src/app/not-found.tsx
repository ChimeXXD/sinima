import type { Metadata } from "next";
import { NotFoundLazy } from "@/components/notfound/NotFoundLazy";
import { pageColours } from "@/lib/theme/pageColours";

export const metadata: Metadata = { title: "Not found · Sinima" };

/** Any address the site doesn't have (Figma 404, build unit 11). */
export default function NotFound() {
  return <NotFoundLazy bg={pageColours()} />;
}
