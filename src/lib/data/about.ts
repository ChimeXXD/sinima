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
