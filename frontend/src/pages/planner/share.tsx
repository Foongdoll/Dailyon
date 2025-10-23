import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, MapPin, User } from "lucide-react";
import { fetchSharedPlannerEvent } from "../../shared/api/plannerApi";

const toTimeLabel = (value?: string | null) => (value ? value.slice(0, 5) : "");

export default function PlannerSharePage() {
  const params = useParams<{ code?: string }>();
  const code = params.code ?? "";

  const eventQuery = useQuery({
    queryKey: ["planner", "shared", code],
    queryFn: () => fetchSharedPlannerEvent(code),
    enabled: Boolean(code),
  });

  const event = eventQuery.data;

  const participantSummary = useMemo(() => {
    if (!event) return "";
    const names = [
      ...event.participants.map((p) => p.nickname ?? p.email),
      ...event.guestNames,
    ];
    return names.join(", ");
  }, [event]);

  if (!code) {
    return (
      <section className="flex min-h-full items-center justify-center bg-slate-950 px-4 py-8 text-slate-200">
        공유 코드가 유효하지 않습니다.
      </section>
    );
  }

  if (eventQuery.isLoading) {
    return (
      <section className="flex min-h-full items-center justify-center bg-slate-950 px-4 py-8 text-slate-200">
        일정을 불러오는 중입니다...
      </section>
    );
  }

  if (!event) {
    return (
      <section className="flex min-h-full items-center justify-center bg-slate-950 px-4 py-8 text-slate-200">
        공유된 일정을 찾을 수 없습니다.
      </section>
    );
  }

  return (
    <section className="min-h-full bg-slate-950 px-4 py-8 text-slate-100 md:px-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
        <header className="mb-6 space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
            <ClipboardCheck className="h-3.5 w-3.5" /> 공유 일정
          </span>
          <h1 className="text-2xl font-semibold text-white">{event.title}</h1>
          <p className="text-sm text-slate-400">
            {event.startDate}
            {event.endDate !== event.startDate ? ` ~ ${event.endDate}` : ""}
            {(event.startTime || event.endTime) ? ` · ${toTimeLabel(event.startTime)} ~ ${toTimeLabel(event.endTime)}` : ""}
            {` • 작성자 ${event.ownerName}`}
          </p>
        </header>

        {event.location && (
          <p className="mb-4 inline-flex items-center gap-2 text-sm text-slate-300">
            <MapPin className="h-4 w-4" /> {event.location}
          </p>
        )}

        {event.description && (
          <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold text-white">내용</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{event.description}</p>
          </section>
        )}

        {event.remarks && (
          <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold text-white">비고</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{event.remarks}</p>
          </section>
        )}

        {event.supplies && (
          <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold text-white">준비물</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{event.supplies}</p>
          </section>
        )}

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold text-white">참여자</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-200">
            <User className="h-4 w-4" /> {participantSummary || "정보 없음"}
          </p>
        </section>

        {event.tags.length > 0 && (
          <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold text-white">태그</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] text-slate-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-8 text-xs text-slate-500">공유 코드: {code}</footer>
      </div>
    </section>
  );
}
