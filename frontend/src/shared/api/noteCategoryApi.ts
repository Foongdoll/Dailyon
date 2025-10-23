import { request } from "../lib/axios";
import type { ApiResponse } from "./types";
import type { NoteCategory, NoteCategoryField, NoteFieldType } from "../types/note";

export type CategoryPayload = {
  name: string;
  description?: string;
  fields: NoteCategoryField[];
};

type CategoryFieldRequestPayload = {
  key: string;
  label: string;
  type: NoteFieldType;
  required: boolean;
  order_index: number;
};

const mapFieldsForRequest = (fields: NoteCategoryField[]): CategoryFieldRequestPayload[] =>
  fields.map((field, index) => ({
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    order_index: field.orderIndex ?? index,
  }));

export async function fetchCategories(): Promise<NoteCategory[]> {
  const res = await request.get<ApiResponse<NoteCategory[]>>("/notes/categories");
  return res.data;
}

export async function createCategory(payload: CategoryPayload): Promise<NoteCategory> {
  const res = await request.post<ApiResponse<NoteCategory>>("/notes/categories", {
    name: payload.name,
    description: payload.description,
    fields: mapFieldsForRequest(payload.fields),
  });
  return res.data;
}

export async function updateCategory(categoryId: number, payload: CategoryPayload): Promise<NoteCategory> {
  const res = await request.put<ApiResponse<NoteCategory>>(`/notes/categories/${categoryId}`, {
    name: payload.name,
    description: payload.description,
    fields: mapFieldsForRequest(payload.fields),
  });
  return res.data;
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await request.delete<ApiResponse<void>>(`/notes/categories/${categoryId}`);
}
