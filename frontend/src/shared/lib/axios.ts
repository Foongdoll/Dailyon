import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { useAuthStore } from "../store/auth";
import type { TokenPair } from "../../pages/auth/login";

// ✅ 환경변수 기반 (Vite 기준)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

/** Axios 인스턴스 생성 */
const api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // 쿠키 포함 (JWT Refresh 등)
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// refreshToken 요청 전용 인스턴스
const refreshInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // 쿠키 포함 (JWT Refresh 등)
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
})

// Access Token 최신화
function setAuthHeader(token: string | null) {
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete api.defaults.headers.common["Authorization"];
}

// 강제 로그아웃
function hardLogout() {
    useAuthStore.getState().setTokens(null, null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAuthHeader(null);
    window.location.replace("/auth/login?reason=expired");
}

let refreshing: Promise<string | null> | null = null;
const waiters: Array<(t: string | null) => void> = [];

async function refreshRequest(): Promise<string | null> {
    if (!refreshing) {
        const rt = localStorage.getItem("refresh_token");

        refreshing = rt
            ? refreshInstance
                .post<{ data: TokenPair }>("/auth/public/refresh", { refreshToken: rt })
                .then((res) => {
                    const { accessToken: newAT, refreshToken: newRT } = res.data.data;
                    // AT/RT 모두 회전 대응
                    localStorage.setItem("access_token", newAT);
                    if (newRT) localStorage.setItem("refresh_token", newRT);

                    useAuthStore.getState().setTokens(newAT, newRT ?? rt);
                    setAuthHeader(newAT);
                    return newAT;
                })
                .catch(() => null)
                .finally(() => {
                    const p = refreshing;
                    refreshing = null;
                    p?.then((tok) => {
                        const fns = waiters.splice(0);
                        fns.forEach((fn) => fn(tok));
                    });
                })
            : Promise.resolve(null);
    }
    return refreshing;
}


/** 요청 인터셉터 */
api.interceptors.request.use(
    (config: any) => {
        const token = localStorage.getItem("access_token");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

/** 응답 인터셉터 */
api.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    async (error: AxiosError) => {
        if (error.response) {
            const { status } = error.response;
            const original = error.config as AxiosRequestConfig & { _retry?: boolean }

            // 🔒 토큰 만료 시 처리
            if (status === 401 && !original._retry) {
                original._retry = true;

                return new Promise(async (resolve, reject) => {
                    // 대기열 등록: 리프레시 결과에 따라 재시도/실패
                    waiters.push((newToken) => {
                        if (!newToken) return reject(error);
                        (original.headers ||= {});
                        (original.headers as Record<string, any>).Authorization = `Bearer ${newToken}`;
                        resolve(api(original)); // 원본 요청 재시도
                    });

                    const token = await refreshRequest();
                    if (!token) {                        
                        const fns = waiters.splice(0);
                        fns.forEach((fn) => fn(null));
                        hardLogout();                        
                        return;
                    }
                });
            }
        }
        return Promise.reject(error);
    }
);

export const request = {
    get: <T = any>(url: string, params?: any) =>
        api.get<T>(url, { params }) as unknown as Promise<T>,
    post: <T = any>(url: string, data?: any) =>
        api.post<T>(url, data) as unknown as Promise<T>,
    put: <T = any>(url: string, data?: any) =>
        api.put<T>(url, data) as unknown as Promise<T>,
    patch: <T = any>(url: string, data?: any) =>
        api.patch<T>(url, data) as unknown as Promise<T>,
    delete: <T = any>(url: string) =>
        api.delete<T>(url) as unknown as Promise<T>,
};

