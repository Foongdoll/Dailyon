import type { TokenPair } from "../../pages/auth/login";
import { request } from "../lib/axios";

/** 로그인 요청 */
export async function loginRequest(user: { email: string; password: string }): Promise<TokenPair> {
    return (await request.post<TokenPair>("/auth/public/login", user)).data;
}

/** 회원가입 요청 */
export async function signupRequest(user: { nickname: string, email: string; password: string }) {
    return (await request.post("/auth/public/signup", user)).data;
}
