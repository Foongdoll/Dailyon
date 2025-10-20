// 브라우저에서 SW를 등록하고, 포커스 시 업데이트를 확인하는 경량 등록 스크립트
// 앱 엔트리(예: main.tsx)에서 import만 하면 동작:
//
//   import "./app/pwa/registerSW";
//
export async function registerSW(swUrl = "/service-worker.js") {
  if (!("serviceWorker" in navigator)) return;
  // 로컬 개발(https 아님)에서도 테스트하려면 조건 완화 가능
  if (location.protocol !== "https:" && location.hostname !== "localhost") return;

  try {
    const reg = await navigator.serviceWorker.register(swUrl);

    // 새 버전 탐지
    reg.addEventListener("updatefound", () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        // 대체로 "installed" 상태일 때 새 버전 준비됨
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          // 여기선 UI는 띄우지 않고, PwaUpdateProvider가 토스트를 책임짐
          // 필요 시 커스텀 이벤트를 발생시켜도 됨
          const evt = new CustomEvent("pwa:update-ready");
          window.dispatchEvent(evt);
        }
      });
    });

    // 탭이 다시 활성화될 때 업데이트 체크
    const onFocus = () => reg.update();
    window.addEventListener("focus", onFocus);

    // 정리
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[SW] register failed:", e);
  }
}

// 즉시 등록
registerSW();
