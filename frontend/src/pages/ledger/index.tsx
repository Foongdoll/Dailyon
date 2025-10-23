import { useState } from "react";
import LedgerSheetList, { type SheetMeta } from "./LedgerSheetList.tsx";
import LedgerSheetView from "./LedgerSheetView";

export default function LedgerPage() {
  const [current, setCurrent] = useState<SheetMeta | null>(null);
  return current ? (
    <LedgerSheetView sheet={current} onBack={() => setCurrent(null)} />
  ) : (
    <LedgerSheetList onOpen={setCurrent} />
  );
}
