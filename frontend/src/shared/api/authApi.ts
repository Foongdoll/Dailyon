import type { TokenPair } from "../../pages/auth/login";
import { request } from "../lib/axios";
import type { ApiResponse } from "./types";

/** 로그인 요청 */
export async function loginRequest(user: { email: string; password: string }): Promise<TokenPair> {
  const res = await request.post<ApiResponse<TokenPair>>("/auth/public/login", user);
  return res.data;
}

/** 회원가입 요청 */
export async function signupRequest(user: { nickname: string; email: string; password: string }) {
  const res = await request.post<ApiResponse<unknown>>("/auth/public/signup", user);
  return res.data;
}