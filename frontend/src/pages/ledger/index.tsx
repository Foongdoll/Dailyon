import { useState } from "react";
import LedgerSheetList from "./LedgerSheetList.tsx";
import LedgerSheetView from "./LedgerSheetView.tsx";
import type { SheetSummary } from "../../shared/types/ledger";

const FALLBACK_OWNER_ID = 1; // TODO: 인증된 사용자 ID로 교체

export default function LedgerPage() {
  const ownerId = FALLBACK_OWNER_ID;
  const [current, setCurrent] = useState<SheetSummary | null>(null);

  return current ? (
    <LedgerSheetView
      ownerId={ownerId}
      sheetId={current.id}
      initialSheet={current}
      onBack={() => setCurrent(null)}
      onOpen={setCurrent}
    />
  ) : (
    <LedgerSheetList ownerId={ownerId} onOpen={setCurrent} />
  );
}
