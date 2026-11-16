// Sinima's service worker: the last copy of each page and its data stays on the phone, so the site
// still opens with no connection and says how old the times are (Figma Offline, build unit 11).
// Pages, page data, the times files, fonts, stickers, logos and icons: the network first, the saved
// copy when it fails. Next's hashed build files and TMDB posters: the saved copy first (posters
// are fetched with CORS, so only ones that loaded are saved, at their real size). Films is saved
// when the worker installs and each page when it is first shown, so a page opened once opens
// offline. Nothing is sent anywhere; the caches live on this phone only.

const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const FILES = `files-${VERSION}`;
const POSTERS = `posters-${VERSION}`;
const MAX_POSTERS = 120;
const MAX_FILES = 400; // a few deploys' build files; older ones go first

// The page data Next asks for when you move between pages carries a cache-busting ?_rsc=; the
// copy is the same for every value, so it is kept under the path alone.
function key(request) {
  const url = new URL(request.url);
  if (!url.searchParams.has("_rsc")) return request;
  url.searchParams.delete("_rsc");
  return url.href;
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.add("/"))
      .catch(() => {}),
  );
});
// A page asks to be saved once the worker controls it: the first visit is not seen by the worker.
// It sends the build files it loaded too (some are added by Next's runtime, not named in the HTML),
// or offline it would show its text but never start.
async function savePage(path, files) {
  const response = await fetch(path);
  if (response.ok) await save(await caches.open(PAGES), path, response);
  const cache = await caches.open(FILES);
  await Promise.all(files.map(async (file) => (await cache.match(file)) ?? cache.add(file).catch(() => {})));
}
self.addEventListener("message", (event) => {
  const { save, files } = event.data ?? {};
  if (typeof save !== "string" || !save.startsWith("/")) return;
  const built = Array.isArray(files) ? files.filter((file) => typeof file === "string" && file.startsWith("/_next/static/")) : [];
  event.waitUntil(savePage(save, built).catch(() => {}));
});

// A copy a browser will serve to a page: one that followed a redirect is refused for a navigation,
// so it is saved as a fresh response with the same body and headers.
async function storable(response) {
  if (!response.redirected) return response.clone();
  const { status, statusText, headers } = response;
  return new Response(await response.clone().blob(), { status, statusText, headers });
}

// Saving can fail (the phone's storage is full); the visitor still gets the response.
async function save(cache, request, response) {
  try {
    await cache.put(request, await storable(response));
    return true;
  } catch {
    return false;
  }
}

async function networkFirst(event) {
  const { request } = event;
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok) event.waitUntil(save(cache, key(request), response));
    return response;
  } catch (error) {
    const saved = (await cache.match(key(request))) ?? (await cache.match(request, { ignoreSearch: true }));
    if (saved) return saved;
    if (request.mode === "navigate") {
      const home = await cache.match("/");
      if (home) return home;
    }
    throw error;
  }
}

async function cacheFirst(request, name, limit) {
  const cache = await caches.open(name);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok && (await save(cache, request, response))) {
    if (limit) {
      const keys = await cache.keys();
      await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map((key) => cache.delete(key)));
    }
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.hostname === "image.tmdb.org") {
    event.respondWith(cacheFirst(request, POSTERS, MAX_POSTERS));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // Next's build files carry a hash in their names, so a saved copy never goes out of date.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, FILES, MAX_FILES));
    return;
  }
  // Pages (and the page data Next fetches when you move between them), the times files, and the
  // files whose names stay the same when they change (fonts, stickers, logos, icons).
  if (request.mode === "navigate" || url.searchParams.has("_rsc") || /^\/(data|fonts|stickers|logos|icons)\//.test(url.pathname) || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(event));
  }
});
