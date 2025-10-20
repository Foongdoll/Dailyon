/* Minimal SW for installability + update prompt + light caching */

const CACHE_NAME = "dailyon-static-v1";
const PRECACHE = [
  "/",             // 홈 (SSR/CSR 라우팅 상황에 따라 제거 가능)
  "/favicon.ico"   // 필요 시 추가
];

// 메시지로 즉시 업데이트
self.addEventListener("message", (event) => {
  if (event?.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
      await self.clients.claim();
    })()
  );
});

// 정적 자산은 CacheFirst, 나머지는 네트워크 우선(필요시 조정)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 같은 오리진 & 정적 파일로 추정되면 CacheFirst
  const isSameOrigin = url.origin === self.location.origin;
  const isStatic =
    isSameOrigin &&
    (url.pathname.startsWith("/assets/") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".woff2"));

  if (isStatic) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // 나머지는 NetworkFirst (오프라인 시 캐시 fallback)
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
