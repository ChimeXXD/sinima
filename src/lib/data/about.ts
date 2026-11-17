// About › Where the times come from (Figma 208:9122): the sources in data/sources.json that cover
// at least one cinema, most cinemas first, with their real status. A source is in use once the
// site's times come from it for real (not a saved sample); it was asked if a request for
// permission has no answer yet. Sources marked do-not-use are left out.

export type SourceStatus = { kind: "used" } | { kind: "asked"; on: string } | { kind: "unused" };
export type SourceRow = { id: string; name: string; cinemas: number; status: SourceStatus };

type RegistrySource = { id: string; name: string; status: string; cinemaIds?: string[]; permission?: { askedAt?: string | null; repliedAt?: string | null } };

/** `read`: the sources the built times name, with how they were read. */
export function sourceRows(registry: RegistrySource[], read: { id: string; method: string }[]): SourceRow[] {
  const used = new Set(read.filter((source) => source.method !== "fixture").map((source) => source.id));
  return registry
    .filter((source) => source.status !== "do-not-use" && (source.cinemaIds?.length ?? 0) > 0)
    .map((source): SourceRow => {
      const asked = source.permission?.askedAt && !source.permission.repliedAt ? source.permission.askedAt : null;
      const status: SourceStatus = used.has(source.id) ? { kind: "used" } : asked ? { kind: "asked", on: asked } : { kind: "unused" };
      return { id: source.id, name: source.name, cinemas: source.cinemaIds!.length, status };
    })
    .sort((a, b) => b.cinemas - a.cinemas);
}

/** How a city's cinemas are read in the built times (D-122). */
export type CityReading = { own: number; through: number; none: number };
/**
 * Listings that compile other sites: their rows say which site they read (DATA §Freshness), and a
 * cinema read only through one is not read from its own site. The live run uses it too.
 */
export const COMPILERS = new Set(["lagocine"]);

/**
 * Each city's cinemas by how the built times read them: a cinema with a showing from its own source
 * is read from its own site, one whose showings all come through Lagocine is read through it, and
 * one with no showings has no times yet. Counted from the showings, so it is true of the site as built.
 */
export function cityReading<C extends string>(
  file: { cinemas: { id: string; area: string }[]; showings: { cinemaId: string; sourceId: string }[] },
  cityOf: (area: string) => C | undefined,
): Record<C, CityReading> {
  const sources = new Map<string, Set<string>>();
  for (const { cinemaId, sourceId } of file.showings) sources.set(cinemaId, (sources.get(cinemaId) ?? new Set()).add(sourceId));
  const out = {} as Record<C, CityReading>;
  for (const cinema of file.cinemas) {
    const city = cityOf(cinema.area);
    if (city === undefined) continue;
    const counts = (out[city] ??= { own: 0, through: 0, none: 0 });
    const read = [...(sources.get(cinema.id) ?? [])];
    if (read.length === 0) counts.none += 1;
    else if (read.some((id) => !COMPILERS.has(id))) counts.own += 1;
    else counts.through += 1;
  }
  return out;
}
