import axios, { AxiosError, type AxiosInstance, type AxiosResponse } from "axios";

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
            console.log(error.response)
            const { status } = error.response;

            // 🔒 토큰 만료 시 처리
            if (status === 401) {
                console.warn("토큰 만료. 재로그인 필요.");
                localStorage.removeItem("access_token");
                // window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export const request = {
    get: <T = any>(url: string, params?: any) => api.get<T>(url, { params }),
    post: <T = any>(url: string, data?: any) => api.post<T>(url, data),
    put: <T = any>(url: string, data?: any) => api.put<T>(url, data),
    patch: <T = any>(url: string, data?: any) => api.patch<T>(url, data),
    delete: <T = any>(url: string) => api.delete<T>(url),
};