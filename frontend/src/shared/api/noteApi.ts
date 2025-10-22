import { request } from "../lib/axios";
import type { ApiResponse } from "./types";
import type { Note, NoteLayout, NotePage } from "../types/note";

export type NoteUpsertPayload = {
  categoryId: number;
  title: string;
  content?: string;
  color?: string;
  pinned: boolean;
  tags: string[];
  fields: Record<string, unknown>;
  layout?: NoteLayout | null;
};

export type NoteListParams = {
  categoryId: number;
  page: number;
  size: number;
  keyword?: string;
};

export type LayoutUpdatePayload = {
  noteId: number;
  position: number;
  layout?: NoteLayout | null;
};

const sanitizeLayout = (layout?: NoteLayout | null) =>
  layout ?? {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  };

export async function fetchNotes(params: NoteListParams): Promise<NotePage> {
  const res = await request.get<ApiResponse<NotePage>>("/notes", {
    categoryId: params.categoryId,
    page: params.page,
    size: params.size,
    keyword: params.keyword?.trim() || undefined,
  });
  return res.data;
}

export async function fetchNote(id: number): Promise<Note> {
  const res = await request.get<ApiResponse<Note>>(`/notes/${id}`);
  return res.data;
}

export async function createNote(payload: NoteUpsertPayload): Promise<Note> {
  const res = await request.post<ApiResponse<Note>>("/notes", {
    ...payload,
    layout: sanitizeLayout(payload.layout),
  });
  return res.data;
}

export async function updateNote(id: number, payload: NoteUpsertPayload): Promise<Note> {
  const res = await request.put<ApiResponse<Note>>(`/notes/${id}`, {
    ...payload,
    layout: sanitizeLayout(payload.layout),
  });
  return res.data;
}

export async function deleteNote(id: number): Promise<void> {
  await request.delete<ApiResponse<void>>(`/notes/${id}`);
}

export async function updateNoteLayouts(payload: LayoutUpdatePayload[]): Promise<void> {
  await request.patch<ApiResponse<void>>("/notes/layout", payload.map((item) => ({
    noteId: item.noteId,
    position: item.position,
    layout: sanitizeLayout(item.layout),
  })));
}
