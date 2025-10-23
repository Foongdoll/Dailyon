import { request } from "../lib/axios";
import type { ApiResponse } from "./types";
import type { UserSummary } from "../types/user";

export async function searchUsers(keyword: string): Promise<UserSummary[]> {
  const res = await request.get<ApiResponse<UserSummary[]>>("/users/search", { keyword });
  return res.data;
}
