import { CalendarDays, Clock, Tag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { fetchNote } from "../../shared/api/noteApi";
import { fetchCategories } from "../../shared/api/noteCategoryApi";
import type { NoteCategoryField } from "../../shared/types/note";

const toFieldMap = (fields: NoteCategoryField[]) =>
  new Map(fields.map((field) => [field.key, field]));

export default function NoteDetail() {
  const params = useParams();
  const noteId = Number(params.id);

  const noteQuery = useQuery({
    queryKey: ["note", noteId],
    enabled: Number.isFinite(noteId),
    queryFn: () => fetchNote(noteId),
  });

  const categoriesQuery = useQuery({
    queryKey: ["noteCategories"],
    queryFn: fetchCategories,
  });

  const note = noteQuery.data;
  const category = categoriesQuery.data?.find((item) => item.id === note?.categoryId);
  const fieldMap = category ? toFieldMap(category.fields) : new Map<string, NoteCategoryField>();

  if (!Number.isFinite(noteId)) {
    return (
      <section className="flex min-h-full items-center justify-center bg-slate-950 px-6 py-10 text-slate-400">
        잘못된 노트 주소입니다.
      </section>
    );
  }

  if (noteQuery.isLoading || categoriesQuery.isLoading) {
    return (
      <section className="flex min-h-full items-center justify-center bg-slate-950 px-6 py-10 text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        노트를 불러오는 중입니다...
      </section>
    );
  }

  if (!note) {
    return (
      <section className="flex min-h-full items-center justify-center bg-slate-950 px-6 py-10 text-slate-400">
        노트를 찾을 수 없습니다.
      </section>
    );
  }

  const updatedAt = note.updatedAt ? new Date(note.updatedAt).toLocaleString() : "-";
  const createdAt = note.createdAt ? new Date(note.createdAt).toLocaleString() : "-";
  const accentColor =
    typeof note.color === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(note.color)
      ? note.color
      : undefined;

  return (
    <section className="min-h-full bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Link
          to="/notes"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 transition hover:border-sky-400/60 hover:text-sky-200"
        >
          ← 목록으로
        </Link>

        <article
          className="space-y-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur"
          style={
            accentColor
              ? {
                  borderColor: `${accentColor}44`,
                  boxShadow: `0 30px 80px -45px ${accentColor}`,
                }
              : undefined
          }
        >
          <header className="flex flex-col gap-4">
            <div>
              <h1
                className="text-3xl font-semibold text-white"
                style={accentColor ? { color: accentColor } : undefined}
              >
                {note.title}
              </h1>
              <p className="mt-1 text-sm text-slate-400">{category?.name ?? "개인 노트"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> 생성 {createdAt}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> 마지막 수정 {updatedAt}
                </span>
              </div>
            </div>
            {note.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-medium text-slate-200"
                    style={
                      accentColor
                        ? { borderColor: `${accentColor}40`, background: `${accentColor}12`, color: accentColor }
                        : undefined
                    }
                  >
                    <Tag
                      className="h-3 w-3"
                      style={accentColor ? { color: accentColor } : undefined}
                    />
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          {note.content ? (
            <section className="rounded-2xl border border-white/5 bg-slate-900/60 p-6 shadow-inner shadow-black/40">
              <h2 className="text-sm font-semibold text-slate-200">노트 내용</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {note.content}
              </p>
            </section>
          ) : null}

          <section className="rounded-2xl border border-white/5 bg-slate-900/70 p-6">
            <h2 className="text-sm font-semibold text-slate-200">카테고리 필드</h2>
            {category && Object.keys(note.fields ?? {}).length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">입력된 필드 값이 없습니다.</p>
            ) : (
              <dl className="mt-4 grid gap-3 md:grid-cols-2">
                {Object.entries(note.fields ?? {}).map(([key, value]) => {
                  const field = fieldMap.get(key);
                  if (!field) return null;
                  const formatted =
                    field.type === "BOOLEAN"
                      ? value
                        ? "예"
                        : "아니오"
                      : field.type === "TAGS" && Array.isArray(value)
                      ? value.join(", ")
                      : String(value ?? "-");
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner shadow-black/20"
                    >
                      <dt className="text-xs uppercase tracking-wide text-slate-400">
                        {field.label}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-white">{formatted || "-"}</dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </section>
        </article>
      </div>
    </section>
  );
}
