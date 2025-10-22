import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Pin, Trash2 } from "lucide-react";
import type { Note, NoteCategoryField } from "../../../shared/types/note";

export type SortableNoteCardProps = {
  note: Note;
  fields: NoteCategoryField[];
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
};

const formatFieldValue = (field: NoteCategoryField, raw: unknown) => {
  if (raw === undefined || raw === null) return "-";
  if (field.type === "BOOLEAN") {
    return raw ? "예" : "아니오";
  }
  if (field.type === "TAGS" && Array.isArray(raw)) {
    return raw.join(", ");
  }
  return String(raw);
};

export function SortableNoteCard({ note, fields, onEdit, onDelete }: SortableNoteCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const baseStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const accentColor =
    typeof note.color === "string" && /^#([0-9a-f]{3,8})$/i.test(note.color)
      ? note.color
      : undefined;

  const style: React.CSSProperties = {
    ...baseStyle,
    borderColor: accentColor ? `${accentColor}33` : undefined,
    background: accentColor
      ? `linear-gradient(135deg, ${accentColor}24, rgba(15,23,42,0.92))`
      : undefined,
    boxShadow: accentColor ? `0 20px 48px -30px ${accentColor}` : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30 transition hover:border-sky-400/60 hover:bg-slate-900/90 ${
        isDragging ? "z-10 ring-2 ring-sky-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            {accentColor ? (
              <span
                className="inline-flex h-2.5 w-2.5 rounded-full"
                style={{ background: accentColor }}
                aria-hidden
              />
            ) : null}
            {note.title}
            {note.pinned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-200">
                <Pin className="h-3 w-3" />
                고정
              </span>
            ) : null}
          </h2>
          <p className="text-xs text-slate-400">
            {note.categoryName} ·{" "}
            {note.updatedAt ? new Date(note.updatedAt).toLocaleString() : "작성 중"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            ref={setActivatorNodeRef}
            {...listeners}
            {...attributes}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
            title="드래그하여 위치 변경"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(note)}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-sky-300"
            title="편집"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(note)}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-rose-400"
            title="삭제"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {note.content ? (
        <p className="whitespace-pre-wrap mt-3 line-clamp-3 text-sm leading-relaxed text-slate-300">{note.content}</p>
      ) : null}

      <ul className="mt-4 space-y-2 text-xs text-slate-200">
        {fields
          .slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((field) => {
            const raw = note.fields?.[field.key];
            if (raw === undefined) return null;
            return (
              <li
                key={field.key}
                style={
                  accentColor
                    ? { borderColor: `${accentColor}30`, background: `${accentColor}12` }
                    : undefined
                }
                className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/5 px-3 py-2 transition"
              >
                <span className="text-slate-400">{field.label}</span>
                <span className="font-medium text-white">{formatFieldValue(field, raw)}</span>
              </li>
            );
          })}
      </ul>

      {note.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              style={
                accentColor
                  ? { borderColor: `${accentColor}3d`, background: `${accentColor}10`, color: accentColor }
                  : undefined
              }
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-medium text-slate-200 transition"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
