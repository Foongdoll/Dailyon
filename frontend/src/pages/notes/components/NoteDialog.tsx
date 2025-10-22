import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { Note, NoteCategory, NoteCategoryField } from "../../../shared/types/note";
import type { NoteUpsertPayload } from "../../../shared/api/noteApi";

const sortFields = (fields: NoteCategoryField[]) =>
  fields.slice().sort((a, b) => a.orderIndex - b.orderIndex);

const defaultLayout = { x: 0, y: 0, width: 1, height: 1 };

type NoteDialogProps = {
  open: boolean;
  category?: NoteCategory;
  note?: Note | null;
  onClose: () => void;
  onSubmit: (payload: NoteUpsertPayload, noteId?: number) => Promise<void>;
};

const toFieldValues = (category?: NoteCategory, note?: Note | null) => {
  if (!category) return {};
  const values: Record<string, unknown> = {};
  sortFields(category.fields).forEach((field) => {
    const raw = note?.fields?.[field.key];
    if (raw === undefined || raw === null) {
      values[field.key] =
        field.type === "BOOLEAN" ? false : field.type === "NUMBER" ? "" : "";
    } else if (field.type === "BOOLEAN") {
      values[field.key] = Boolean(raw);
    } else if (field.type === "TAGS" && Array.isArray(raw)) {
      values[field.key] = raw.join(", ");
    } else {
      values[field.key] = String(raw);
    }
  });
  return values;
};

export default function NoteDialog({
  open,
  category,
  note,
  onClose,
  onSubmit,
}: NoteDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("");
  const [pinned, setPinned] = useState(false);
  const [tags, setTags] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!open) return;
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setColor(note?.color ?? "");
    setPinned(note?.pinned ?? false);
    setTags(note?.tags?.join(", ") ?? "");
    setFieldValues(toFieldValues(category, note));
  }, [open, category, note]);

  const fields = useMemo(() => sortFields(category?.fields ?? []), [category]);

  const handleFieldInput = (key: string, value: string | boolean) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!category) {
      toast.error("카테고리를 먼저 선택하세요.");
      return;
    }
    if (!title.trim()) {
      toast.error("노트 제목을 입력하세요.");
      return;
    }

    const preparedFields: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = fieldValues[field.key];
      if (field.type === "BOOLEAN") {
        preparedFields[field.key] = Boolean(raw);
        continue;
      }
      if (raw === undefined || raw === null) {
        if (field.required) {
          toast.error(`${field.label} 값을 입력해주세요.`);
          return;
        }
        continue;
      }
      const text = String(raw).trim();
      if (!text && field.required) {
        toast.error(`${field.label} 값을 입력해주세요.`);
        return;
      }
      if (!text) continue;

      switch (field.type) {
        case "NUMBER": {
          const numeric = Number(text);
          if (Number.isNaN(numeric)) {
            toast.error(`${field.label}은 숫자 형식이어야 합니다.`);
            return;
          }
          preparedFields[field.key] = numeric;
          break;
        }
        case "DATE":
          preparedFields[field.key] = text;
          break;
        case "TAGS":
          preparedFields[field.key] = text
            .split(",")
            .map((token) => token.trim())
            .filter(Boolean);
          break;
        default:
          preparedFields[field.key] = text;
      }
    }

    const payload: NoteUpsertPayload = {
      categoryId: category.id,
      title: title.trim(),
      content: content.trim(),
      color: color.trim() || undefined,
      pinned,
      tags: tags
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean),
      fields: preparedFields,
      layout: note?.layout ?? defaultLayout,
    };

    await onSubmit(payload, note?.id);
    onClose();
  };

  if (!open || !category) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-black/60">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">
            {note ? "노트 수정" : "새 노트 작성"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span>제목</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="노트 제목"
                className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>색상 코드 (선택)</span>
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#1E90FF"
                className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm text-slate-300">
            <span>내용</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="노트 내용을 입력하세요."
              className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>태그 (쉼표로 구분)</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="예: 투자, 리서치"
              className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-800 text-sky-500 focus:ring-sky-400"
            />
            즐겨찾기 고정
          </label>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-white">
              {category.name} 필드 입력
            </h3>
            {fields.length === 0 ? (
              <p className="text-sm text-slate-400">
                이 카테고리는 커스텀 필드가 없습니다.
              </p>
            ) : (
              <div className="grid gap-3">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]"
                  >
                    <label className="space-y-2 text-sm text-slate-300">
                      <span>
                        {field.label}
                        {field.required ? (
                          <span className="ml-1 text-rose-300">*</span>
                        ) : null}
                      </span>
                      {field.type === "BOOLEAN" ? (
                        <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={Boolean(fieldValues[field.key])}
                            onChange={(e) => handleFieldInput(field.key, e.target.checked)}
                            className="h-4 w-4 rounded border-white/20 bg-slate-800 text-sky-500 focus:ring-sky-400"
                          />
                          예 / 아니오
                        </label>
                      ) : field.type === "NUMBER" ? (
                        <input
                          type="number"
                          value={fieldValues[field.key] as string | number | ""}
                          onChange={(e) => handleFieldInput(field.key, e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                        />
                      ) : field.type === "DATE" ? (
                        <input
                          type="date"
                          value={fieldValues[field.key] as string | ""}
                          onChange={(e) => handleFieldInput(field.key, e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                        />
                      ) : (
                        <input
                          value={fieldValues[field.key] as string | ""}
                          onChange={(e) => handleFieldInput(field.key, e.target.value)}
                          placeholder={
                            field.type === "TAGS"
                              ? "쉼표로 구분하여 입력"
                              : field.label
                          }
                          className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                        />
                      )}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              {note ? "노트 수정" : "노트 생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
