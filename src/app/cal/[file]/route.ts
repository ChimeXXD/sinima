import { calFiles } from "@/lib/ics/calFiles";

// The calendar files (D-160), written at build time: out/cal/<name>.ics, one per showing on each day
// a page lists and one per coming film's first day. "Add to calendar" links here, because an iPhone
// adds an event to Calendar only from a file at a web address. vercel.json serves them as text/calendar.
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => [...calFiles().keys()].map((file) => ({ file }));

type Context = { params: Promise<{ file: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { file } = await params;
  const make = calFiles().get(file);
  if (!make) throw new Error(`No calendar file ${file}`);
  return new Response(make(), { headers: { "Content-Type": "text/calendar; charset=utf-8" } });
}
