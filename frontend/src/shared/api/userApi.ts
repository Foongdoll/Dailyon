import { request } from "../lib/axios";
import type { ApiResponse } from "./types";
import type { UserProfile, UserSummary } from "../types/user";

export async function fetchCurrentUser(): Promise<UserProfile> {
  const res = await request.get<ApiResponse<UserProfile>>("/users/me");
  return res.data;
}

export async function searchUsers(keyword: string): Promise<UserSummary[]> {
  const res = await request.get<ApiResponse<UserSummary[]>>("/users/search", { keyword });
  return res.data;
}
