import { cityOfArea, loadAll, loadLater } from "@/lib/data/load";
import { comingIn } from "@/lib/data/filmPages";
import { searchIndex } from "@/lib/data/searchIndex";

// The search index (lib/data/search.ts), written as a static file at build time. Search fetches it
// the first time it opens, so no page carries it.
export const dynamic = "force-static";

export function GET() {
  const later = [...loadLater("lagos"), ...loadLater("abuja")].map((day) => day.file);
  return Response.json(searchIndex(loadAll(), cityOfArea, { lagos: comingIn("lagos"), abuja: comingIn("abuja") }, later));
}
