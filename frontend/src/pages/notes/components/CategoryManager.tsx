import { arrayMove } from "@dnd-kit/sortable";
import { ArrowDown, ArrowUp, Plus, Settings2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  NoteCategory,
  NoteCategoryField,
  NoteFieldType,
} from "../../../shared/types/note";
import type { CategoryPayload } from "../../../shared/api/noteCategoryApi";

export type CategoryManagerProps = {
  categories: NoteCategory[];
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CategoryPayload) => Promise<unknown>;
  onUpdate: (id: number, payload: CategoryPayload) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
};

const fieldTypeOptions: { label: string; value: NoteFieldType }[] = [
  { label: "텍스트", value: "TEXT" },
  { label: "숫자", value: "NUMBER" },
  { label: "날짜", value: "DATE" },
  { label: "참/거짓", value: "BOOLEAN" },
  { label: "태그 목록", value: "TAGS" },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

// --- UI-only field with stable uid for React keys ---
type UIField = NoteCategoryField & { uid: string };

const mkUid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function CategoryManager({
  categories,
  open,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryManagerProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<UIField[]>([]);

  // open or categories change → pick first or reset
  useEffect(() => {
    if (!open) return;
    if (!categories.length) {
      resetForm();
      return;
    }
    if (selectedId == null) {
      loadCategory(categories[0]);
    } else {
      const target = categories.find((c) => c.id === selectedId);
      if (target) loadCategory(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categories]);

  // selectedId change → load that category
  useEffect(() => {
    if (!open) return;
    if (selectedId == null) return;
    const target = categories.find((c) => c.id === selectedId);
    if (target) loadCategory(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, open]);

  const isEditing = selectedId != null;

  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.orderIndex - b.orderIndex),
    [fields]
  );

  const loadCategory = (category: NoteCategory) => {
    setSelectedId(category.id);
    setName(category.name);
    setDescription(category.description ?? "");
    setFields(
      category.fields.map((f, i) => ({
        ...f,
        orderIndex: i,
        uid: mkUid(), // stable per load to avoid re-mount on typing
      }))
    );
  };

  const resetForm = () => {
    setSelectedId(null);
    setName("");
    setDescription("");
    setFields([]);
  };

  const handleFieldChange = <K extends keyof UIField>(
    uid: string,
    key: K,
    value: UIField[K]
  ) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.uid !== uid) return f;
        const next: UIField = {
          ...f,
          [key]: key === "required" ? Boolean(value) : (value as any),
        };
        if (key === "label" && !f.key.trim()) {
          next.key = slugify(String(value));
        }
        if (key === "key") {
          next.key = slugify(String(value));
        }
        return next;
      })
    );
  };

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        uid: mkUid(),
        key: "",
        label: "",
        type: "TEXT",
        required: false,
        orderIndex: prev.length,
      },
    ]);
  };

  const removeField = (uid: string) => {
    setFields((prev) =>
      prev
        .filter((f) => f.uid !== uid)
        .map((f, i) => ({ ...f, orderIndex: i }))
    );
  };

  const moveField = (uid: string, direction: -1 | 1) => {
    setFields((prev) => {
      const ordered = [...prev].sort((a, b) => a.orderIndex - b.orderIndex);
      const idx = ordered.findIndex((f) => f.uid === uid);
      const to = idx + direction;
      if (idx < 0 || to < 0 || to >= ordered.length) return prev;
      const moved = arrayMove(ordered, idx, to).map((f, i) => ({
        ...f,
        orderIndex: i,
      }));
      return moved;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("카테고리 이름을 입력하세요.");
      return;
    }
    const payload: CategoryPayload = {
      name: name.trim(),
      description: description.trim(),
      fields: sortedFields.map((f, i) => ({
        key: f.key || slugify(f.label || `field_${i + 1}`),
        label: f.label,
        type: f.type,
        required: f.required,
        orderIndex: i,
      })),
    };
    if (isEditing && selectedId != null) {
      await onUpdate(selectedId, payload);
    } else {
      await onCreate(payload);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (selectedId == null) return;
    await onDelete(selectedId);
    resetForm();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-7xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-black/60">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Settings2 className="h-5 w-5" />
            <h2 className="text-2xl font-semibold">카테고리 관리</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <button
              onClick={resetForm}
              className={`w-full rounded-xl border border-dashed border-sky-400/60 px-3 py-2 text-sm font-medium transition hover:bg-sky-500/10 ${
                selectedId == null ? "bg-sky-500/10 text-sky-200" : "text-sky-200"
              }`}
            >
              새 카테고리 추가
            </button>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedId(category.id)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    selectedId === category.id
                      ? "bg-sky-500/10 text-sky-200"
                      : "text-slate-300 hover:bg:white/5"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-white/10 bg:white/5 p-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                <span>카테고리 이름</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 여행 계획"
                  className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                <span>설명</span>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="간단한 설명"
                  className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </label>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">필드 구성</h3>
                <button
                  type="button"
                  onClick={addField}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-500/60 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/20"
                >
                  <Plus className="h-3 w-3" />
                  필드 추가
                </button>
              </div>

              <div className="space-y-3">
                {sortedFields.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-6 text-center text-sm text-slate-400">
                    추가된 필드가 없습니다. 상단의 필드 추가 버튼을 눌러 시작하세요.
                  </p>
                ) : null}

                {sortedFields.map((field, index) => (
                  <div
                    key={field.uid}
                    className="grid gap-3 rounded-xl border border-white/10 bg-slate-900/70 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_120px_40px]"
                  >
                    <input
                      value={field.label}
                      onChange={(e) =>
                        handleFieldChange(field.uid, "label", e.target.value)
                      }
                      placeholder="필드 이름"
                      className="rounded-lg border border-white/10 bg-slate-900/90 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                    />
                    <input
                      value={field.key}
                      onChange={(e) =>
                        handleFieldChange(field.uid, "key", e.target.value)
                      }
                      placeholder="키 (영문/숫자)"
                      className="rounded-lg border border-white/10 bg-slate-900/90 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                    />
                    <select
                      value={field.type}
                      onChange={(e) =>
                        handleFieldChange(
                          field.uid,
                          "type",
                          e.target.value as NoteFieldType
                        )
                      }
                      className="rounded-lg border border-white/10 bg-slate-900/90 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                    >
                      {fieldTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          handleFieldChange(field.uid, "required", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-white/20 bg-slate-800 text-sky-500 focus:ring-sky-400"
                      />
                      필수
                    </label>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => moveField(field.uid, -1)}
                        disabled={index === 0}
                        className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(field.uid, 1)}
                        disabled={index === sortedFields.length - 1}
                        className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeField(field.uid)}
                        className="rounded-full border border-white/10 bg-white/5 p-2 text-rose-300 transition hover:bg-white/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl border border-rose-500/70 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                >
                  카테고리 삭제
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                >
                  {isEditing ? "카테고리 수정" : "카테고리 생성"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
