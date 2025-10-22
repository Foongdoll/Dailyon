import { useMemo, useState } from "react";
import {
  FilePlus2,
  Upload,
  Download,
  Wand2,
  SunMedium,
  Sigma,
  Filter,
  Rows3,
  Undo2,
  Redo2,
  Copy,
  Scissors,
  ClipboardPaste,
  Trash2,
  Plus,
  Minus,
  Settings2,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Ledger() {
  // purely-UI placeholders (no logic)
  const cols = useMemo(() => Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), []);
  const rows = useMemo(() => Array.from({ length: 40 }, (_, i) => i + 1), []);
  const [zoom, setZoom] = useState(100);

  return (
    <section className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-950 px-4 py-6 text-slate-100 md:px-6">
      <div className="w-full max-w-7xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-black/40">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/80 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-sky-500/15 px-2 py-1 text-xs font-semibold text-sky-300">
              Ledger · Sheet
            </span>
            <span className="text-sm text-slate-300/90">엑셀 스타일 시트 (UI-only)</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10">
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/60 bg-slate-900/50 px-3 py-2">
          <Group>
            <TButton icon={<FilePlus2 />} label="새 시트" />
            <TButton icon={<Upload />} label="가져오기" />
            <TButton icon={<Download />} label="내보내기" />
          </Group>

          <Divider />

          <Group>
            <TButton icon={<Undo2 />} label="되돌리기" />
            <TButton icon={<Redo2 />} label="다시하기" />
            <TButton icon={<Copy />} label="복사" />
            <TButton icon={<Scissors />} label="잘라내기" />
            <TButton icon={<ClipboardPaste />} label="붙여넣기" />
            <TButton icon={<Trash2 />} label="지우기" />
          </Group>

          <Divider />

          <Group>
            <TButton icon={<Rows3 />} label="행/열" />
            <TButton icon={<Filter />} label="필터" />
            <TButton icon={<Wand2 />} label="서식" />
            <TButton icon={<Plus />} label="합계" />
            <TButton icon={<Sigma />} label="평균" />
          </Group>

          <Divider />

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs">
              <button
                className="rounded-md border border-white/10 bg-white/5 p-1 hover:bg-white/10"
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-12 text-center tabular-nums">{zoom}%</span>
              <button
                className="rounded-md border border-white/10 bg-white/5 p-1 hover:bg-white/10"
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
              <Search className="h-4 w-4 opacity-70" />
              <input
                placeholder="시트 검색 (UI)"
                className="w-40 bg-transparent text-xs outline-none placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Formula bar */}
        <div className="flex items-stretch gap-2 border-b border-slate-800/60 bg-slate-900/50 px-3 py-2">
          <div className="flex w-24 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300">
            fx
          </div>
          <input
            placeholder="선택된 셀의 수식 또는 값이 여기에 표시됩니다 (UI 전용)"
            className="flex-1 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500"
          />
        </div>

        {/* Grid area */}
        <div className="grid grid-rows-[auto_1fr]">
          {/* Column header row */}
          <div className="grid grid-cols-[56px_repeat(26,minmax(100px,1fr))] border-b border-slate-800/60 bg-slate-900/80">
            <div className="sticky left-0 z-10 select-none border-r border-slate-800/60 bg-slate-900/80 p-2 text-center text-xs text-slate-400">
              #
            </div>
            {cols.map((c) => (
              <ColHeader key={c} label={c} />
            ))}
          </div>

          {/* Scrollable cells */}
          <div className="relative max-h-[60vh] overflow-auto">
            <div className="grid grid-cols-[56px_repeat(26,minmax(100px,1fr))]">
              {rows.map((r) => (
                <Row key={r} index={r} cols={cols} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom status bar + sheet tabs */}
        <div className="flex items-center justify-between border-t border-slate-800/60 bg-slate-900/70 px-3 py-2 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span>선택: —</span>
            <span>합계: —</span>
            <span>평균: —</span>
          </div>
          <div className="flex items-center gap-1">
            <SheetTab active>Sheet 1</SheetTab>
            <SheetTab>Sheet 2</SheetTab>
            <SheetTab>Sheet 3</SheetTab>
            <button className="ml-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10">
              + 새 시트
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- UI pieces (presentational only) ---------------- */

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">{children}</div>;
}
function Divider() {
  return <div className="mx-1 h-6 w-px bg-white/10" />;
}
function TButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
      title={label}
    >
      <span className="opacity-90">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ColHeader({ label }: { label: string }) {
  return (
    <div className="flex select-none items-center justify-between gap-2 border-r border-slate-800/60 px-2 py-2 text-center text-xs font-semibold text-slate-300">
      <span className="mx-auto">{label}</span>
      {/* resize handle (UI only) */}
      <span className="h-4 w-1 shrink-0 rounded bg-white/10" />
    </div>
  );
}

function Row({ index, cols }: { index: number; cols: string[] }) {
  return (
    <>
      <div className="sticky left-0 z-10 select-none border-b border-r border-slate-800/60 bg-slate-900/80 p-2 text-center text-xs text-slate-400">
        {index}
      </div>
      {cols.map((c) => (
        <Cell key={`${index}-${c}`} r={index} c={c} />
      ))}
    </>
  );
}

function Cell({ r, c }: { r: number; c: string }) {
  // purely decorative placeholder
  const placeholder =
    r === 1 && c === "A"
      ? "날짜"
      : r === 1 && c === "B"
      ? "분류"
      : r === 1 && c === "C"
      ? "내역"
      : r === 1 && c === "D"
      ? "금액"
      : "";

  return (
    <motion.div
      whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      className="min-h-[34px] border-b border-r border-slate-800/60 bg-slate-900/40 p-2 text-xs outline-none"
    >
      <span className={placeholder ? "text-slate-500" : ""}>{placeholder}</span>
    </motion.div>
  );
}

function SheetTab({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={
        "rounded-lg px-2.5 py-1 " +
        (active
          ? "border border-sky-500/40 bg-sky-500/15 text-sky-200"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      <span className="text-[11px]">{children}</span>
    </button>
  );
}
