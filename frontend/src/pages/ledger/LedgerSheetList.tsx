import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  FilePlus2,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  createSheet,
  deleteSheet,
  fetchSheets,
} from "../../shared/api/ledgerApi";
import type { SheetSummary, SheetSavePayload, SheetOrientation } from "../../shared/types/ledger";
import SheetFormDialog, { type SheetFormValues } from "./components/SheetFormDialog";

const PAGE_SIZE = 10;

type LedgerSheetListProps = {
  ownerId: number;
  onOpen: (sheet: SheetSummary) => void;
};

type SheetImportFile = {
  title?: string;
  description?: string;
  orientation?: SheetOrientation;
  rowCount?: number;
  columnCount?: number;
  cells?: Array<{
    rowIndex: number;
    colIndex: number;
    value: string;
  }>;
};

export default function LedgerSheetList({ ownerId, onOpen }: LedgerSheetListProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sheetQuery = useQuery({
    queryKey: ["ledger", "list", ownerId, page, keyword],
    queryFn: () => fetchSheets({ ownerId, page, size: PAGE_SIZE, title: keyword }),
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: async (values: SheetFormValues) => {
      const payload: SheetSavePayload = {
        ownerId,
        title: values.title,
        description: values.description,
        orientation: values.orientation,
        rowCount: values.rowCount,
        columnCount: values.columnCount,
        replaceAll: true,
        cells: [],
      };
      return createSheet(payload);
    },
    onSuccess: (sheet) => {
      toast.success("시트를 생성했어요.");
      queryClient.invalidateQueries({ queryKey: ["ledger", "list", ownerId] });
      setShowCreate(false);
      onOpen(sheet);
    },
    onError: () => {
      toast.error("시트를 생성하지 못했어요. 다시 시도해 주세요.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (sheet: SheetSummary) => deleteSheet(sheet.id, ownerId),
    onSuccess: () => {
      toast.success("시트를 삭제했습니다.");
      queryClient.invalidateQueries({ queryKey: ["ledger", "list", ownerId] });
    },
    onError: () => {
      toast.error("시트를 삭제하지 못했어요.");
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: SheetImportFile) => {
      const payload: SheetSavePayload = {
        ownerId,
        title: file.title,
        description: file.description,
        orientation: file.orientation,
        rowCount: file.rowCount,
        columnCount: file.columnCount,
        replaceAll: true,
        cells:
          file.cells?.map((cell) => ({
            rowIndex: cell.rowIndex,
            colIndex: cell.colIndex,
            valueRaw: cell.value,
            valueType: null,
            formula: null,
            valueCalc: null,
            formatJson: null,
            styleJson: null,
            note: null,
          })) ?? [],
      };
      return createSheet(payload);
    },
    onSuccess: (sheet) => {
      toast.success("시트를 가져왔어요.");
      queryClient.invalidateQueries({ queryKey: ["ledger", "list", ownerId] });
      onOpen(sheet);
    },
    onError: () => {
      toast.error("가져오기 중 오류가 발생했어요.");
    },
  });

  const data = sheetQuery.data;
  const totalPages = data?.totalPages ?? 1;
  const totalRows = data?.totalElements ?? 0;
  const rows = data?.content ?? [];

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
    setPage(1);
  };

  const handleDelete = (sheet: SheetSummary) => {
    if (!window.confirm(`"${sheet.title}" 시트를 삭제할까요?`)) return;
    deleteMutation.mutate(sheet);
  };

  const handleCreateSubmit = (values: SheetFormValues) => {
    createMutation.mutate(values);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SheetImportFile;
      if (!parsed || typeof parsed !== "object") {
        throw new Error("유효하지 않은 파일 형식");
      }
      importMutation.mutate(parsed);
    } catch (error) {
      console.error(error);
      toast.error("지원하지 않는 파일 형식이에요.");
    } finally {
      event.target.value = "";
    }
  };

  const handleExportList = () => {
    if (!rows.length) {
      toast.info("내보낼 시트가 없습니다.");
      return;
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      ownerId,
      total: rows.length,
      sheets: rows,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ledger-sheets-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("시트 목록을 JSON으로 저장했어요.");
  };

  const pagination = useMemo(() => {
    return {
      canPrev: page > 1,
      canNext: page < totalPages,
    };
  }, [page, totalPages]);

  return (
    <section className="flex min-h-[calc(40vh)] items-center justify-center bg-slate-950 px-6 py-8 text-slate-100 md:px-8">
      <div className="w-full max-w-[90rem] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/80 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-sky-500/15 px-2 py-1 text-xs font-semibold text-sky-300">
              Ledger · Sheets
            </span>
            <span className="text-sm text-slate-300/90">시트 목록</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
              title="새 시트"
            >
              <FilePlus2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleImportClick}
              className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
              title="가져오기"
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              onClick={handleExportList}
              className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
              title="목록 내보내기"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/60 bg-slate-900/50 px-3 py-2">
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
            <Search className="h-4 w-4 opacity-70" />
            <input
              value={keyword}
              onChange={handleSearch}
              placeholder="시트 검색"
              className="w-48 bg-transparent text-xs outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur">
              <tr className="border-b border-slate-800/60 text-slate-300">
                <th className="px-4 py-2 text-left font-semibold">제목</th>
                <th className="px-4 py-2 text-left font-semibold">최근 수정</th>
                <th className="px-4 py-2 text-left font-semibold">행 × 열</th>
                <th className="px-4 py-2 text-left font-semibold">방향</th>
                <th className="px-4 py-2 text-right font-semibold">동작</th>
              </tr>
            </thead>
            <tbody>
              {sheetQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    시트를 불러오는 중이에요...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    조건에 맞는 시트가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((sheet) => (
                  <tr key={sheet.id} className="border-b border-slate-800/60 hover:bg-white/5">
                    <td className="px-4 py-2">
                      <div className="font-medium text-white">{sheet.title}</div>
                      {sheet.description ? (
                        <p className="text-xs text-slate-400">{sheet.description}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-slate-400">
                      {new Date(sheet.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-slate-400">
                      {sheet.rowCount} × {sheet.columnCount}
                    </td>
                    <td className="px-4 py-2 text-slate-400">
                      {sheet.orientation === "LANDSCAPE" ? "가로" : "세로"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpen(sheet)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-sky-500/15 px-2.5 py-1.5 text-xs text-sky-200 transition hover:bg-sky-500/25"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> 열기
                        </button>
                        <button
                          onClick={() => handleDelete(sheet)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-rose-200 transition hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> 삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800/60 bg-slate-900/70 px-3 py-2 text-xs">
          <div className="text-slate-400">
            총 <b className="text-slate-200">{totalRows}</b>개 · {page}/{totalPages} 페이지
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-white/10 bg-white/5 p-1 hover:bg-white/10 disabled:opacity-30"
              disabled={!pagination.canPrev}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              title="이전"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              className="rounded-md border border-white/10 bg-white/5 p-1 hover:bg-white/10 disabled:opacity-30"
              disabled={!pagination.canNext}
              onClick={() => setPage((prev) => Math.min(totalPages || 1, prev + 1))}
              title="다음"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      <SheetFormDialog
        open={showCreate}
        heading="새 시트 만들기"
        submitLabel="시트 생성"
        initialValues={{ orientation: "LANDSCAPE" }}
        isSubmitting={createMutation.isPending}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateSubmit}
      />
    </section>
  );
}
