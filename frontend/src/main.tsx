import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router/router";
import { useAuthStore } from "./shared/store/auth";
import "./shared/styles/global.css";
import AppProviders from "./app/providers/AppProviders";

function Bootstrapper({ children }: { children: React.ReactNode }) {
  // 앱 시작 시 세션 복원
  React.useEffect(() => {
    const { setBooting, setTokens } = useAuthStore.getState();
    if (typeof window === "undefined") {
      setBooting(false);
      return;
    }

    (async () => {
      try {
        const access =
          localStorage.getItem("access_token") ?? localStorage.getItem("accessToken");
        const refresh =
          localStorage.getItem("refresh_token") ?? localStorage.getItem("refreshToken");

        if (access && refresh) {
          setTokens(access, refresh);
          // 필요시 /public/refresh 호출해서 갱신 로직 수행
        }
      } finally {
        setBooting(false);
      }
    })();
  }, []);
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(  
    <Bootstrapper>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </Bootstrapper>  
);
