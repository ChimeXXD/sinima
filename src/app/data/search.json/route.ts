import { cityOfArea, loadAll } from "@/lib/data/load";
import { searchIndex } from "@/lib/data/searchIndex";

// The search index (lib/data/search.ts), written as a static file at build time. Search fetches it
// the first time it opens, so no page carries it.
export const dynamic = "force-static";

export function GET() {
  return Response.json(searchIndex(loadAll(), cityOfArea));
}
