import { create } from "zustand";

type AuthState = {
    accessToken: string | null;
    refreshToken: string | null;
    booting: boolean;                // 앱 초기 부팅(세션 복원) 중 플래그
    setTokens: (a: string | null, r: string | null) => void;
    setBooting: (b: boolean) => void;
};

export const useAuthStore = create<AuthState>((set: any) => ({
    accessToken: null,
    refreshToken: null,
    booting: true,
    setTokens: (a: any, r: any) => set({ accessToken: a, refreshToken: r }),
    setBooting: (b: any) => set({ booting: b }),
}));
