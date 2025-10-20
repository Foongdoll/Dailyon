import React from "react";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./AuthSessionProvider";

// 에러 메시지 추출 헬퍼
function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) return String((err as any).message);
  return "Unexpected error";
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const { ensureFreshAccessToken, logout } = useAuth();

  const clientRef = React.useRef<QueryClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new QueryClient({
      queryCache: new QueryCache({
        onError: (error) => {
          toast.error(getErrorMessage(error));
        },
      }),
      mutationCache: new MutationCache({
        onError: (error) => {
          toast.error(getErrorMessage(error));
        },
      }),
      defaultOptions: {
        queries: {
          retry(failureCount, error) {
            // 네트워크 오류만 2회 재시도
            const isNetwork = !("status" in (error as any));
            return isNetwork && failureCount < 2;
          },
          staleTime: 60_000, // 60s
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: 0, // POST/PUT/PATCH/DELETE는 기본 재시도 안 함
        },
      },
    });
  }

  // fetch wrapper: 401 처리 & 자동 토큰 갱신 (원한다면 전역 fetch 대체 가능)
  React.useEffect(() => {
    const origFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let req = init ?? {};
      // Authorization 헤더 자동 주입 (있으면 유지)
      const token = await ensureFreshAccessToken();
      const headers = new Headers(req.headers);
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      req.headers = headers;

      let res = await origFetch(input, req);

      if (res.status === 401) {
        // 갱신 재시도
        const token2 = await ensureFreshAccessToken();
        if (!token2) {
          // 완전히 실패 → 로그아웃
          logout();
          return res;
        }
        const headers2 = new Headers(req.headers);
        headers2.set("Authorization", `Bearer ${token2}`);
        res = await origFetch(input, { ...req, headers: headers2 });
      }

      return res;
    };
    return () => {
      window.fetch = origFetch;
    };
  }, [ensureFreshAccessToken, logout]);

  return (
    <QueryClientProvider client={clientRef.current!}>
      {children}
    </QueryClientProvider>
  );
}
