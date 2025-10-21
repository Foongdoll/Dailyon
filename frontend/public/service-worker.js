// public/service-worker.js

const CACHE_NAME = "dailyon-static-v1";
const PRECACHE_URLS = [
  "/",               // SPA index (CSR 기준)
  "/favicon.ico",    // 필요 시 추가
  "/manifest.webmanifest", // 있으면 manifest도 캐시
];

// 즉시 업데이트 메시지 처리
self.addEventListener("message", (event) => {
  if (event?.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 설치: 개별 fetch 로 캐시 (하나 실패해도 install 진행)
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of PRECACHE_URLS) {
        try {
          const res = await fetch(url, { cache: "no-cache" });
          if (res.ok) {
            await cache.put(url, res.clone());
          } else {
            console.warn(`[SW] precache skipped (${res.status}):`, url);
          }
        } catch (err) {
          console.warn("[SW] precache failed:", url, err);
        }
      }
      await self.skipWaiting();
    })()
  );
});

// 활성화: 이전 캐시 정리
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
      );
      await self.clients.claim();
    })()
  );
});

// fetch 핸들러
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 다른 도메인은 건드리지 않음
  if (url.origin !== self.location.origin) return;

  // 정적 자산 → Cache First
  const isStatic =
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".ico");

  if (isStatic) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // HTML, API 등 → Network First + fallback
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        return res;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        const fallback = await cache.match("/");
        return fallback || Response.error();
      }
    })()
  );
});
