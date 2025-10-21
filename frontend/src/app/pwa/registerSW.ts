export async function registerSW(swUrl = "/service-worker.js") {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost") return;

  try {
    const reg = await navigator.serviceWorker.register(swUrl, { scope: "/" });

    reg.addEventListener("updatefound", () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent("pwa:update-ready"));
        }
      });
    });

    const onFocus = () => reg.update();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  } catch (e) {
    console.error("[SW] register failed:", e);
  }
}

registerSW();
