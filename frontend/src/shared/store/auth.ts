import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  booting: boolean;
  setTokens: (a: string | null, r: string | null) => void;
  setBooting: (b: boolean) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      booting: true,
      setTokens: (a, r) =>
        set(() => ({
          accessToken: a,
          refreshToken: r,
        })),
      setBooting: (b) => set({ booting: b }),
      clear: () =>
        set(() => ({
          accessToken: null,
          refreshToken: null,
          booting: false,
        })),
    }),
    {
      name: "auth-store", // localStorage key 이름
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
