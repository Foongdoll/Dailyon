import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  MapPin,
  Plus,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import {
  createPlannerEvent,
  deletePlannerEvent,
  fetchPlannerEvents,
  togglePlannerEventShare,
  updatePlannerEvent,
} from "../../shared/api/plannerApi";
import type { PlannerEvent, PlannerEventRequest } from "../../shared/types/planner";
import type { UserSummary } from "../../shared/types/user";
import { searchUsers } from "../../shared/api/userApi";

type ViewMode = "MONTH" | "WEEK" | "AGENDA";

const today = new Date();

const pad = (value: number) => String(value).padStart(2, "0");
const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateKey = (value: string) => {
  const parts = value.split("-").map(Number);
  return new Date(parts[0], (parts[1] ?? 1) - 1, parts[2] ?? 1);
};

const startOfWeek = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day + 6) % 7;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfWeek = (date: Date) => {
  const start = startOfWeek(date);
  start.setDate(start.getDate() + 6);
  return start;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const buildMonthMatrix = (base: Date) => {
  const start = startOfWeek(startOfMonth(base));
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day))
  );
};

const toTimeLabel = (value?: string | null) => {
  if (!value) return "";
  return value.slice(0, 5);
};

const compareEvents = (a: PlannerEvent, b: PlannerEvent) => {
  const dateCompare = a.startDate.localeCompare(b.startDate);
  if (dateCompare !== 0) return dateCompare;
  const aStart = a.startTime ?? "24:00";
  const bStart = b.startTime ?? "24:00";
  return aStart.localeCompare(bStart);
};

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

const tuneWeekendText = (
  weekdayIndex: number,
  defaultClass: string,
  saturdayClass = "text-sky-300",
  sundayClass = "text-rose-300"
) => {
  if (weekdayIndex === 5) return saturdayClass;
  if (weekdayIndex === 6) return sundayClass;
  return defaultClass;
};

export default function PlannerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>("MONTH");
  const [cursor, setCursor] = useState<Date>(today);
  const [modalState, setModalState] = useState<
    | { mode: "create"; defaultDate: Date | null }
    | { mode: "edit"; event: PlannerEvent }
    | null
  >(null);

  const range = useMemo(() => {
    if (view === "MONTH") {
      return {
        start: formatDateKey(startOfMonth(cursor)),
        end: formatDateKey(endOfMonth(cursor)),
      };
    }
    const start = startOfWeek(cursor);
    const end = endOfWeek(cursor);
    return { start: formatDateKey(start), end: formatDateKey(end) };
  }, [cursor, view]);

  const eventsQuery = useQuery({
    queryKey: ["planner", "events", range.start, range.end],
    queryFn: () => fetchPlannerEvents({ startDate: range.start, endDate: range.end }),
  });
  const events = eventsQuery.data ?? [];

  const eventsByDate = useMemo(() => {
    const map = new Map<string, PlannerEvent[]>();
    for (const event of events) {
      const start = parseDateKey(event.startDate);
      const end = parseDateKey(event.endDate ?? event.startDate);
      for (let cursor = new Date(start); cursor.getTime() <= end.getTime(); cursor = addDays(cursor, 1)) {
        const key = formatDateKey(cursor);
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(event);
      }
    }
    for (const list of map.values()) {
      list.sort(compareEvents);
    }
    return map;
  }, [events]);

  useEffect(() => {
    const state = (location.state as { plannerEventId?: number; plannerNewDate?: string } | null) ?? null;
    if (!state) return;

    if (state.plannerEventId && events.length > 0) {
      const target = events.find((item) => item.id === state.plannerEventId);
      if (target) {
        openEditModal(target);
      }
    } else if (state.plannerNewDate) {
      openCreateModal(parseDateKey(state.plannerNewDate));
    }

    if (state.plannerEventId || state.plannerNewDate) {
      navigate(".", { replace: true, state: null });
    }
  }, [location.state, events, navigate]);

  const monthLabel = cursor.toLocaleDateString([], { year: "numeric", month: "long" });
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, idx) => addDays(startOfWeek(cursor), idx)),
    [cursor]
  );
  const monthGrid = useMemo(() => buildMonthMatrix(cursor), [cursor]);

  const goPrev = () => {
    if (view === "MONTH") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    } else {
      setCursor(addDays(cursor, -7));
    }
  };
  const goNext = () => {
    if (view === "MONTH") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
    } else {
      setCursor(addDays(cursor, 7));
    }
  };
  const goToday = () => setCursor(today);

  const invalidateEvents = () => {
    queryClient.invalidateQueries({ queryKey: ["planner", "events"] });
  };

  const createMutation = useMutation({
    mutationFn: createPlannerEvent,
    onSuccess: () => {
      toast.success("일정을 등록했어요.");
      invalidateEvents();
      setModalState(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? "일정 등록에 실패했습니다.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PlannerEventRequest }) =>
      updatePlannerEvent(id, payload),
    onSuccess: () => {
      toast.success("일정을 수정했습니다.");
      invalidateEvents();
      setModalState(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? "일정 수정에 실패했습니다.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlannerEvent,
    onSuccess: () => {
      toast.success("일정을 삭제했습니다.");
      invalidateEvents();
      setModalState(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? "일정 삭제에 실패했습니다.");
    },
  });

  const shareMutation = useMutation({
    mutationFn: ({ id, shared }: { id: number; shared: boolean }) => togglePlannerEventShare(id, shared),
    onSuccess: () => {
      toast.success("공유 상태를 변경했습니다.");
      invalidateEvents();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? "공유 설정에 실패했습니다.");
    },
  });

  const openCreateModal = (defaultDate: Date | null = null) => {
    setModalState({ mode: "create", defaultDate });
  };

  const openEditModal = (event: PlannerEvent) => {
    setModalState({ mode: "edit", event });
  };

  const handleSubmit = (payload: PlannerEventRequest, eventId?: number) => {
    if (eventId) {
      updateMutation.mutate({ id: eventId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <section className="min-h-full bg-slate-950 px-4 py-6 text-slate-100 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 transition hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToday}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold transition hover:bg-white/10"
            >
              오늘
            </button>
            <button
              onClick={goNext}
              className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 transition hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="ml-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 opacity-70" />
              <h1 className="text-lg font-semibold">{monthLabel}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ViewSwitcher value={view} onChange={setView} />
            <button
              onClick={() => openCreateModal(cursor)}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              <Plus className="h-4 w-4" />
              새 일정
            </button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-3">
            {eventsQuery.isLoading ? (
              <div className="flex min-h-[360px] items-center justify-center text-sm text-slate-400">
                일정을 불러오는 중입니다...
              </div>
            ) : view === "MONTH" ? (
              <MonthView
                matrix={monthGrid}
                eventsByDate={eventsByDate}
                onSelectDate={(date) => navigate("/planner/" + formatDateKey(date))}
                onSelectEvent={openEditModal}
              />
            ) : view === "WEEK" ? (
              <WeekView
                days={weekDays}
                eventsByDate={eventsByDate}
                onSelectEvent={openEditModal}
                onSelectDate={(date) => navigate("/planner/" + formatDateKey(date))}
              />
            ) : (
              <AgendaView
                days={weekDays}
                eventsByDate={eventsByDate}
                onSelectEvent={openEditModal}
                onSelectDate={(date) => navigate("/planner/" + formatDateKey(date))}
              />
            )}
          </section>

          <aside className="flex flex-col gap-4">
            <MiniMonth
              base={cursor}
              eventsByDate={eventsByDate}
              onPick={(date) => {
                setCursor(date);
                navigate("/planner/" + formatDateKey(date));
              }}
            />
            <UpcomingPanel events={events} onSelectEvent={openEditModal} />
          </aside>
        </div>
      </div>

      {modalState && (
        <PlannerEventModal
          state={modalState}
          onClose={() => setModalState(null)}
          onSubmit={handleSubmit}
          onDelete={(id, shared) => {
            if (shared && !window.confirm("공유된 일정입니다. 삭제하면 공유 링크도 사용할 수 없습니다. 계속할까요?")) {
              return;
            }
            deleteMutation.mutate(id);
          }}
          onToggleShare={(id, shared) => shareMutation.mutate({ id, shared })}
          loading={
            createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || shareMutation.isPending
          }
        />
      )}
    </section>
  );
}

function ViewSwitcher({ value, onChange }: { value: ViewMode; onChange: (mode: ViewMode) => void }) {
  const options: { value: ViewMode; label: string }[] = [
    { value: "MONTH", label: "월" },
    { value: "WEEK", label: "주" },
    { value: "AGENDA", label: "목록" },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={
              "rounded-lg px-3 py-1.5 text-sm transition " +
              (active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-white/10")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

type EventsByDate = Map<string, PlannerEvent[]>;

function MonthView({
  matrix,
  eventsByDate,
  onSelectDate,
  onSelectEvent,
}: {
  matrix: Date[][];
  eventsByDate: EventsByDate;
  onSelectDate: (date: Date) => void;
  onSelectEvent: (event: PlannerEvent) => void;
}) {
  const currentMonth = matrix[2][0].getMonth();
  return (
    <div className="grid grid-cols-7 gap-px rounded-2xl border border-slate-800 bg-slate-800/60 p-px">
      {WEEKDAY_LABELS.map((label, idx) => (
        <div
          key={label}
          className={`sticky top-0 z-10 bg-slate-900/80 p-2 text-center text-xs font-semibold backdrop-blur ${tuneWeekendText(
            idx,
            "text-slate-400"
          )}`}
        >
          {label}
        </div>
      ))}

      {matrix.flat().map((date, idx) => {
        const dateKey = formatDateKey(date);
        const list = eventsByDate.get(dateKey) ?? [];
        const isToday = sameDay(date, today);
        const isMuted = date.getMonth() !== currentMonth;
        const weekdayIndex = idx % 7;
        return (
          <div
            key={dateKey + idx}
            onClick={() => onSelectDate(date)}
            className={
              "min-h-[110px] cursor-pointer bg-slate-900/40 p-2 transition hover:bg-slate-900/60" +
              (isMuted ? " opacity-50" : "") +
              (isToday ? " ring-1 ring-sky-400/70" : "")
            }
          >
            <div className="mb-1 flex items-center justify-between">
              <span
                className={
                  "text-xs " +
                  (isToday
                    ? "font-bold text-sky-300"
                    : tuneWeekendText(weekdayIndex, "text-slate-400"))
                }
              >
                {date.getDate()}
              </span>
              {list.length > 0 && (
                <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
                  {list.length}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {list.slice(0, 3).map((event) => (
                <button
                  key={event.id}
                  onClick={(eventClick) => {
                    eventClick.stopPropagation();
                    onSelectEvent(event);
                  }}
                  className="w-full truncate rounded-md bg-slate-800/80 px-2 py-1 text-left text-[11px] text-white hover:bg-slate-700"
                >
                  {event.title}
                </button>
              ))}
              {list.length > 3 && (
                <span className="block rounded-md bg-slate-700/40 px-2 py-1 text-[11px] text-slate-300">
                  + {list.length - 3} 더보기
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekView({
  days,
  eventsByDate,
  onSelectEvent,
  onSelectDate,
}: {
  days: Date[];
  eventsByDate: EventsByDate;
  onSelectEvent: (event: PlannerEvent) => void;
  onSelectDate: (date: Date) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, idx) => idx);
  return (
    <div className="grid grid-cols-[64px_repeat(7,1fr)] rounded-2xl border border-slate-800">
      <div className="bg-slate-900/80 p-2 text-right text-xs text-slate-400">시간</div>
      {days.map((date, idx) => (
        <div
          key={date.toISOString()}
          className={`bg-slate-900/80 p-2 text-center text-xs font-semibold ${tuneWeekendText(
            idx,
            "text-slate-400"
          )}`}
        >
          <button onClick={() => onSelectDate(date)} className="rounded-lg px-2 py-1 hover:bg-white/10">
            {date.toLocaleDateString([], { weekday: "short" })} {date.getDate()}
          </button>
        </div>
      ))}
      {hours.map((hour) => (
        <div key={hour} className="contents">
          <div className="border-b border-slate-800/70 bg-slate-900/50 p-2 text-right text-[10px] text-slate-500">
            {String(hour).padStart(2, "0")}:00
          </div>
          {days.map((date) => {
            const list = (eventsByDate.get(formatDateKey(date)) ?? []).filter((event) => {
              if (!event.startTime) return hour === 0;
              return parseInt(event.startTime.slice(0, 2), 10) === hour;
            });
            return (
              <div key={date.toISOString()} className="border-l border-b border-slate-800/70 p-1">
                {list.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="mb-1 w-full rounded-lg border border-white/10 bg-slate-800/80 px-2 py-1 text-left text-[11px] text-white hover:bg-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{event.title}</span>
                      <span className="ml-2 text-[10px] text-slate-300">
                        {toTimeLabel(event.startTime)}~{toTimeLabel(event.endTime)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function AgendaView({
  days,
  eventsByDate,
  onSelectEvent,
  onSelectDate,
}: {
  days: Date[];
  eventsByDate: EventsByDate;
  onSelectEvent: (event: PlannerEvent) => void;
  onSelectDate: (date: Date) => void;
}) {
  return (
    <div className="space-y-4">
      {days.map((date, idx) => {
        const list = eventsByDate.get(formatDateKey(date)) ?? [];
        return (
          <div key={date.toISOString()} className="rounded-2xl border border-slate-800 bg-slate-900/70">
            <button
              onClick={() => onSelectDate(date)}
              className={`flex w-full items-center justify-between border-b border-slate-800 px-4 py-2 text-left text-xs hover:bg-white/5 ${tuneWeekendText(
                idx,
                "text-slate-300"
              )}`}
            >
              <span>
                {date.toLocaleDateString([], { weekday: "long" })} · {date.toLocaleDateString()}
              </span>
              <span className="text-[10px] text-slate-400">{list.length}개 일정</span>
            </button>
            {list.length === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-400">등록된 일정이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-slate-800">
                {list.map((event) => (
                  <li key={event.id} className="px-4 py-4">
                    <button
                      onClick={() => onSelectEvent(event)}
                      className="flex w-full flex-col items-start gap-2 text-left hover:text-sky-200"
                    >
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{event.title}</span>
                        <span className="text-xs text-slate-400">
                          {toTimeLabel(event.startTime)}~{toTimeLabel(event.endTime)}
                        </span>
                      </div>
                      {event.location && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      )}
                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
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
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MiniMonth({
  base,
  eventsByDate,
  onPick,
}: {
  base: Date;
  eventsByDate: EventsByDate;
  onPick: (date: Date) => void;
}) {
  const matrix = useMemo(() => buildMonthMatrix(base), [base]);
  const month = base.getMonth();
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">이달의 일정</h2>
      <div className="grid grid-cols-7 gap-px rounded-xl border border-slate-800 bg-slate-800/60 p-px text-center text-[10px]">
        {WEEKDAY_LABELS.map((label, idx) => (
          <div
            key={label}
            className={`bg-slate-900/80 py-2 font-semibold ${tuneWeekendText(idx, "text-slate-400")}`}
          >
            {label}
          </div>
        ))}
        {matrix.flat().map((date, idx) => {
          const key = formatDateKey(date);
          const count = eventsByDate.get(key)?.length ?? 0;
          const isMuted = date.getMonth() !== month;
          const isToday = sameDay(date, today);
          const weekdayIndex = idx % 7;
          const baseColor = tuneWeekendText(weekdayIndex, "text-slate-200");
          return (
            <button
              key={key}
              onClick={() => onPick(date)}
              className={
                "flex h-10 flex-col items-center justify-center bg-slate-900/40 text-xs transition hover:bg-slate-800" +
                (isMuted ? " opacity-40" : "") +
                (isToday ? " font-semibold text-sky-300" : " " + baseColor)
              }
            >
              <span>{date.getDate()}</span>
              {count > 0 && (
                <span
                  className={
                    "text-[9px] " + (isToday ? "text-sky-300" : tuneWeekendText(weekdayIndex, "text-sky-300"))
                  }
                >
                  ●
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UpcomingPanel({
  events,
  onSelectEvent,
}: {
  events: PlannerEvent[];
  onSelectEvent: (event: PlannerEvent) => void;
}) {
  const upcoming = useMemo(() => {
    const nowKey = formatDateKey(today);
    return events
      .filter((event) => event.endDate >= nowKey)
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || compareEvents(a, b))
      .slice(0, 5);
  }, [events]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">다가오는 일정</h2>
      {upcoming.length === 0 ? (
        <p className="text-sm text-slate-400">등록된 일정이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((event) => (
            <li key={event.id}>
              <button
                onClick={() => onSelectEvent(event)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white transition hover:border-sky-400/60 hover:text-sky-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{event.title}</span>
                  <span className="text-xs text-slate-400">
                    {event.startDate}
                    {event.endDate !== event.startDate ? ` ~ ${event.endDate}` : ""}
                    {event.startTime ? ` · ${toTimeLabel(event.startTime)}` : ""}
                  </span>
                </div>
                {event.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type ModalState =
  | { mode: "create"; defaultDate: Date | null }
  | { mode: "edit"; event: PlannerEvent };

type PlannerEventModalProps = {
  state: ModalState;
  onClose: () => void;
  onSubmit: (payload: PlannerEventRequest, eventId?: number) => void;
  onDelete: (eventId: number, shared: boolean) => void;
  onToggleShare: (eventId: number, shared: boolean) => void;
  loading: boolean;
};

function PlannerEventModal({ state, onClose, onSubmit, onDelete, onToggleShare, loading }: PlannerEventModalProps) {
  const isEdit = state.mode === "edit";
  const event = state.mode === "edit" ? state.event : null;

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const initialStartDate =
    event?.startDate ?? (state.mode === "create" && state.defaultDate ? formatDateKey(state.defaultDate) : formatDateKey(today));
  const initialEndDate = event?.endDate ?? initialStartDate;
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [singleDay, setSingleDay] = useState(event ? event.startDate === event.endDate : true);
  const [startTime, setStartTime] = useState(event?.startTime?.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(event?.endTime?.slice(0, 5) ?? "");
  const [remarks, setRemarks] = useState(event?.remarks ?? "");
  const [supplies, setSupplies] = useState(event?.supplies ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [tagsText, setTagsText] = useState(event?.tags.join(", ") ?? "");
  const [shared, setShared] = useState(event?.shared ?? false);

  const [participantInput, setParticipantInput] = useState("");
  const [suggestions, setSuggestions] = useState<UserSummary[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<UserSummary[]>(
    event?.participants ?? []
  );
  const [guestNames, setGuestNames] = useState<string[]>(event?.guestNames ?? []);

  useEffect(() => {
    if (singleDay) {
      setEndDate(startDate);
    }
  }, [singleDay, startDate]);

  useEffect(() => {
    if (!participantInput.trim()) {
      setSuggestions([]);
      return;
    }
    const handler = setTimeout(() => {
      searchUsers(participantInput.trim())
        .then((list) => setSuggestions(list))
        .catch(() => {
          setSuggestions([]);
          toast.error("참여자 검색에 실패했습니다.");
        });
    }, 300);
    return () => clearTimeout(handler);
  }, [participantInput]);

  const addParticipant = (user: UserSummary) => {
    if (selectedParticipants.some((item) => item.id === user.id)) return;
    setSelectedParticipants((prev) => [...prev, user]);
    setParticipantInput("");
    setSuggestions([]);
  };

  const addGuest = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || guestNames.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) return;
    setGuestNames((prev) => [...prev, trimmed]);
    setParticipantInput("");
    setSuggestions([]);
  };

  const removeParticipant = (id: number) => {
    setSelectedParticipants((prev) => prev.filter((item) => item.id !== id));
  };

  const removeGuest = (name: string) => {
    setGuestNames((prev) => prev.filter((guest) => guest !== name));
  };

  const submit = (eventId?: number) => {
    if (!title.trim()) {
      toast.error("제목을 입력하세요.");
      return;
    }
    if (!startDate) {
      toast.error("시작 날짜를 선택하세요.");
      return;
    }
    const normalizedEndDate = singleDay ? startDate : endDate;
    if (!normalizedEndDate) {
      toast.error("종료 날짜를 선택하세요.");
      return;
    }
    if (new Date(normalizedEndDate).getTime() < new Date(startDate).getTime()) {
      toast.error("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }
    if (singleDay && startTime && endTime && startTime > endTime) {
      toast.error("시작 시간이 종료 시간보다 늦을 수 없습니다.");
      return;
    }
    const tags = tagsText
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);
    const payload: PlannerEventRequest = {
      title: title.trim(),
      description: description.trim() || null,
      startDate,
      endDate: normalizedEndDate,
      startTime: startTime ? startTime + ":00" : null,
      endTime: endTime ? endTime + ":00" : null,
      remarks: remarks.trim() || null,
      supplies: supplies.trim() || null,
      location: location.trim() || null,
      tags,
      participantIds: selectedParticipants.map((participant) => participant.id),
      guestNames,
      shared,
    };
    onSubmit(payload, eventId);
  };

  const shareLink =
    event && event.shared && event.shareCode
      ? window.location.origin + "/planner/share/" + event.shareCode
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-black/70">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {isEdit ? "일정 상세" : "새 일정"}
            </h2>
            <p className="text-xs text-slate-400">
              제목, 시간, 참여자, 준비물 등 세부 정보를 입력하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-xs text-slate-300">
              <span>제목</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full  rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                placeholder="일정 제목을 입력하세요."
              />
            </label>
            <label className="space-y-2 text-xs text-slate-300">
              <span>시작 날짜</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-xs text-slate-300">
              <span>종료 날짜</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={singleDay}
                className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none disabled:opacity-60"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={singleDay}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSingleDay(checked);
                  if (!checked && (!endDate || new Date(endDate).getTime() < new Date(startDate).getTime())) {
                    setEndDate(startDate);
                  }
                }}
                className="h-4 w-4 rounded border-white/20 bg-slate-900 text-sky-500 focus:ring-sky-400"
              />
              하루 일정
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-xs text-slate-300">
              <span>시작 시간</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-xs text-slate-300">
              <span>종료 시간</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              />
            </label>
          </div>

          <label className="space-y-2 text-xs text-slate-300">
            <span>내용</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              placeholder="일정에 대한 설명을 입력하세요."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-xs text-slate-300">
              <span>장소 (네이버 지도 연동 예정)</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                placeholder="예: 강남 스타벅스"
              />
            </label>
            <label className="space-y-2 text-xs text-slate-300">
              <span>태그 (쉼표로 구분)</span>
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                placeholder="예: 여행, 회의"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-xs text-slate-300">
              <span>비고</span>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                placeholder="참고 메모를 입력하세요."
              />
            </label>
            <label className="space-y-2 text-xs text-slate-300">
              <span>준비물</span>
              <textarea
                value={supplies}
                onChange={(e) => setSupplies(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                placeholder="필요한 준비물을 기록하세요."
              />
            </label>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <span>참여자</span>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="relative">
                <input
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (suggestions.length > 0) {
                        addParticipant(suggestions[0]);
                      } else {
                        addGuest(participantInput);
                      }
                    }
                  }}
                  placeholder="닉네임 또는 이메일로 검색"
                  className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-white/10 bg-slate-900/90 shadow-lg">
                    {suggestions.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => addParticipant(user)}
                        className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                      >
                        <div className="font-medium">{user.nickname ?? user.email}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </button>
                    ))}
                  </div>
                )}
                {suggestions.length === 0 && participantInput.trim() && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-slate-300">
                    Enter 키를 눌러 "{participantInput.trim()}" 참여자를 추가합니다.
                  </div>
                )}
              </div>

              {selectedParticipants.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {selectedParticipants.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{user.nickname ?? user.email}</p>
                        <p className="text-[11px] text-slate-400">{user.email}</p>
                      </div>
                      <button
                        onClick={() => removeParticipant(user.id)}
                        className="rounded-full border border-white/10 bg-white/5 p-1 text-slate-300 hover:bg-white/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {guestNames.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {guestNames.map((guest) => (
                    <li
                      key={guest}
                      className="flex items-center justify-between rounded-lg border border-dashed border-white/10 bg-white/5 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{guest}</p>
                        <p className="text-[11px] text-slate-400">게스트 참여자</p>
                      </div>
                      <button
                        onClick={() => removeGuest(guest)}
                        className="rounded-full border border-white/10 bg-white/5 p-1 text-slate-300 hover:bg-white/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {selectedParticipants.length === 0 && guestNames.length === 0 && (
                <p className="mt-3 text-xs text-slate-400">참여자를 추가하면 해당 회원의 캘린더에도 일정이 표시됩니다.</p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={shared}
              onChange={(e) => setShared(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-900 text-sky-500 focus:ring-sky-400"
            />
            공유 링크 생성
          </label>

          {isEdit && event?.editable && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">공유 설정</h3>
                  <p className="text-xs text-slate-400">
                    공유를 켜면 로그인하지 않은 사용자도 링크로 일정을 확인할 수 있습니다.
                  </p>
                </div>
                <button
                  onClick={() => onToggleShare(event.id, !event.shared)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-sky-400/60 hover:text-sky-200"
                >
                  <Share2 className="h-4 w-4" />
                  {event.shared ? "공유 해제" : "공유하기"}
                </button>
              </div>
              {shareLink && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs">
                  <span className="flex-1 truncate text-slate-200">{shareLink}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink).then(() => toast.success("공유 링크를 복사했습니다."));
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {isEdit && event?.editable ? (
            <button
              onClick={() => onDelete(event.id, event.shared)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              취소
            </button>
            <button
              onClick={() => submit(event?.id)}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
              disabled={loading}
            >
              <Clock className="h-4 w-4" />
              {isEdit ? "저장" : "등록"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
