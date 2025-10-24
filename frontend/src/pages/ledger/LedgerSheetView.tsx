import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  FilePlus2,
  Upload,
  Download,
  Wand2,
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
  Settings2,
  Search,
  ArrowLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  createSheet,
  fetchSheetContent,
  updateSheet,
} from "../../shared/api/ledgerApi";
import type {
  SheetCell,
  SheetOrientation,
  SheetSummary,
} from "../../shared/types/ledger";
import SheetFormDialog, {
  type SheetFormValues,
} from "./components/SheetFormDialog";

const HISTORY_LIMIT = 50;
const MIN_ROWS = 10;
const MAX_ROWS = 500;
const MIN_COLS = 5;
const MAX_COLS = 200;

const DEFAULTS_BY_ORIENTATION: Record<SheetOrientation, { rows: number; cols: number; columnWidth: number }> = {
  LANDSCAPE: { rows: 40, cols: 26, columnWidth: 150 },
  PORTRAIT: { rows: 60, cols: 18, columnWidth: 120 },
};

type CellValue = {
  value: string;
};

type WorkingSheet = {
  meta: SheetSummary;
  cells: Record<string, CellValue>;
};

type SelectionPoint = {
  row: number;
  col: number;
};

type SelectionRange = {
  start: SelectionPoint;
  end: SelectionPoint;
};

type SheetFilterState = {
  column: number;
  query: string;
};

type SheetImportPayload = {
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

const cellKey = (row: number, col: number) => `${row}:${col}`;

const parseCellKey = (key: string): SelectionPoint => {
  const [rowStr, colStr] = key.split(":");
  return {
    row: Number.parseInt(rowStr, 10),
    col: Number.parseInt(colStr, 10),
  };
};

const columnLabel = (index: number) => {
  let value = index;
  let label = "";
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode((value % 26) + 65) + label;
    value = Math.floor(value / 26);
  }
  return label || "A";
};

const cloneWorking = (state: WorkingSheet): WorkingSheet => ({
  meta: { ...state.meta },
  cells: Object.fromEntries(
    Object.entries(state.cells).map(([key, cell]) => [key, { ...cell }])
  ),
});

const buildCellsPayload = (cells: Record<string, CellValue>): SheetCell[] =>
  Object.entries(cells)
    .filter(([, cell]) => cell.value !== "")
    .map(([key, cell]) => {
      const { row, col } = parseCellKey(key);
      const trimmed = cell.value.trim();
      const isNumeric = trimmed !== "" && !Number.isNaN(Number(trimmed));
      return {
        rowIndex: row,
        colIndex: col,
        valueRaw: cell.value,
        valueType: isNumeric ? "number" : "text",
        formula: null,
        valueCalc: null,
        formatJson: null,
        styleJson: null,
        note: null,
      };
    });

const normalizeRange = (range: SelectionRange): SelectionRange => ({
  start: {
    row: Math.min(range.start.row, range.end.row),
    col: Math.min(range.start.col, range.end.col),
  },
  end: {
    row: Math.max(range.start.row, range.end.row),
    col: Math.max(range.start.col, range.end.col),
  },
});

const sanitizeRowCount = (count: number, orientation: SheetOrientation) => {
  const defaults = DEFAULTS_BY_ORIENTATION[orientation];
  const fallback = defaults.rows;
  const value = Number.isFinite(count) ? Math.trunc(count) : fallback;
  return Math.min(Math.max(value, MIN_ROWS), MAX_ROWS);
};

const sanitizeColumnCount = (count: number, orientation: SheetOrientation) => {
  const defaults = DEFAULTS_BY_ORIENTATION[orientation];
  const fallback = defaults.cols;
  const value = Number.isFinite(count) ? Math.trunc(count) : fallback;
  return Math.min(Math.max(value, MIN_COLS), MAX_COLS);
};

const toWorkingState = (sheet: SheetSummary, cells: SheetCell[]): WorkingSheet => ({
  meta: sheet,
  cells: cells.reduce<Record<string, CellValue>>((acc, cell) => {
    if (cell.valueRaw && cell.valueRaw !== "") {
      acc[cellKey(cell.rowIndex, cell.colIndex)] = {
        value: cell.valueRaw,
      };
    }
    return acc;
  }, {}),
});

const ensureSelectionWithinBounds = (
  selection: SelectionRange | null,
  rowCount: number,
  columnCount: number
): SelectionRange | null => {
  if (!selection) return null;
  const startRow = Math.min(Math.max(selection.start.row, 1), rowCount);
  const startCol = Math.min(Math.max(selection.start.col, 1), columnCount);
  const endRow = Math.min(Math.max(selection.end.row, 1), rowCount);
  const endCol = Math.min(Math.max(selection.end.col, 1), columnCount);
  return normalizeRange({
    start: { row: startRow, col: startCol },
    end: { row: endRow, col: endCol },
  });
};

type LedgerSheetViewProps = {
  ownerId: number;
  sheetId: number;
  initialSheet?: SheetSummary | null;
  onBack: () => void;
  onOpen?: (sheet: SheetSummary) => void;
};
export default function LedgerSheetView({
  ownerId,
  sheetId,
  initialSheet,
  onBack,
  onOpen,
}: LedgerSheetViewProps) {
  const queryClient = useQueryClient();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [working, setWorking] = useState<WorkingSheet | null>(null);
  const [history, setHistory] = useState<WorkingSheet[]>([]);
  const [future, setFuture] = useState<WorkingSheet[]>([]);
  const [activeCell, setActiveCell] = useState<SelectionPoint | null>(null);
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [editingCell, setEditingCell] = useState<SelectionPoint | null>(null);
  const [editingDraft, setEditingDraft] = useState<string>("");
  const [filter, setFilter] = useState<SheetFilterState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const sheetQuery = useQuery({
    queryKey: ["ledger", "sheet", ownerId, sheetId],
    queryFn: () => fetchSheetContent(sheetId, ownerId),
    initialData: initialSheet
      ? {
          sheet: initialSheet,
          cells: [],
        }
      : undefined,
  });

  useEffect(() => {
    if (!sheetQuery.data) return;
    const nextState = toWorkingState(sheetQuery.data.sheet, sheetQuery.data.cells);
    setWorking(nextState);
    setHistory([]);
    setFuture([]);
    const defaultCell: SelectionPoint = { row: 1, col: 1 };
    setActiveCell(defaultCell);
    setSelection({ start: defaultCell, end: defaultCell });
    setFilter(null);
    setEditingCell(null);
    setEditingDraft("");
  }, [sheetQuery.data]);

  useEffect(() => {
    gridRef.current?.focus();
  }, [sheetId]);

  const commit = useCallback((mutator: (draft: WorkingSheet) => void) => {
    setWorking((current) => {
      if (!current) return current;
      const previous = cloneWorking(current);
      const draft = cloneWorking(current);
      mutator(draft);
      setHistory((prev) => [...prev.slice(Math.max(0, prev.length - (HISTORY_LIMIT - 1))), previous]);
      setFuture([]);
      return draft;
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((prevHistory) => {
      if (!working || prevHistory.length === 0) return prevHistory;
      const previousSnapshot = prevHistory[prevHistory.length - 1];
      setFuture((prevFuture) => [...prevFuture, cloneWorking(working)]);
      setWorking(cloneWorking(previousSnapshot));
      setSelection((sel) =>
        ensureSelectionWithinBounds(sel, previousSnapshot.meta.rowCount, previousSnapshot.meta.columnCount)
      );
      setActiveCell((cell) =>
        cell
          ? {
              row: Math.min(Math.max(cell.row, 1), previousSnapshot.meta.rowCount),
              col: Math.min(Math.max(cell.col, 1), previousSnapshot.meta.columnCount),
            }
          : cell
      );
      return prevHistory.slice(0, -1);
    });
  }, [working]);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (!working || prevFuture.length === 0) return prevFuture;
      const nextSnapshot = prevFuture[prevFuture.length - 1];
      setHistory((prevHistory) => [...prevHistory, cloneWorking(working)]);
      setWorking(cloneWorking(nextSnapshot));
      setSelection((sel) =>
        ensureSelectionWithinBounds(sel, nextSnapshot.meta.rowCount, nextSnapshot.meta.columnCount)
      );
      setActiveCell((cell) =>
        cell
          ? {
              row: Math.min(Math.max(cell.row, 1), nextSnapshot.meta.rowCount),
              col: Math.min(Math.max(cell.col, 1), nextSnapshot.meta.columnCount),
            }
          : cell
      );
      return prevFuture.slice(0, -1);
    });
  }, [working]);

  const workingMeta = working?.meta;
  const rowCount = workingMeta?.rowCount ?? 0;
  const columnCount = workingMeta?.columnCount ?? 0;
  const orientation = workingMeta?.orientation ?? "LANDSCAPE";
  const columnWidth = DEFAULTS_BY_ORIENTATION[orientation].columnWidth;

  const rowIndices = useMemo(
    () => Array.from({ length: rowCount }, (_, index) => index + 1),
    [rowCount]
  );
  const columnIndices = useMemo(
    () => Array.from({ length: columnCount }, (_, index) => index + 1),
    [columnCount]
  );

  const visibleRowIndices = useMemo(() => {
    if (!filter) return rowIndices;
    const { column, query } = filter;
    const search = query.trim().toLowerCase();
    if (!search) return rowIndices;
    return rowIndices.filter((row) => {
      const value = working?.cells[cellKey(row, column)]?.value ?? "";
      return value.toLowerCase().includes(search);
    });
  }, [filter, rowIndices, working]);

  const selectedRange = useMemo(() => {
    if (!selection) {
      if (activeCell) {
        return { start: activeCell, end: activeCell };
      }
      return null;
    }
    return normalizeRange(selection);
  }, [selection, activeCell]);

  const selectedCells = useMemo(() => {
    if (!selectedRange) return [];
    const cells: SelectionPoint[] = [];
    for (let row = selectedRange.start.row; row <= selectedRange.end.row; row += 1) {
      for (let col = selectedRange.start.col; col <= selectedRange.end.col; col += 1) {
        cells.push({ row, col });
      }
    }
    return cells;
  }, [selectedRange]);

  const selectedValues = useMemo(
    () => selectedCells.map(({ row, col }) => working?.cells[cellKey(row, col)]?.value ?? ""),
    [selectedCells, working]
  );

  const sumOfSelection = useMemo(() => {
    const numbers = selectedValues
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    if (numbers.length === 0) return 0;
    return numbers.reduce((acc, number) => acc + number, 0);
  }, [selectedValues]);

  const isCellSelected = useCallback(
    (row: number, col: number) => {
      if (!selectedRange) return false;
      return (
        row >= selectedRange.start.row &&
        row <= selectedRange.end.row &&
        col >= selectedRange.start.col &&
        col <= selectedRange.end.col
      );
    },
    [selectedRange]
  );
  const beginEdit = (point: SelectionPoint, initial?: string) => {
    const value =
      initial ?? working?.cells[cellKey(point.row, point.col)]?.value ?? "";
    setEditingCell(point);
    setEditingDraft(value);
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const draftValue = editingDraft;
    commit((draft) => {
      const key = cellKey(editingCell.row, editingCell.col);
      if (draftValue === "") {
        delete draft.cells[key];
      } else {
        draft.cells[key] = { value: draftValue };
      }
    });
    setEditingCell(null);
    setEditingDraft("");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditingDraft("");
  };

  const handleCellPointerDown = (point: SelectionPoint, extend: boolean) => {
    setActiveCell(point);
    if (extend && selection) {
      setSelection(normalizeRange({ start: selection.start, end: point }));
    } else {
      setSelection({ start: point, end: point });
    }
    setEditingCell(null);
    setEditingDraft("");
  };

  const moveActiveCell = (deltaRow: number, deltaCol: number) => {
    if (!working || rowCount === 0 || columnCount === 0) return;
    setActiveCell((cell) => {
      const current = cell ?? { row: 1, col: 1 };
      const next: SelectionPoint = {
        row: Math.min(Math.max(current.row + deltaRow, 1), rowCount),
        col: Math.min(Math.max(current.col + deltaCol, 1), columnCount),
      };
      setSelection({ start: next, end: next });
      return next;
    });
  };

  const clearSelectionCells = () => {
    if (!selectedCells.length) return;
    commit((draft) => {
      selectedCells.forEach(({ row, col }) => {
        delete draft.cells[cellKey(row, col)];
      });
    });
  };

  const insertRow = (after: number) => {
    if (!working) return;
    const targetRow = Math.min(Math.max(after, 0), rowCount);
    commit((draft) => {
      const newCells: Record<string, CellValue> = {};
      Object.entries(draft.cells).forEach(([key, cell]) => {
        const { row, col } = parseCellKey(key);
        if (row > targetRow) {
          const nextRow = row + 1;
          newCells[cellKey(nextRow, col)] = { value: cell.value };
        } else {
          newCells[key] = cell;
        }
      });
      draft.cells = newCells;
      draft.meta = {
        ...draft.meta,
        rowCount: Math.min(draft.meta.rowCount + 1, MAX_ROWS),
      };
    });
  };

  const insertColumn = (after: number) => {
    if (!working) return;
    const targetCol = Math.min(Math.max(after, 0), columnCount);
    commit((draft) => {
      const newCells: Record<string, CellValue> = {};
      Object.entries(draft.cells).forEach(([key, cell]) => {
        const { row, col } = parseCellKey(key);
        if (col > targetCol) {
          const nextCol = col + 1;
          newCells[cellKey(row, nextCol)] = { value: cell.value };
        } else {
          newCells[key] = cell;
        }
      });
      draft.cells = newCells;
      draft.meta = {
        ...draft.meta,
        columnCount: Math.min(draft.meta.columnCount + 1, MAX_COLS),
      };
    });
  };

  const copyToClipboard = async () => {
    if (!selectedRange) {
      if (!activeCell) return;
      const value = working?.cells[cellKey(activeCell.row, activeCell.col)]?.value ?? "";
      await navigator.clipboard.writeText(value);
      toast.success("선택 영역을 복사했어요.");
      return;
    }
    let buffer = "";
    for (let row = selectedRange.start.row; row <= selectedRange.end.row; row += 1) {
      const rowValues: string[] = [];
      for (let col = selectedRange.start.col; col <= selectedRange.end.col; col += 1) {
        rowValues.push(working?.cells[cellKey(row, col)]?.value ?? "");
      }
      buffer += rowValues.join("\t");
      if (row < selectedRange.end.row) buffer += "\n";
    }
    await navigator.clipboard.writeText(buffer);
    toast.success("선택 영역을 복사했어요.");
  };

  const cutSelection = async () => {
    await copyToClipboard();
    clearSelectionCells();
  };

  const pasteFromClipboard = async () => {
    if (!activeCell) return;
    const text = await navigator.clipboard.readText();
    if (!text) return;
    const lines = text.replace(/\r/g, "").split("\n");
    commit((draft) => {
      lines.forEach((line, rowOffset) => {
        const columns = line.split("\t");
        columns.forEach((value, colOffset) => {
          const row = activeCell.row + rowOffset;
          const col = activeCell.col + colOffset;
          if (row <= draft.meta.rowCount && col <= draft.meta.columnCount) {
            const key = cellKey(row, col);
            if (value === "") {
              delete draft.cells[key];
            } else {
              draft.cells[key] = { value };
            }
          }
        });
      });
    });
  };

  const applyFilter = () => {
    if (!activeCell) {
      toast.info("필터를 적용할 열을 먼저 선택하세요.");
      return;
    }
    const query = window.prompt("검색할 값을 입력하세요.", filter?.query ?? "");
    if (query === null) return;
    setFilter({ column: activeCell.col, query });
  };

  const clearFilter = () => setFilter(null);

  const showSum = () => {
    toast.info(`선택 영역 합계: ${sumOfSelection}`);
  };
  const handleSave = useMutation({
    mutationFn: async () => {
      if (!working) return null;
      const payload = {
        ownerId,
        title: working.meta.title,
        description: working.meta.description,
        orientation: working.meta.orientation,
        rowCount: working.meta.rowCount,
        columnCount: working.meta.columnCount,
        replaceAll: true,
        cells: buildCellsPayload(working.cells),
      };
      return updateSheet(working.meta.id, payload);
    },
    onSuccess: async (sheet) => {
      if (!sheet) return;
      toast.success("시트를 저장했어요.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ledger", "sheet", ownerId, sheetId] }),
        queryClient.invalidateQueries({ queryKey: ["ledger", "list", ownerId] }),
      ]);
    },
    onError: () => {
      toast.error("시트를 저장하지 못했어요.");
    },
  });

  const handleSettingsSubmit = (values: SheetFormValues) => {
    if (!working) return;
    commit((draft) => {
      const orientation = values.orientation ?? draft.meta.orientation;
      const rowCountSanitized = sanitizeRowCount(values.rowCount, orientation);
      const columnCountSanitized = sanitizeColumnCount(values.columnCount, orientation);
      const nextMeta: SheetSummary = {
        ...draft.meta,
        title: values.title,
        description: values.description,
        orientation,
        rowCount: rowCountSanitized,
        columnCount: columnCountSanitized,
      };
      const nextCells: Record<string, CellValue> = {};
      Object.entries(draft.cells).forEach(([key, cell]) => {
        const { row, col } = parseCellKey(key);
        if (row <= rowCountSanitized && col <= columnCountSanitized) {
          nextCells[key] = cell;
        }
      });
      draft.meta = nextMeta;
      draft.cells = nextCells;
    });
    setShowSettings(false);
  };

  const createSheetMutation = useMutation({
    mutationFn: async (values: SheetFormValues) =>
      createSheet({
        ownerId,
        title: values.title,
        description: values.description,
        orientation: values.orientation,
        rowCount: values.rowCount,
        columnCount: values.columnCount,
        replaceAll: true,
        cells: [],
      }),
    onSuccess: (sheet) => {
      toast.success("새 시트를 만들었어요.");
      setShowCreateSheet(false);
      queryClient.invalidateQueries({ queryKey: ["ledger", "list", ownerId] });
      if (onOpen) {
        onOpen(sheet);
      }
    },
    onError: () => {
      toast.error("새 시트를 생성하지 못했어요.");
    },
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SheetImportPayload;
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid file");
      commit((draft) => {
        const nextOrientation = parsed.orientation ?? draft.meta.orientation;
        const nextRowCount = sanitizeRowCount(parsed.rowCount ?? draft.meta.rowCount, nextOrientation);
        const nextColumnCount = sanitizeColumnCount(
          parsed.columnCount ?? draft.meta.columnCount,
          nextOrientation
        );
        draft.meta = {
          ...draft.meta,
          title: parsed.title ?? draft.meta.title,
          description: parsed.description ?? draft.meta.description,
          orientation: nextOrientation,
          rowCount: nextRowCount,
          columnCount: nextColumnCount,
        };
        draft.cells = {};
        parsed.cells?.forEach((cell) => {
          if (cell.rowIndex <= nextRowCount && cell.colIndex <= nextColumnCount) {
            draft.cells[cellKey(cell.rowIndex, cell.colIndex)] = {
              value: cell.value,
            };
          }
        });
      });
      toast.success("시트를 가져왔어요.");
    } catch (error) {
      console.error(error);
      toast.error("가져오기 중 오류가 발생했어요.");
    } finally {
      event.target.value = "";
    }
  };

  const handleExportSheet = () => {
    if (!working) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      sheet: working.meta,
      cells: buildCellsPayload(working.cells).map((cell) => ({
        rowIndex: cell.rowIndex,
        colIndex: cell.colIndex,
        value: cell.valueRaw ?? "",
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${working.meta.title || "ledger-sheet"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("시트를 JSON으로 저장했어요.");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!working) return;

    if (editingCell) {
      if (event.key === "Enter") {
        event.preventDefault();
        commitEdit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancelEdit();
      }
      return;
    }

    const metaKey = event.metaKey || event.ctrlKey;

    if (metaKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }

    if (metaKey && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
      return;
    }

    if (metaKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      copyToClipboard();
      return;
    }

    if (metaKey && event.key.toLowerCase() === "x") {
      event.preventDefault();
      cutSelection();
      return;
    }

    if (metaKey && event.key.toLowerCase() === "v") {
      event.preventDefault();
      pasteFromClipboard();
      return;
    }

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        moveActiveCell(-1, 0);
        break;
      case "ArrowDown":
        event.preventDefault();
        moveActiveCell(1, 0);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveActiveCell(0, -1);
        break;
      case "ArrowRight":
        event.preventDefault();
        moveActiveCell(0, 1);
        break;
      case "Delete":
      case "Backspace":
        event.preventDefault();
        clearSelectionCells();
        break;
      case "Enter":
        event.preventDefault();
        if (activeCell) beginEdit(activeCell);
        break;
      default: {
        if (event.key.length === 1 && !metaKey) {
          if (activeCell) beginEdit(activeCell, event.key);
        }
      }
    }
  };
  if (sheetQuery.isLoading && !working) {
    return (
      <section className="flex min-h-[calc(40vh)] items-center justify-center bg-slate-950 px-6 py-8 text-slate-100 md:px-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-10 text-sm text-slate-400">
          시트 데이터를 불러오는 중이에요...
        </div>
      </section>
    );
  }

  if (!working || !workingMeta) {
    return (
      <section className="flex min-h-[calc(40vh)] items-center justify-center bg-slate-950 px-6 py-8 text-slate-100 md:px-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-10 text-sm text-rose-300">
          시트를 불러오지 못했어요.
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[calc(40vh)] items-center justify-center bg-slate-950 px-6 py-8 text-slate-100 md:px-8">
      <div className="w-full max-w-[90rem] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/80 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
              title="목록으로"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="rounded-lg bg-sky-500/15 px-2 py-1 text-xs font-semibold text-sky-300">
              Ledger · Sheet
            </span>
            <div>
              <div className="text-sm font-semibold text-white">{workingMeta.title}</div>
              {workingMeta.description ? (
                <p className="text-xs text-slate-400">{workingMeta.description}</p>
              ) : null}
            </div>
            <span className="text-xs text-slate-500">
              {workingMeta.rowCount}행 × {workingMeta.columnCount}열 · {" "}
              {workingMeta.orientation === "LANDSCAPE" ? "가로형" : "세로형"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
              title="시트 설정"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleSave.mutate()}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
              disabled={handleSave.isPending}
            >
              <Check className="h-4 w-4" /> 저장
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/60 bg-slate-900/50 px-3 py-2">
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            <ToolbarButton icon={<FilePlus2 className="h-4 w-4" />} label="새 시트" onClick={() => setShowCreateSheet(true)} />
            <ToolbarButton icon={<Upload className="h-4 w-4" />} label="가져오기" onClick={handleImportClick} />
            <ToolbarButton icon={<Download className="h-4 w-4" />} label="내보내기" onClick={handleExportSheet} />
          </div>

          <ToolbarDivider />

          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            <ToolbarButton
              icon={<Undo2 className="h-4 w-4" />}
              label="되돌리기"
              disabled={history.length === 0}
              onClick={undo}
            />
            <ToolbarButton
              icon={<Redo2 className="h-4 w-4" />}
              label="다시 실행"
              disabled={future.length === 0}
              onClick={redo}
            />
            <ToolbarButton icon={<Copy className="h-4 w-4" />} label="복사" onClick={copyToClipboard} />
            <ToolbarButton icon={<Scissors className="h-4 w-4" />} label="잘라내기" onClick={cutSelection} />
            <ToolbarButton icon={<ClipboardPaste className="h-4 w-4" />} label="붙여넣기" onClick={pasteFromClipboard} />
            <ToolbarButton icon={<Trash2 className="h-4 w-4" />} label="지우기" onClick={clearSelectionCells} />
          </div>

          <ToolbarDivider />

          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            <ToolbarButton icon={<Rows3 className="h-4 w-4" />} label="행 추가" onClick={() => insertRow(selectedRange?.end.row ?? rowCount)} />
            <ToolbarButton icon={<Plus className="h-4 w-4" />} label="열 추가" onClick={() => insertColumn(selectedRange?.end.col ?? columnCount)} />
            <ToolbarButton icon={<Filter className="h-4 w-4" />} label="필터" onClick={applyFilter} />
            <ToolbarButton icon={<Wand2 className="h-4 w-4" />} label="필터 해제" disabled={!filter} onClick={clearFilter} />
            <ToolbarButton icon={<Sigma className="h-4 w-4" />} label="합계" onClick={showSum} />
          </div>

          <div className="ml-auto flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-300">
            <Search className="h-4 w-4 opacity-70" />
            <span>
              {activeCell ? `${columnLabel(activeCell.col)}${activeCell.row}` : "셀 선택"}
            </span>
          </div>
        </div>

        <div className="flex items-stretch gap-2 border-b border-slate-800/60 bg-slate-900/50 px-3 py-2">
          <div className="flex w-24 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300">
            fx
          </div>
          <input
            value={
              activeCell
                ? working.cells[cellKey(activeCell.row, activeCell.col)]?.value ?? ""
                : ""
            }
            onChange={(event) => {
              if (!activeCell) return;
              const value = event.target.value;
              commit((draft) => {
                const key = cellKey(activeCell.row, activeCell.col);
                if (value === "") {
                  delete draft.cells[key];
                } else {
                  draft.cells[key] = { value };
                }
              });
            }}
            className="flex-1 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500"
            placeholder="셀 값을 입력하세요"
          />
        </div>

        <div
          ref={gridRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="relative max-h-[60vh] overflow-auto outline-none custom-scrollbar"
        >
          <div className="min-w-max">
            <div
              className="sticky top-0 z-20 grid border-b border-slate-800/60 bg-slate-900/95"
              style={{ gridTemplateColumns: `56px repeat(${columnCount}, ${columnWidth}px)` }}
            >
              <div className="sticky left-0 z-20 select-none border-r border-slate-800/60 bg-slate-900/95 p-2 text-center text-xs text-slate-400">
                #
              </div>
              {columnIndices.map((col) => (
                <div
                  key={col}
                  className="flex select-none items-center justify-between border-r border-slate-800/60 px-2 py-2 text-xs font-semibold text-slate-300"
                >
                  <span className="mx-auto">{columnLabel(col)}</span>
                  <span className="h-4 w-1 rounded bg-white/10" />
                </div>
              ))}
            </div>

            <div
              className="grid"
              style={{ gridTemplateColumns: `56px repeat(${columnCount}, ${columnWidth}px)` }}
            >
              {visibleRowIndices.map((row) => (
                <div key={`row-${row}`} className="contents">
                  <div
                    className="sticky left-0 z-10 select-none border-b border-r border-slate-800/60 bg-slate-900/80 p-2 text-center text-xs text-slate-400"
                  >
                    {row}
                  </div>
                  {columnIndices.map((col) => {
                    const key = cellKey(row, col);
                    const value = working.cells[key]?.value ?? "";
                    const isActive = activeCell?.row === row && activeCell?.col === col;
                    const isSelected = isCellSelected(row, col);
                    const isEditing = editingCell?.row === row && editingCell?.col === col;
                    return (
                      <div
                        key={key}
                        className={`min-h-[34px] border-b border-r border-slate-800/60 px-2 py-2 text-xs transition ${
                          isSelected
                            ? "bg-sky-500/20 ring-1 ring-inset ring-sky-500"
                            : "bg-slate-900/40 hover:bg-white/5"
                        } ${isActive ? "outline outline-1 outline-sky-400" : ""}`}
                        onMouseDown={(event) => handleCellPointerDown({ row, col }, event.shiftKey)}
                        onDoubleClick={() => beginEdit({ row, col })}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editingDraft}
                            onChange={(event) => setEditingDraft(event.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                commitEdit();
                              } else if (event.key === "Escape") {
                                event.preventDefault();
                                cancelEdit();
                              }
                            }}
                            className="w-full rounded border border-sky-400 bg-slate-900/90 px-1 py-0.5 text-xs text-white outline-none"
                          />
                        ) : (
                          <span className={value ? "text-white" : "text-slate-500"}>{value}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800/60 bg-slate-900/70 px-3 py-2 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span>선택: {selectedCells.length}개</span>
            <span>합계: {sumOfSelection}</span>
            {filter ? (
              <span className="rounded-full bg-sky-500/15 px-2 py-1 text-sky-200">
                필터 {columnLabel(filter.column)}: "{filter.query}"
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300">
              마지막 저장: {new Date(workingMeta.updatedAt).toLocaleString()}
            </span>
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
        open={showSettings}
        heading="시트 설정"
        submitLabel="적용"
        initialValues={{
          title: workingMeta.title,
          description: workingMeta.description ?? "",
          orientation: workingMeta.orientation,
          rowCount: workingMeta.rowCount,
          columnCount: workingMeta.columnCount,
        }}
        isSubmitting={false}
        onClose={() => setShowSettings(false)}
        onSubmit={handleSettingsSubmit}
      />

      <SheetFormDialog
        open={showCreateSheet}
        heading="새 시트 만들기"
        submitLabel="시트 생성"
        initialValues={{ orientation: "LANDSCAPE" }}
        isSubmitting={createSheetMutation.isPending}
        onClose={() => setShowCreateSheet(false)}
        onSubmit={(values) => createSheetMutation.mutate(values)}
      />
    </section>
  );
}

type ToolbarButtonProps = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

function ToolbarButton({ icon, label, onClick, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px bg-white/10" />;
}
