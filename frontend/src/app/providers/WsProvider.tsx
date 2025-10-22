import React from "react";
import { toast } from "sonner";

type Status = "disconnected" | "connecting" | "connected";

type WsCtx = {
  status: Status;
  send: (data: unknown) => void;
  lastMessage: MessageEvent | null;
};

const Ctx = React.createContext<WsCtx | null>(null);

export default function WsProvider({ children }: { children: React.ReactNode }) {
  const send = React.useCallback((data: unknown) => {
    toast.error("실시간 연결이 아직 준비되지 않았습니다.");
    console.debug("WS send attempted", data);
  }, []);

  const value = React.useMemo<WsCtx>(
    () => ({
      status: "disconnected",
      send,
      lastMessage: null,
    }),
    [send]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useWs = () => {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useWs must be used within WsProvider");
  return ctx;
};
