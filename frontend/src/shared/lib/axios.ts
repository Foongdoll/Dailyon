import axios, { AxiosError, type AxiosInstance, type AxiosResponse } from "axios";
import { refreshRequest } from "../api/authApi";
import { useAuthStore } from "../store/auth";

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

/** 요청 인터셉터 */
api.interceptors.request.use(
    (config: any) => {
        const token = useAuthStore.getState().accessToken;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

let refreshPromise: Promise<string | null> | null = null;

const logout = () => {
    const { clear, setBooting } = useAuthStore.getState();
    clear();
    setBooting(false);
};

/** 응답 인터셉터 */
api.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    async (error: AxiosError) => {
        const response = error.response;
        const originalRequest: any = error.config ?? {};

        if (response?.status === 401) {
            if (!originalRequest._retry) {
                originalRequest._retry = true;
                const { refreshToken, setTokens } = useAuthStore.getState();

                if (refreshToken) {
                    if (!refreshPromise) {
                        refreshPromise = refreshRequest(refreshToken)
                            .then((pair) => {
                                setTokens(pair.accessToken, pair.refreshToken);
                                return pair.accessToken;
                            })
                            .catch(() => {
                                logout();
                                return null;
                            })
                            .finally(() => {
                                refreshPromise = null;
                            });
                    }

                    const newToken = await refreshPromise;
                    if (newToken) {
                        originalRequest.headers = originalRequest.headers ?? {};
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    }
                }
            }

            logout();
        }

        return Promise.reject(error);
    }
);

export const request = {
    get: <T = unknown>(url: string, params?: Record<string, unknown>) =>
        api.get<T>(url, { params }).then((res) => res as T),
    post: <T = unknown>(url: string, data?: unknown) =>
        api.post<T>(url, data).then((res) => res as T),
    put: <T = unknown>(url: string, data?: unknown) =>
        api.put<T>(url, data).then((res) => res as T),
    patch: <T = unknown>(url: string, data?: unknown) =>
        api.patch<T>(url, data).then((res) => res as T),
    delete: <T = unknown>(url: string) =>
        api.delete<T>(url).then((res) => res as T),
};
