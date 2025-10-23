import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { SheetOrientation } from "../../../shared/types/ledger";

export type SheetFormValues = {
  title: string;
  description: string;
  orientation: SheetOrientation;
  rowCount: number;
  columnCount: number;
};

type SheetFormDialogProps = {
  open: boolean;
  heading: string;
  submitLabel: string;
  initialValues?: Partial<SheetFormValues>;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: SheetFormValues) => void;
};

const ORIENTATION_DEFAULTS: Record<SheetOrientation, { rows: number; cols: number }> = {
  LANDSCAPE: { rows: 40, cols: 26 },
  PORTRAIT: { rows: 60, cols: 18 },
};

const MIN_ROWS = 10;
const MAX_ROWS = 500;
const MIN_COLS = 5;
const MAX_COLS = 200;

const sanitizeNumber = (value: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), min), max) : min;

export default function SheetFormDialog({
  open,
  heading,
  submitLabel,
  initialValues,
  isSubmitting = false,
  onClose,
  onSubmit,
}: SheetFormDialogProps) {
  const [values, setValues] = useState<SheetFormValues>(() => ({
    title: "",
    description: "",
    orientation: "LANDSCAPE",
    rowCount: ORIENTATION_DEFAULTS.LANDSCAPE.rows,
    columnCount: ORIENTATION_DEFAULTS.LANDSCAPE.cols,
  }));

  useEffect(() => {
    if (!open) return;
    setValues((prev) => {
      const orientation = initialValues?.orientation ?? prev.orientation;
      const defaults = ORIENTATION_DEFAULTS[orientation];
      return {
        title: initialValues?.title ?? prev.title ?? "",
        description: initialValues?.description ?? prev.description ?? "",
        orientation,
        rowCount: sanitizeNumber(
          initialValues?.rowCount ?? prev.rowCount ?? defaults.rows,
          MIN_ROWS,
          MAX_ROWS
        ),
        columnCount: sanitizeNumber(
          initialValues?.columnCount ?? prev.columnCount ?? defaults.cols,
          MIN_COLS,
          MAX_COLS
        ),
      };
    });
  }, [open, initialValues]);

  const orientationDefaults = useMemo(
    () => ORIENTATION_DEFAULTS[values.orientation],
    [values.orientation]
  );

  const handleOrientationChange = (orientation: SheetOrientation) => {
    setValues((prev) => ({
      ...prev,
      orientation,
      rowCount: Math.max(prev.rowCount, ORIENTATION_DEFAULTS[orientation].rows),
      columnCount: Math.max(prev.columnCount, ORIENTATION_DEFAULTS[orientation].cols),
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      ...values,
      title: values.title.trim() || "Untitled",
      description: values.description.trim(),
      rowCount: sanitizeNumber(values.rowCount, MIN_ROWS, MAX_ROWS),
      columnCount: sanitizeNumber(values.columnCount, MIN_COLS, MAX_COLS),
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-xl shadow-black/50">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{heading}</h2>
            <p className="text-xs text-slate-400">
              시트 기본 정보를 설정하고 행/열 크기를 지정하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              <span className="font-medium text-white">시트 이름</span>
              <input
                value={values.title}
                onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="예: 2025년 1분기 예산"
                maxLength={60}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-sky-500"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              <span className="font-medium text-white">설명</span>
              <textarea
                value={values.description}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="시트에 대한 간단한 설명을 입력하세요."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-sky-500"
              />
            </label>

            <fieldset className="space-y-3 text-sm text-slate-300 md:col-span-2">
              <legend className="font-medium text-white">레이아웃 방향</legend>
              <div className="flex gap-3">
                {(["LANDSCAPE", "PORTRAIT"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOrientationChange(option)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      values.orientation === option
                        ? "border-sky-400 bg-sky-500/20 text-sky-200"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {option === "LANDSCAPE" ? "가로형" : "세로형"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                기본 행/열: {orientationDefaults.rows} × {orientationDefaults.cols}
              </p>
            </fieldset>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="font-medium text-white">행 개수</span>
              <input
                type="number"
                value={values.rowCount}
                min={MIN_ROWS}
                max={MAX_ROWS}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    rowCount: sanitizeNumber(Number(event.target.value), MIN_ROWS, MAX_ROWS),
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-500"
              />
              <p className="text-xs text-slate-500">최소 {MIN_ROWS} / 최대 {MAX_ROWS}</p>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="font-medium text-white">열 개수</span>
              <input
                type="number"
                value={values.columnCount}
                min={MIN_COLS}
                max={MAX_COLS}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    columnCount: sanitizeNumber(Number(event.target.value), MIN_COLS, MAX_COLS),
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-500"
              />
              <p className="text-xs text-slate-500">최소 {MIN_COLS} / 최대 {MAX_COLS}</p>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "저장 중..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
