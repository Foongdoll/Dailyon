import { request } from "../lib/axios";
import type { ApiResponse } from "./types";

type TokenPairResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};

type LoginPayload = { email: string; password: string };
type SignupPayload = { nickname: string; email: string; password: string };

const toClientTokenPair = (pair: TokenPairResponse): TokenPair => ({
  accessToken: pair.access_token,
  refreshToken: pair.refresh_token,
  tokenType: pair.token_type,
});

/** 로그인 요청 */
export async function loginRequest(user: LoginPayload): Promise<TokenPair> {
  const res = await request.post<ApiResponse<TokenPairResponse>>("/auth/public/login", user);
  return toClientTokenPair(res.data);
}

/** 토큰 리프레시 */
export async function refreshRequest(refreshToken: string): Promise<TokenPair> {
  const res = await request.post<ApiResponse<TokenPairResponse>>("/auth/public/refresh", {
    refresh_token: refreshToken,
  });
  return toClientTokenPair(res.data);
}

/** 회원가입 요청 */
export async function signupRequest(user: SignupPayload): Promise<TokenPair> {
  const res = await request.post<ApiResponse<TokenPairResponse>>("/auth/public/signup", user);
  return toClientTokenPair(res.data);
}
