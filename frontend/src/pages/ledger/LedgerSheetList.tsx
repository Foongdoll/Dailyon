import { useMemo, useState } from "react";
import { Search, FilePlus2, Upload, Download, ChevronLeft, ChevronRight } from "lucide-react";

export type SheetMeta = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  rows: number;
  cols: number;
};

export default function LedgerSheetList({
  onOpen,
}: {
  onOpen: (sheet: SheetMeta) => void;
}) {
  // 데모 데이터 (실서비스: API 연동)
  const allSheets = useMemo<SheetMeta[]>(
    () =>
      Array.from({ length: 47 }, (_, i) => ({
        id: `sheet-${i + 1}`,
        name: `가계부 시트 ${i + 1}`,
        createdAt: "2025-10-01 10:12",
        updatedAt: `2025-10-${(i % 28) + 1} 12:${(i % 60)
          .toString()
          .padStart(2, "0")}`,
        rows: 40,
        cols: 26,
      })),
    []
  );

  // 검색 & 페이징
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(
    () =>
      allSheets.filter(
        (s) =>
          s.name.toLowerCase().includes(q.toLowerCase()) ||
          s.id.toLowerCase().includes(q.toLowerCase())
      ),
    [allSheets, q]
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <section className="flex min-h-[calc(40vh)] items-center justify-center bg-slate-950 px-6 py-8 text-slate-100 md:px-8">
      <div className="w-full max-w-[90rem] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-black/40">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/80 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-sky-500/15 px-2 py-1 text-xs font-semibold text-sky-300">
              Ledger · Sheets
            </span>
            <span className="text-sm text-slate-300/90">시트 목록</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10" title="새 시트">
              <FilePlus2 className="h-4 w-4" />
            </button>
            <button className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10" title="가져오기">
              <Upload className="h-4 w-4" />
            </button>
            <button className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10" title="내보내기">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/60 bg-slate-900/50 px-3 py-2">
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
            <Search className="h-4 w-4 opacity-70" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="시트 검색"
              className="w-48 bg-transparent text-xs outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur">
              <tr className="border-b border-slate-800/60 text-slate-300">
                <th className="px-4 py-2 text-left font-semibold">이름</th>
                <th className="px-4 py-2 text-left font-semibold">수정일</th>
                <th className="px-4 py-2 text-left font-semibold">생성일</th>
                <th className="px-4 py-2 text-right font-semibold">크기</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {slice.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-800/60 hover:bg-white/5"
                >
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2 text-slate-400">{s.updatedAt}</td>
                  <td className="px-4 py-2 text-slate-400">{s.createdAt}</td>
                  <td className="px-4 py-2 text-right text-slate-300">
                    {s.rows}×{s.cols}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => onOpen(s)}
                      className="rounded-lg border border-white/10 bg-sky-500/15 px-2.5 py-1.5 text-xs text-sky-200 hover:bg-sky-500/25"
                    >
                      열기
                    </button>
                  </td>
                </tr>
              ))}

              {slice.length === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center text-slate-400" colSpan={5}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pager */}
        <div className="flex items-center justify-between border-t border-slate-800/60 bg-slate-900/70 px-3 py-2 text-xs">
          <div className="text-slate-400">
            총 <b className="text-slate-200">{total}</b>개 · {safePage}/{totalPages} 페이지
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-white/10 bg-white/5 p-1 hover:bg-white/10 disabled:opacity-30"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              title="이전"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              className="rounded-md border border-white/10 bg-white/5 p-1 hover:bg-white/10 disabled:opacity-30"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              title="다음"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
