export type NoteFieldType = "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "TAGS";

export type NoteCategoryField = {
  key: string;
  label: string;
  type: NoteFieldType;
  required: boolean;
  orderIndex: number;
};

export type NoteCategory = {
  id: number;
  name: string;
  description?: string | null;
  fields: NoteCategoryField[];
};

export type NoteLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Note = {
  id: number;
  category_id: number;
  categoryName: string;
  title: string;
  content: string | null;
  color?: string | null;
  pinned: boolean;
  tags: string[];
  fields: Record<string, unknown>;
  layout: NoteLayout | null;
  position: number;
  created_at: string | null;
  updated_at: string | null;
};

export type NotePage = {
  notes: Note[];
  totalElements: number;
  totalPages: number;
  page: number;
};
