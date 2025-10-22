import { request } from "../lib/axios";
import type { ApiResponse } from "./types";
import type { PlannerEvent, PlannerEventRequest } from "../types/planner";

export type PlannerEventListParams = {
  startDate: string;
  endDate: string;
};

export async function fetchPlannerEvents(params: PlannerEventListParams): Promise<PlannerEvent[]> {
  const res = await request.get<ApiResponse<PlannerEvent[]>>("/planner/events", params);
  return res.data;
}

export async function fetchPlannerEvent(id: number): Promise<PlannerEvent> {
  const res = await request.get<ApiResponse<PlannerEvent>>(`/planner/events/${id}`);
  return res.data;
}

export async function createPlannerEvent(payload: PlannerEventRequest): Promise<PlannerEvent> {
  const res = await request.post<ApiResponse<PlannerEvent>>("/planner/events", payload);
  return res.data;
}

export async function updatePlannerEvent(id: number, payload: PlannerEventRequest): Promise<PlannerEvent> {
  const res = await request.put<ApiResponse<PlannerEvent>>(`/planner/events/${id}`, payload);
  return res.data;
}

export async function deletePlannerEvent(id: number): Promise<void> {
  await request.delete<ApiResponse<void>>(`/planner/events/${id}`);
}

export async function togglePlannerEventShare(id: number, shared: boolean): Promise<PlannerEvent> {
  const res = await request.post<ApiResponse<PlannerEvent>>(`/planner/events/${id}/share`, { shared });
  return res.data;
}

export async function fetchSharedPlannerEvent(code: string): Promise<PlannerEvent> {
  const res = await request.get<ApiResponse<PlannerEvent>>(`/planner/public/events/${code}`);
  return res.data;
}
