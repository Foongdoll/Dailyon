import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LedgerSheetList from "./LedgerSheetList.tsx";
import LedgerSheetView from "./LedgerSheetView.tsx";
import type { SheetSummary } from "../../shared/types/ledger";
import { fetchCurrentUser } from "../../shared/api/userApi";

export default function LedgerPage() {
  const [current, setCurrent] = useState<SheetSummary | null>(null);
  const profileQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: fetchCurrentUser,
    retry: false,
  });

  if (profileQuery.isPending) {
    return (
      <section className="flex min-h-[calc(40vh)] items-center justify-center bg-slate-950 px-6 py-8 text-slate-100 md:px-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-10 text-sm text-slate-400">
          사용자 정보를 불러오는 중입니다...
        </div>
      </section>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <section className="flex min-h-[calc(40vh)] items-center justify-center bg-slate-950 px-6 py-8 text-slate-100 md:px-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-10 text-center text-sm text-rose-300">
          <p>사용자 정보를 불러오지 못했습니다. 다시 로그인하거나 새로고침해 주세요.</p>
          <button
            type="button"
            onClick={() => profileQuery.refetch()}
            className="mt-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
          >
            다시 시도
          </button>
        </div>
      </section>
    );
  }

  const ownerId = profileQuery.data.id;

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
