import { create } from "zustand";
import { persist } from "zustand/middleware";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

const syncTokenStorage = (access: string | null, refresh: string | null) => {
  if (typeof window === "undefined") return;

  if (access) {
    localStorage.setItem(ACCESS_KEY, access);
  } else {
    localStorage.removeItem(ACCESS_KEY);
  }

  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh);
  } else {
    localStorage.removeItem(REFRESH_KEY);
  }
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  booting: boolean;
  setTokens: (a: string | null, r: string | null) => void;
  setBooting: (b: boolean) => void;
  _hasHydrated: boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      booting: true,
      _hasHydrated: false,
      setTokens: (a, r) => {
        syncTokenStorage(a, r);
        set({ accessToken: a, refreshToken: r });
      },
      setBooting: (b) => set({ booting: b }),
    }),
    {
      name: "auth",
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
    }
  )
);
