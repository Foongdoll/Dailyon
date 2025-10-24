import { request } from "../lib/axios";
import type { ApiResponse } from "./types";
import type {
  SheetContent,
  SheetPage,
  SheetSavePayload,
  SheetSummary,
} from "../types/ledger";

export type SheetListParams = {
  ownerId: number;
  page?: number;
  size?: number;
  title?: string;
  sort?: string;
};

export async function fetchSheets(params: SheetListParams): Promise<SheetPage> {
  const res = await request.get<ApiResponse<SheetPage>>("/ledger", {
    ownerId: params.ownerId,
    page: Math.max(0, (params.page ?? 1) - 1),
    size: params.size ?? 10,
    title: params.title?.trim() || undefined,
    sort: params.sort ?? "updatedAt,DESC",
  });
  return res.data;
}

export async function fetchSheetContent(sheetId: number, ownerId: number): Promise<SheetContent> {
  const res = await request.get<ApiResponse<SheetContent>>(`/ledger/${sheetId}`, {
    ownerId,
  });
  return res.data;
}

export async function createSheet(payload: SheetSavePayload): Promise<SheetSummary> {
  const res = await request.post<ApiResponse<SheetSummary>>("/ledger", {
    ...payload,
    replaceAll: payload.replaceAll ?? true,
  });
  return res.data;
}

export async function updateSheet(
  sheetId: number,
  payload: SheetSavePayload
): Promise<SheetSummary> {
  const res = await request.put<ApiResponse<SheetSummary>>(`/ledger/${sheetId}`, {
    ...payload,
  });
  return res.data;
}

export async function deleteSheet(sheetId: number, ownerId: number): Promise<void> {
  await request.delete<ApiResponse<void>>(`/ledger/${sheetId}?ownerId=${ownerId}`);
}
