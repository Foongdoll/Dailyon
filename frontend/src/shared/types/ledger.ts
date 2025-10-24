export type SheetOrientation = "LANDSCAPE" | "PORTRAIT";

export type SheetSummary = {
  id: number;
  ownerId: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  orientation: SheetOrientation;
  rowCount: number;
  columnCount: number;
};

export type SheetCell = {
  rowIndex: number;
  colIndex: number;
  valueRaw: string | null;
  valueType: string | null;
  formula: string | null;
  valueCalc: string | null;
  formatJson: string | null;
  styleJson: string | null;
  note: string | null;
};

export type SheetContent = {
  sheet: SheetSummary;
  cells: SheetCell[];
};

export type SheetPage = {
  content: SheetSummary[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type SheetSavePayload = {
  ownerId: number;
  title?: string;
  description?: string | null;
  orientation?: SheetOrientation;
  rowCount?: number;
  columnCount?: number;
  replaceAll?: boolean;
  cells?: SheetCell[];
};
