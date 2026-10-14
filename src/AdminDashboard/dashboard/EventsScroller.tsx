import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { Award, Cake, CalendarDays, PartyPopper, Sparkles } from "lucide-react";
import { DashboardEvent, DashboardEventType } from "../../types/adminDashboard.types";

type EventFilter = "ALL" | DashboardEventType;

interface EventsScrollerProps {
  events: DashboardEvent[];
  windowDays: number;
  /** Prefix for the subtitle, e.g. "Team birthdays, anniversaries & holidays". */
  subtitle?: string;
}

const EVENT_STYLES: Record<
  DashboardEventType,
  { label: string; icon: typeof Cake; badge: string; iconWrap: string; dateWrap: string }
> = {
  BIRTHDAY: {
    label: "Birthday",
    icon: Cake,
    badge: "bg-pink-50 text-pink-600",
    iconWrap: "bg-pink-50 text-pink-500",
    dateWrap: "bg-pink-50 text-pink-600",
  },
  ANNIVERSARY: {
    label: "Work Anniversary",
    icon: Award,
    badge: "bg-amber-50 text-amber-600",
    iconWrap: "bg-amber-50 text-amber-500",
    dateWrap: "bg-amber-50 text-amber-600",
  },
  HOLIDAY: {
    label: "Holiday",
    icon: CalendarDays,
    badge: "bg-emerald-50 text-emerald-600",
    iconWrap: "bg-emerald-50 text-emerald-500",
    dateWrap: "bg-emerald-50 text-emerald-600",
  },
};

const FILTERS: { key: EventFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "BIRTHDAY", label: "Birthdays" },
  { key: "ANNIVERSARY", label: "Anniversaries" },
  { key: "HOLIDAY", label: "Holidays" },
];

const SCROLL_SPEED_PX_PER_SEC = 18;

const whenLabel = (daysAway: number) => {
  if (daysAway === 0) return "Today";
  if (daysAway === 1) return "Tomorrow";
  if (daysAway < 7) return `In ${daysAway} days`;
  if (daysAway < 14) return "Next week";
  return `In ${Math.round(daysAway / 7)} weeks`;
};

const subtitleFor = (event: DashboardEvent) => {
  if (event.type === "HOLIDAY") return "Company holiday";
  const parts = [event.designation, event.department].filter(Boolean);
  return parts.join(" · ") || event.employeeId || "";
};

const EventRow = ({ event }: { event: DashboardEvent }) => {
  const style = EVENT_STYLES[event.type];
  const Icon = style.icon;
  const date = dayjs(event.date);
  const isToday = event.daysAway === 0;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        isToday
          ? "border-[#4318FF]/20 bg-linear-to-r from-[#4318FF]/8 via-[#868CFF]/5 to-transparent"
          : "border-gray-100 bg-white hover:bg-[#F4F7FE]"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${style.dateWrap}`}
      >
        <span className="text-[10px] font-bold uppercase leading-none">{date.format("MMM")}</span>
        <span className="text-lg font-black leading-tight">{date.format("D")}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`p-1 rounded-md ${style.iconWrap}`}>
            <Icon size={12} />
          </span>
          <p className="text-sm font-bold text-[#2B3674] truncate">{event.title}</p>
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {date.format("dddd")} · {subtitleFor(event)}
        </p>
      </div>

      <span
        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg shrink-0 ${
          isToday ? "bg-[#4318FF] text-white" : style.badge
        }`}
      >
        {whenLabel(event.daysAway)}
      </span>
    </div>
  );
};

const EventsScroller = ({
  events,
  windowDays,
  subtitle = "Birthdays, anniversaries & holidays",
}: EventsScrollerProps) => {
  const [filter, setFilter] = useState<EventFilter>("ALL");
  const [paused, setPaused] = useState(false);
  const [shouldLoop, setShouldLoop] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const result: Record<EventFilter, number> = { ALL: events.length, BIRTHDAY: 0, ANNIVERSARY: 0, HOLIDAY: 0 };
    events.forEach((e) => {
      result[e.type] += 1;
    });
    return result;
  }, [events]);

  const visible = useMemo(
    () => (filter === "ALL" ? events : events.filter((e) => e.type === filter)),
    [events, filter],
  );

  const todayCount = visible.filter((e) => e.daysAway === 0 && e.type !== "HOLIDAY").length;

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const list = listRef.current;
    if (!viewport || !list) return;
    const measure = () => setShouldLoop(list.offsetHeight > viewport.clientHeight + 4);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(list);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
  }, [filter]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const list = listRef.current;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!viewport || !list || !shouldLoop || paused || reduceMotion) return;

    let frame = 0;
    let last = performance.now();
    let offset = viewport.scrollTop;
    const tick = (now: number) => {
      offset += ((now - last) / 1000) * SCROLL_SPEED_PX_PER_SEC;
      last = now;
      const loopHeight = list.offsetHeight;
      if (offset >= loopHeight) offset -= loopHeight;
      viewport.scrollTop = offset;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shouldLoop, paused, visible]);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0px_8px_24px_rgba(112,144,176,0.1)] border border-gray-100/80 flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F4F7FE] text-[#4318FF]">
            <PartyPopper size={18} />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#2B3674]">Upcoming Events</h4>
            <p className="text-xs text-gray-400">{subtitle} · next {windowDays} days</p>
          </div>
        </div>
        {todayCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-[#4318FF]/10 text-[#4318FF] shrink-0">
            <Sparkles size={12} /> {todayCount} today
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === key
                ? "bg-[#4318FF] text-white shadow-sm"
                : "bg-[#F4F7FE] text-[#2B3674] hover:bg-[#E9EDF7]"
            }`}
          >
            {label}
            <span className={`ml-1.5 ${filter === key ? "text-white/70" : "text-gray-400"}`}>{counts[key]}</span>
          </button>
        ))}
      </div>

      <div
        ref={viewportRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="relative flex-1 min-h-[280px] max-h-[420px] overflow-y-auto custom-scrollbar pr-1"
      >
        {visible.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 text-gray-400">
            <CalendarDays size={28} className="mb-2 text-gray-300" />
            <p className="text-sm font-semibold">No upcoming events</p>
            <p className="text-xs mt-1">
              {filter === "BIRTHDAY"
                ? "Add dates of birth to employee profiles to see birthdays here."
                : `Nothing scheduled in the next ${windowDays} days.`}
            </p>
          </div>
        ) : (
          <>
            <div ref={listRef} className="flex flex-col gap-2 pb-2">
              {visible.map((event, i) => (
                <EventRow key={`${event.type}-${event.employeeId ?? event.title}-${event.date}-${i}`} event={event} />
              ))}
            </div>
            {shouldLoop && (
              <div aria-hidden className="flex flex-col gap-2 pb-2">
                {visible.map((event, i) => (
                  <EventRow key={`dup-${event.type}-${event.employeeId ?? event.title}-${event.date}-${i}`} event={event} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventsScroller;
