import React from "react";
import { toast } from "sonner";

// Vite-PWA 플러그인을 쓰지 않아도 동작하는 일반 SW 등록 버전.
// 이미 별도 SW가 있다면 경로/전략을 맞춰주세요.
const SW_PATH = "/service-worker.js";

export default function PwaUpdateProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator) || window.location.protocol !== "https:") return;

    let registration: ServiceWorkerRegistration | null = null;
    const onUpdateFound = () => {
      if (!registration) return;
      const installing = registration.installing;
      if (!installing) return;
      installing.onstatechange = () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          // 새 버전 준비됨
          toast.info("새 버전이 준비되었습니다.", {
            action: {
              label: "업데이트",
              onClick: () => {
                registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
                setTimeout(() => window.location.reload(), 300);
              },
            },
          });
        }
      };
    };

    navigator.serviceWorker.register(SW_PATH).then((reg) => {
      registration = reg;
      registration.addEventListener("updatefound", onUpdateFound);

      // 페이지 포커스 시 업데이트 체크
      const onFocus = () => registration?.update();
      window.addEventListener("focus", onFocus);

      // waiting 상태 즉시 적용 핸들
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // 새 SW가 컨트롤하면 자동 리로드 옵션도 가능
      });

      return () => {
        registration?.removeEventListener("updatefound", onUpdateFound);
        window.removeEventListener("focus", onFocus);
      };
    });
  }, []);

  return <>{children}</>;
}
