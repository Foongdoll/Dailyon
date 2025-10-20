import React from "react";

type TokenPair = { accessToken: string; refreshToken: string };
type AuthCtx = {
  booting: boolean;
  isAuthed: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (t: TokenPair | null) => void;
  logout: () => void;
  ensureFreshAccessToken: () => Promise<string | null>;
};
const AuthContext = React.createContext<AuthCtx | null>(null);

const ACCESS_KEY = "dailyon.access";
const REFRESH_KEY = "dailyon.refresh";

// --- 간단한 토큰 만료여부 판단 (JWT exp)
function isExpired(jwt: string): boolean {
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    if (!payload.exp) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp - 15 <= nowSec; // 15초 여유
  } catch {
    return false;
  }
}

async function refreshToken(refreshToken: string): Promise<TokenPair | null> {
  try {
    const res = await fetch("/api/public/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) return null;
    const data = await res.json();
    // ApiResponse 규격: { success, data: { accessToken, refreshToken } }
    if (data?.success && data?.data?.accessToken && data?.data?.refreshToken) {
      return { accessToken: data.data.accessToken, refreshToken: data.data.refreshToken };
    }
    return null;
  } catch {
    return null;
  }
}

export default function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = React.useState(true);
  const [accessToken, setAccess] = React.useState<string | null>(null);
  const [refresh, setRefresh] = React.useState<string | null>(null);

  const setTokens = React.useCallback((pair: TokenPair | null) => {
    if (pair) {
      setAccess(pair.accessToken);
      setRefresh(pair.refreshToken);
      localStorage.setItem(ACCESS_KEY, pair.accessToken);
      localStorage.setItem(REFRESH_KEY, pair.refreshToken);
    } else {
      setAccess(null);
      setRefresh(null);
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  }, []);

  const logout = React.useCallback(() => setTokens(null), [setTokens]);

  const ensureFreshAccessToken = React.useCallback(async () => {
    if (!accessToken && !refresh) return null;
    // access 만료 시 refresh 시도
    if (accessToken && !isExpired(accessToken)) return accessToken;
    if (!refresh) return null;

    const next = await refreshToken(refresh);
    if (next) {
      setTokens(next);
      return next.accessToken;
    } else {
      setTokens(null);
      return null;
    }
  }, [accessToken, refresh, setTokens]);

  // 부팅: localStorage 복원 + 만료 시 refresh 1회 시도
  React.useEffect(() => {
    (async () => {
      const a = localStorage.getItem(ACCESS_KEY);
      const r = localStorage.getItem(REFRESH_KEY);
      if (a) setAccess(a);
      if (r) setRefresh(r);

      if (a && !isExpired(a)) {
        // OK
      } else if (r) {
        const next = await refreshToken(r);
        if (next) setTokens(next);
      }
      setBooting(false);
    })();
  }, [setTokens]);

  const value: AuthCtx = {
    booting,
    isAuthed: !!accessToken,
    accessToken,
    refreshToken: refresh,
    setTokens,
    logout,
    ensureFreshAccessToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthSessionProvider");
  return ctx;
};
