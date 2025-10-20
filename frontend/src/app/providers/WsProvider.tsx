import React from "react";
import { useAuth } from "./AuthSessionProvider";
import { toast } from "sonner";

type Status = "disconnected" | "connecting" | "connected";
type WsCtx = {
  status: Status;
  send: (data: unknown) => void;
  lastMessage: MessageEvent | null;
};
const Ctx = React.createContext<WsCtx | null>(null);

// 환경변수나 설정에 맞게 교체하세요.
const WS_URL = (import.meta as any).env?.VITE_WS_URL || "wss://example.com/ws/chat";

export default function WsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthed, accessToken } = useAuth();
  const [status, setStatus] = React.useState<Status>("disconnected");
  const [lastMessage, setLastMessage] = React.useState<MessageEvent | null>(null);
  const wsRef = React.useRef<WebSocket | null>(null);
  const retryRef = React.useRef(0);

  const connect = React.useCallback(() => {
    if (!isAuthed || !accessToken) return;

    setStatus("connecting");
    const url = new URL(WS_URL);
    url.searchParams.set("token", accessToken);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      retryRef.current = 0;
    };
    ws.onmessage = (ev) => {
      setLastMessage(ev);
    };
    ws.onclose = () => {
      setStatus("disconnected");
      // 재연결 지수 백오프
      if (isAuthed) {
        const delay = Math.min(1000 * 2 ** retryRef.current++, 10000);
        setTimeout(connect, delay);
      }
    };
    ws.onerror = () => {
      toast.error("실시간 연결 에러");
    };
  }, [isAuthed, accessToken]);

  React.useEffect(() => {
    if (isAuthed) connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [isAuthed, connect]);

  const send = React.useCallback((data: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(typeof data === "string" ? data : JSON.stringify(data));
    } else {
      toast.error("연결되지 않았습니다.");
    }
  }, []);

  const value = React.useMemo<WsCtx>(() => ({ status, send, lastMessage }), [status, send, lastMessage]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useWs = () => {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useWs must be used within WsProvider");
  return ctx;
};
