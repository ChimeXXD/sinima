"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Chip } from "@/components/ui/Actions";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Status";
import { CitySticker, TicketFaceSticker } from "@/components/ui/Stickers";
import { hasCinemas, searchFilms, type Scope, type SearchIndex, type SearchResult } from "@/lib/data/search";
import { pageBanner } from "@/lib/data/select";
import { useNow } from "@/lib/time/useNow";
import { ABUJA_SOON, CITY_NAME, enterHint, matchCount, noMatch, resultMeta, resultNext, SEARCH_FAILED } from "@/lib/wording/search";
import a from "@/components/ui/actions.module.css";
import s from "./search.module.css";

// Search (Figma Search and city, 192:7519). Loaded only when the search bar is first used, so no
// page carries it. On a phone it takes the whole screen, with Cancel; on an iPad or desktop it is a
// panel over the search bar, the page dimmed behind. The field here takes over from the bar's.

let loading: Promise<SearchIndex> | null = null;
function loadIndex(): Promise<SearchIndex> {
  loading ??= fetch("/data/search.json").then((response) => {
    if (!response.ok) throw new Error(`search.json: ${response.status}`);
    return response.json() as Promise<SearchIndex>;
  });
  loading.catch(() => (loading = null)); // a failed load is tried again next time
  return loading;
}

const TMDB = "https://image.tmdb.org/t/p/";
const SCOPES: { id: Scope; name: string }[] = [
  { id: "both", name: "Both cities" },
  { id: "lagos", name: "Lagos" },
  { id: "abuja", name: "Abuja" },
];

export type SearchOverlayProps = { query: string; onQuery: (text: string) => void; onSubmit: () => void; /** `true` gives focus back to the search bar (Escape). */ onClose: (refocus?: boolean) => void; /** The scope it opens on. */ city: Scope };

export default function SearchOverlay({ query, onQuery, onSubmit, onClose, city }: SearchOverlayProps) {
  const [scope, setScope] = useState<Scope>(city);
  const [index, setIndex] = useState<SearchIndex | "failed" | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const now = useNow();

  useEffect(() => {
    field.current?.focus();
    let live = true;
    loadIndex().then(
      (loaded) => live && setIndex(loaded),
      () => live && setIndex("failed"),
    );
    return () => {
      live = false;
    };
  }, []);

  const text = query.trim();
  const groups = typeof index === "object" && index !== null && now && text ? searchFilms(index, text, scope, now) : null;
  const found = groups?.reduce((n, group) => n + group.results.length, 0) ?? 0;
  const loaded = typeof index === "object" && index !== null ? index : null;
  // Search covers the page's banner on a phone, so it says the same (rules 2 and 8).
  const banner = loaded && pageBanner(loaded, now);
  // Abuja has no cinemas until the city layer: say so, rather than suggest a spelling mistake.
  const abujaSoon = loaded !== null && !hasCinemas(loaded, "abuja");
  // Enter shows today's matches on Films, in its city (Lagos when both are searched): only those count.
  const filmsCity = city === "both" ? "lagos" : city;
  const listed = groups?.find((group) => group.city === filmsCity)?.results.filter((result) => result.day === 0).length ?? 0;

  return (
    <>
      <div className={s.scrim} onClick={() => onClose()} aria-hidden="true" />
      <form
        className={s.box}
        role="search"
        aria-label="Find a film"
        onSubmit={(event) => {
          event.preventDefault();
          if (text) onSubmit();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault(); // a search field clears itself on Escape; keep the query
          onClose(true);
        }}
        data-testid="search.panel"
      >
        <div className={s.head}>
          <div className={s.field}>
            <Icon name="search" size={20} className={s.glass} />
            <input ref={field} type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Find a film" aria-label="Find a film" autoComplete="off" enterKeyHint="search" data-testid="search.query" />
            {query && (
              <button type="button" className={s.clear} aria-label="Clear" onClick={() => (onQuery(""), field.current?.focus())} data-testid="search.clear">
                <Icon name="x" size={16} />
              </button>
            )}
          </div>
          <button type="button" className={s.cancel} onClick={() => (onQuery(""), onClose())} data-testid="search.cancel">
            Cancel
          </button>
        </div>

        <div className={s.body}>
          <div className={s.scopes} role="group" aria-label="Cities">
            {SCOPES.map(({ id, name }) => (
              <Chip key={id} selected={scope === id} onClick={() => setScope(id)} testId={`search.scope.${id}`}>
                {name}
              </Chip>
            ))}
          </div>

          <div className={s.results} aria-live="polite" data-testid="search.results">
            {index === "failed" && <p className={s.line}>{SEARCH_FAILED}</p>}
            {groups && banner && <Notice kind={banner.kind} text={banner.text} />}
            {groups && scope === "abuja" && abujaSoon ? (
              <NoMatch words={{ ...noMatch(text, scope), title: ABUJA_SOON, body: null }} onHome={() => (onQuery(""), onClose())} />
            ) : (
              groups && found === 0 && <NoMatch words={noMatch(text, scope)} onHome={() => (onQuery(""), onClose())} />
            )}
            {groups && found > 0 && scope !== "both" && (
              <>
                <p className={s.line} data-testid="search.count">
                  {matchCount(found, scope, text)}
                </p>
                {groups[0]!.results.map((result) => (
                  <Result key={result.film.id} result={result} now={now!} onOpen={() => onClose()} />
                ))}
              </>
            )}
            {groups &&
              found > 0 &&
              scope === "both" &&
              groups.map((group) =>
                group.results.length > 0 ? (
                  <section key={group.city} className={s.group} aria-label={`In ${CITY_NAME[group.city]}`} data-testid={`search.group.${group.city}`}>
                    <h3 className={s.groupHead}>
                      <span aria-hidden="true">
                        <CitySticker city={group.city} />
                      </span>
                      In {CITY_NAME[group.city]}
                    </h3>
                    {group.results.map((result) => (
                      <Result key={result.film.id} result={result} now={now!} onOpen={() => onClose()} />
                    ))}
                  </section>
                ) : group.city === "abuja" && abujaSoon ? (
                  <p key={group.city} className={s.soon} data-testid="search.abuja-soon">
                    {ABUJA_SOON}.
                  </p>
                ) : null,
              )}
            {listed > 0 && <p className={s.line}>{enterHint(listed)}</p>}
          </div>
        </div>
      </form>
    </>
  );
}

function Result({ result, now, onOpen }: { result: SearchResult; now: string; onOpen: () => void }) {
  const { film } = result;
  return (
    <Link href={`/film/${film.id}`} className={s.result} onClick={onOpen} data-testid={`search.hit.${film.id}`}>
      {film.poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser; TMDB serves sized files
        <img className={s.poster} src={`${TMDB}w154${film.poster}`} srcSet={`${TMDB}w154${film.poster} 1x, ${TMDB}w342${film.poster} 2x`} alt="" width={52} height={78} loading="lazy" decoding="async" />
      ) : (
        <span className={`${s.poster} ${s.noPoster}`}>
          <TicketFaceSticker height={25} />
        </span>
      )}
      <span className={s.text}>
        <span className={s.title}>{film.title}</span>
        <span className={s.meta}>{resultMeta(film, result.formats, result.cinemas, result.day, now, result.next.at)}</span>
        <span className={s.next}>{resultNext(result.next, result.day, now)}</span>
      </span>
      <Icon name="chevron-right" size={20} className={s.chevron} />
    </Link>
  );
}

function NoMatch({ words, onHome }: { words: { title: string; body: string | null; action: string }; onHome: () => void }) {
  return (
    <div className={s.none} data-testid="search.none">
      <TicketFaceSticker height={64} />
      <h3>{words.title}</h3>
      {words.body && <p>{words.body}</p>}
      <Link href="/" className={`${a.button} ${a.secondary}`} onClick={onHome} data-testid="search.home">
        {words.action}
      </Link>
    </div>
  );
}
