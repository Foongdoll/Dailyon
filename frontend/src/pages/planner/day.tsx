import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Clock, MapPin, MoveLeft, Plus, Share2 } from "lucide-react";
import { fetchPlannerEvents } from "../../shared/api/plannerApi";

const pad = (value: number) => String(value).padStart(2, "0");
const formatDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDate = (value: string) => {
  const parts = value.split("-").map(Number);
  return new Date(parts[0], (parts[1] ?? 1) - 1, parts[2] ?? 1);
};

const toTimeLabel = (value?: string | null) => (value ? value.slice(0, 5) : "");

const HOUR_BLOCK_HEIGHT = 44;

const toHourValue = (time?: string | null, fallback?: number) => {
  if (!time) return fallback ?? 0;
  const parsed = Number.parseInt(time.slice(0, 2), 10);
  if (Number.isNaN(parsed)) return fallback ?? 0;
  return Math.min(Math.max(parsed, 0), 24);
};

export default function PlannerDayPage() {
  const params = useParams<{ date?: string }>();
  const navigate = useNavigate();

  const dateKey = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : formatDateKey(new Date());
  const dateObj = parseDate(dateKey);

  const eventsQuery = useQuery({
    queryKey: ["planner", "day", dateKey],
    queryFn: () => fetchPlannerEvents({ startDate: dateKey, endDate: dateKey }),
  });

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);

  const eventsForDay = useMemo(
    () => events.filter((event) => event.startDate <= dateKey && event.endDate >= dateKey),
    [events, dateKey]
  );

  const sortedEvents = useMemo(() => {
    return [...eventsForDay].sort((a, b) => {
      const startCompare = a.startDate.localeCompare(b.startDate);
      if (startCompare !== 0) return startCompare;
      return (a.startTime ?? "24:00").localeCompare(b.startTime ?? "24:00");
    });
  }, [eventsForDay]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const timelineBlocks = useMemo(() => {
    return sortedEvents
      .map((event, index) => {
        const startedBefore = event.startDate < dateKey;
        const endedAfter = event.endDate > dateKey;
        const isAllDay =
          (!event.startTime && !event.endTime && event.startDate === event.endDate) ||
          (startedBefore && endedAfter);

        let startHour = startedBefore ? 0 : toHourValue(event.startTime, 0);
        let endHour = endedAfter ? 24 : toHourValue(event.endTime, isAllDay ? 24 : startHour + 1);

        if (isAllDay) {
          startHour = 0;
          endHour = 24;
        }

        if (endHour <= startHour) {
          endHour = Math.min(24, startHour + 1);
        }

        startHour = Math.min(Math.max(startHour, 0), 23);
        endHour = Math.min(Math.max(endHour, startHour + 1), 24);

        const durationHours = endHour - startHour;
        const height = durationHours * HOUR_BLOCK_HEIGHT;

        if (height <= 0) {
          return null;
        }

        const startLabel = startedBefore
          ? "00:00"
          : toTimeLabel(event.startTime) || `${pad(startHour)}:00`;
        const endLabel = endedAfter
          ? "24:00"
          : toTimeLabel(event.endTime) || `${pad(Math.min(endHour, 24))}:00`;

        return {
          id: String(event.id ?? `timeline-${index}`),
          title: event.title || "Untitled",
          top: startHour * HOUR_BLOCK_HEIGHT,
          height,
          startLabel,
          endLabel,
        };
      })
      .filter((block): block is NonNullable<typeof block> => Boolean(block));
  }, [sortedEvents, dateKey]);

  return (
    <section className="min-h-full bg-slate-950 px-4 py-6 text-slate-100 md:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-white">
              <CalendarDays className="h-5 w-5" />
              {dateObj.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
            </h1>
            <p className="text-xs text-slate-400">시간 순으로 하루 일정을 확인하세요.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/planner", { state: { plannerNewDate: dateKey } })}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              <Plus className="h-4 w-4" /> 새 일정
            </button>
            <button
              onClick={() => navigate("/planner")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              <MoveLeft className="h-4 w-4" /> 목록으로
            </button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-semibold text-white">타임 테이블</h2>
            <div className="relative mt-4">
              <div className="flex flex-col">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="flex items-center gap-3"
                    style={{ height: HOUR_BLOCK_HEIGHT }}
                  >
                    <div className="flex w-20 items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="h-3.5 w-3.5" /> {pad(hour)}:00
                    </div>
                    <div className="flex-1 border-t border-dashed border-white/10" />
                  </div>
                ))}
              </div>

              <div className="pointer-events-none absolute left-[88px] right-0 top-0 bottom-0">
                {timelineBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="pointer-events-auto absolute inset-x-0 flex flex-col justify-between rounded-xl border border-sky-400/40 bg-sky-500/30 px-3 py-2 text-[11px] font-medium text-white shadow-lg backdrop-blur"
                    title={block.title + " - " + block.startLabel + " ~ " + block.endLabel}
                    style={{
                      top: block.top + 6,
                      height: Math.max(block.height - 12, HOUR_BLOCK_HEIGHT - 12),
                    }}
                  >
                    <span className="truncate text-xs font-semibold text-white/90">{block.title}</span>
                    <span className="text-[10px] text-white/70">
                      {block.startLabel} ~ {block.endLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="space-y-4">
            {eventsQuery.isLoading ? (
              <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-400">
                일정을 불러오는 중입니다...
              </div>
            ) : sortedEvents.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-sm text-slate-400">
                <p>등록된 일정이 없습니다.</p>
                <button
                  onClick={() => navigate("/planner", { state: { plannerNewDate: dateKey } })}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400"
                >
                  <Plus className="h-4 w-4" /> 일정 추가하기
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {sortedEvents.map((event) => (
                  <li key={event.id} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                        <p className="text-xs text-slate-400">
                          {event.startDate}
                          {event.endDate !== event.startDate ? ` ~ ${event.endDate}` : ""}
                          {(event.startTime || event.endTime)
                            ? ` · ${toTimeLabel(event.startTime)} ~ ${toTimeLabel(event.endTime)}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate("/planner", { state: { plannerEventId: event.id } })}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:border-sky-400/60 hover:text-sky-200"
                        >
                          일정 관리
                        </button>
                        {event.shared && event.shareCode && (
                          <button
                            onClick={() => {
                              const link = window.location.origin + "/planner/share/" + event.shareCode;
                              navigator.clipboard.writeText(link).then(() => toast.success("공유 링크를 복사했습니다."));
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:border-sky-400/60 hover:text-sky-200"
                          >
                            <Share2 className="h-4 w-4" /> 링크 복사
                          </button>
                        )}
                      </div>
                    </div>

                    {event.location && (
                      <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-300">
                        <MapPin className="h-3.5 w-3.5" /> {event.location}
                      </p>
                    )}

                    {event.description && (
                      <p className="mt-3 text-sm text-slate-300">{event.description}</p>
                    )}

                    {(event.participants.length > 0 || event.guestNames.length > 0) && (
                      <div className="mt-3 text-xs text-slate-400">
                        참여자: {[
                          ...event.participants.map((user) => user.nickname ?? user.email),
                          ...event.guestNames,
                        ].join(", ")}
                      </div>
                    )}

                    {event.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {event.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-slate-200"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
