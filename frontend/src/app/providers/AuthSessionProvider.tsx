import React from "react";
import { refreshRequest, type TokenPair } from "../../shared/api/authApi";
import { useAuthStore } from "../../shared/store/auth";

type AuthCtx = {
  booting: boolean;
  isAuthed: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (pair: TokenPair | null) => void;
  logout: () => void;
  ensureFreshAccessToken: () => Promise<string | null>;
};

const AuthContext = React.createContext<AuthCtx | null>(null);

const REFRESH_MARGIN_SECONDS = 15;

function isExpired(jwt: string): boolean {
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    if (!payload.exp) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp - REFRESH_MARGIN_SECONDS <= nowSec;
  } catch {
    return false;
  }
}

export default function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const booting = useAuthStore((s) => s.booting);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setTokensState = useAuthStore((s) => s.setTokens);
  const clearState = useAuthStore((s) => s.clear);

  const refreshInFlight = React.useRef<Promise<string | null> | null>(null);

  const setTokens = React.useCallback(
    (pair: TokenPair | null) => {
      if (pair) {
        setTokensState(pair.accessToken, pair.refreshToken);
      } else {
        clearState();
      }
    },
    [clearState, setTokensState]
  );

  const logout = React.useCallback(() => {
    clearState();
  }, [clearState]);

  const ensureFreshAccessToken = React.useCallback(async () => {
    const store = useAuthStore.getState();
    const currentAccess = store.accessToken;
    if (currentAccess && !isExpired(currentAccess)) {
      return currentAccess;
    }

    const currentRefresh = store.refreshToken;
    if (!currentRefresh) {
      store.clear();
      return null;
    }

    if (!refreshInFlight.current) {
      refreshInFlight.current = (async () => {
        try {
          const next = await refreshRequest(currentRefresh);
          store.setTokens(next.accessToken, next.refreshToken);
          return next.accessToken;
        } catch {
          store.clear();
          return null;
        } finally {
          refreshInFlight.current = null;
        }
      })();
    }

    return refreshInFlight.current;
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const hydrateAndRefresh = async () => {
      const store = useAuthStore.getState();
      try {
        const { accessToken: currentAccess, refreshToken: currentRefresh } = store;
        if (currentAccess && !isExpired(currentAccess)) {
          return;
        }
        if (currentRefresh) {
          const next = await refreshRequest(currentRefresh);
          if (cancelled) return;
          store.setTokens(next.accessToken, next.refreshToken);
        } else {
          store.clear();
        }
      } catch {
        if (!cancelled) {
          store.clear();
        }
      } finally {
        if (!cancelled) {
          store.setBooting(false);
        }
      }
    };

    const persistApi = useAuthStore.persist;
    if (!persistApi) {
      hydrateAndRefresh();
      return () => {
        cancelled = true;
      };
    }

    if (persistApi.hasHydrated?.()) {
      hydrateAndRefresh();
    } else {
      const unsubscribe = persistApi.onFinishHydration?.(() => {
        hydrateAndRefresh();
      });
      return () => {
        cancelled = true;
        unsubscribe?.();
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const value = React.useMemo<AuthCtx>(
    () => ({
      booting,
      isAuthed: !!accessToken,
      accessToken,
      refreshToken,
      setTokens,
      logout,
      ensureFreshAccessToken,
    }),
    [accessToken, booting, ensureFreshAccessToken, logout, refreshToken, setTokens]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthSessionProvider");
  return ctx;
};
