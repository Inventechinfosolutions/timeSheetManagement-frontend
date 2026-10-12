import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { fetchAttendanceSnapshot } from "../../reducers/adminDashboard.reducer";
import {
  ChevronLeft,
  CalendarDays,
  Loader2,
  Info,
  Building2,
  Home,
  Briefcase,
  Plane,
  Clock3,
  AlertCircle,
  Activity,
  PartyPopper,
  ChevronRight,
  Search,
  X,
  Users,
} from "lucide-react";
import {
  DashboardEmployeeBrief,
  DashboardScope,
  TodayCategory,
  TodaySnapshot,
} from "../../types/adminDashboard.types";

const CATEGORIES: {
  key: TodayCategory;
  label: string;
  description: string;
  emptyText: string;
  color: string;
  tint: string;
  icon: typeof Building2;
}[] = [
  {
    key: "office",
    label: "In Office",
    description: "Working from the office",
    emptyText: "No one has marked office attendance yet.",
    color: "#4318FF",
    tint: "bg-[#4318FF]/10 text-[#4318FF]",
    icon: Building2,
  },
  {
    key: "wfh",
    label: "Work From Home",
    description: "Working remotely",
    emptyText: "No one is working from home on this day.",
    color: "#39B8FF",
    tint: "bg-sky-50 text-sky-500",
    icon: Home,
  },
  {
    key: "clientVisit",
    label: "Client Visit",
    description: "Out at client locations",
    emptyText: "No client visits on this day.",
    color: "#7551FF",
    tint: "bg-violet-50 text-violet-500",
    icon: Briefcase,
  },
  {
    key: "halfDay",
    label: "Half Day",
    description: "Working one half of the day",
    emptyText: "No half days on this day.",
    color: "#FFB547",
    tint: "bg-amber-50 text-amber-500",
    icon: Clock3,
  },
  {
    key: "onLeave",
    label: "On Leave",
    description: "Away on approved leave",
    emptyText: "Everyone is in. No one is on leave.",
    color: "#EE5D50",
    tint: "bg-red-50 text-[#EE5D50]",
    icon: Plane,
  },
  {
    key: "notUpdated",
    label: "Not Updated",
    description: "Haven't logged their timesheet for this day",
    emptyText: "Great! Everyone has updated their timesheet.",
    color: "#A3AED0",
    tint: "bg-gray-100 text-gray-500",
    icon: AlertCircle,
  },
];

const SEARCH_THRESHOLD = 6;

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

const EmployeeCard = ({
  person,
  color,
  onOpen,
}: {
  person: DashboardEmployeeBrief;
  color: string;
  onOpen: () => void;
}) => {
  const meta = [person.designation, person.department].filter(Boolean).join(" · ");
  return (
    <button
      onClick={onOpen}
      className="group relative flex items-center gap-3 w-full p-2.5 pl-3.5 rounded-xl bg-white border border-gray-100 text-left overflow-hidden transition-all hover:shadow-[0px_6px_16px_rgba(112,144,176,0.16)] hover:-translate-y-px"
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-1 opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: color }}
      />
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        {initialsOf(person.fullName)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-[#2B3674] truncate">{person.fullName}</span>
        <span className="block text-[11px] text-gray-400 truncate">{meta || person.employeeId}</span>
      </span>
      <ChevronRight
        size={16}
        className="text-gray-300 shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
      />
    </button>
  );
};

interface TodaySnapshotCardProps {
  today: TodaySnapshot;
  totalEmployees: number;
  scope?: DashboardScope;
  /** Route prefix used when opening an employee, e.g. "/admin-dashboard". */
  basePath?: string;
}

const MAX_FUTURE_DAYS = 30;

const relativeDayLabel = (date: string, todayStr: string) => {
  const diff = dayjs(date).diff(dayjs(todayStr), "day");
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return diff < 0 ? `${-diff} days ago` : `In ${diff} days`;
};

const TodaySnapshotCard = ({
  today,
  totalEmployees,
  scope = "admin",
  basePath = "/admin-dashboard",
}: TodaySnapshotCardProps) => {
  const isTeam = scope === "manager";
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { attendance, attendanceLoading, attendanceError } = useAppSelector(
    (state) => state.adminDashboard,
  );

  const todayStr = today.date;
  const maxDate = dayjs(todayStr).add(MAX_FUTURE_DAYS, "day").format("YYYY-MM-DD");
  const [viewDate, setViewDate] = useState(todayStr);
  const isToday = viewDate === todayStr;
  const isFuture = viewDate > todayStr;

  useEffect(() => {
    if (!isToday) dispatch(fetchAttendanceSnapshot({ date: viewDate, scope }));
  }, [dispatch, viewDate, isToday, today, scope]);

  const resolved = isToday ? today : attendance?.date === viewDate ? attendance : null;
  const lastShownRef = useRef<TodaySnapshot>(today);
  if (resolved) lastShownRef.current = resolved;
  const snapshot = resolved ?? lastShownRef.current;
  const isStale = !resolved;

  const changeDate = (next: string) => {
    if (!next) return;
    setViewDate(next > maxDate ? maxDate : next);
  };
  const shiftDay = (delta: number) =>
    changeDate(dayjs(viewDate).add(delta, "day").format("YYYY-MM-DD"));

  const defaultCategory: TodayCategory = snapshot.counts.onLeave > 0 ? "onLeave" : "notUpdated";
  const [selected, setSelected] = useState<TodayCategory>(defaultCategory);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setSelected(defaultCategory);
  }, [snapshot.date, defaultCategory]);

  useEffect(() => {
    setQuery("");
  }, [selected]);

  const total = totalEmployees || 1;
  const updated = totalEmployees - snapshot.counts.notUpdated;
  const selectedMeta = CATEGORIES.find((c) => c.key === selected)!;
  const SelectedIcon = selectedMeta.icon;
  const selectedPeople = useMemo(
    () => [...(snapshot.employees[selected] || [])].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [snapshot.employees, selected],
  );
  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return selectedPeople;
    return selectedPeople.filter((p) =>
      [p.fullName, p.employeeId, p.department, p.designation]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [selectedPeople, query]);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0px_8px_24px_rgba(112,144,176,0.1)] border border-gray-100/80 h-full flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F4F7FE] text-[#4318FF]">
            <Activity size={18} />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#2B3674]">
              {isTeam
                ? isToday ? "Team Attendance Today" : "Team Attendance"
                : isToday ? "Today's Attendance" : "Attendance"}
            </h4>
            <p className="text-xs text-gray-400">
              {dayjs(viewDate).format("dddd, D MMMM YYYY")}
              {!isToday && (
                <span className="ml-1.5 font-semibold text-[#4318FF]">
                  · {relativeDayLabel(viewDate, todayStr)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#F4F7FE] rounded-xl p-1">
              <button
                onClick={() => shiftDay(-1)}
                className="p-1.5 rounded-lg text-[#2B3674] hover:bg-white transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft size={16} />
              </button>
              <label className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer">
                <CalendarDays size={14} className="text-[#4318FF]" />
                <span className="text-xs font-bold text-[#2B3674] whitespace-nowrap">
                  {dayjs(viewDate).format("ddd, D MMM YYYY")}
                </span>
                <input
                  type="date"
                  value={viewDate}
                  max={maxDate}
                  onChange={(e) => changeDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
                    } catch {
                      /* picker opens natively where showPicker is unsupported */
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Select date"
                />
              </label>
              <button
                onClick={() => shiftDay(1)}
                disabled={viewDate >= maxDate}
                className="p-1.5 rounded-lg text-[#2B3674] hover:bg-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Next day"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            {!isToday && (
              <button
                onClick={() => setViewDate(todayStr)}
                className="px-3 py-2 rounded-xl bg-[#4318FF] text-white text-xs font-bold shadow-sm hover:bg-[#3311CC] transition-colors"
              >
                Today
              </button>
            )}
          </div>

          <div className="text-right">
            <p className="text-xl font-black text-[#2B3674] leading-none">
              {updated}
              <span className="text-sm font-bold text-gray-400">/{totalEmployees}</span>
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">
              {isToday ? "Updated today" : isFuture ? "Planned" : "Updated"}
            </p>
          </div>
        </div>
      </div>

      {attendanceError && !isToday && isStale && !attendanceLoading && (
        <div className="flex items-center justify-between gap-2 mb-4 px-3 py-2 rounded-xl bg-red-50 text-[#EE5D50] text-xs font-semibold">
          <span>Couldn't load attendance for this date: {attendanceError}</span>
          <button onClick={() => dispatch(fetchAttendanceSnapshot({ date: viewDate, scope }))} className="underline">
            Retry
          </button>
        </div>
      )}

      {isFuture && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-[#4318FF]/5 text-[#4318FF] text-xs font-semibold">
          <Info size={14} />
          Upcoming date. This shows approved leave, WFH and client-visit requests only.
        </div>
      )}

      {!snapshot.isWorkingDay && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
          <PartyPopper size={14} />
          {snapshot.holidayName
            ? `${isToday ? "Holiday today" : "Holiday"}: ${snapshot.holidayName}`
            : "Weekend. Attendance isn't expected on this day."}
        </div>
      )}

      <div className={`relative flex-1 min-h-0 flex flex-col transition-opacity ${isStale ? "opacity-50 pointer-events-none" : ""}`}>
      {isStale && attendanceLoading && (
        <div className="absolute inset-0 z-10 flex items-start justify-center pt-16">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-md text-xs font-bold text-[#4318FF]">
            <Loader2 size={14} className="animate-spin" /> Loading {dayjs(viewDate).format("D MMM")}…
          </span>
        </div>
      )}

      <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-gray-100 mb-5">
        {CATEGORIES.map(({ key, color, label }) =>
          snapshot.counts[key] > 0 ? (
            <div
              key={key}
              title={`${label}: ${snapshot.counts[key]}`}
              style={{ width: `${(snapshot.counts[key] / total) * 100}%`, backgroundColor: color }}
              className="h-full transition-all"
            />
          ) : null,
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {CATEGORIES.map(({ key, label, tint, icon: Icon, color }) => {
          const isActive = selected === key;
          const count = snapshot.counts[key];
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                isActive ? "bg-white shadow-sm" : "border-transparent bg-[#F8F9FC] hover:bg-[#F4F7FE]"
              }`}
              style={isActive ? { borderColor: color } : undefined}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`p-1.5 rounded-lg ${tint}`}>
                  <Icon size={14} />
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  {Math.round((count / total) * 100)}%
                </span>
              </div>
              <p className="text-2xl font-black text-[#2B3674] leading-none">{count}</p>
              <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
            </button>
          );
        })}
      </div>

      <div
        className="flex-1 min-h-0 flex flex-col rounded-2xl border bg-[#F8F9FC] overflow-hidden"
        style={{ borderColor: `${selectedMeta.color}33` }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          style={{
            background: `linear-gradient(90deg, ${selectedMeta.color}14 0%, ${selectedMeta.color}05 60%, transparent 100%)`,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: selectedMeta.color }}
            >
              <SelectedIcon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#2B3674] flex items-center gap-2">
                {selectedMeta.label}
                <span
                  className="text-[11px] font-black px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${selectedMeta.color}1F`, color: selectedMeta.color }}
                >
                  {selectedPeople.length}
                </span>
              </p>
              <p className="text-xs text-gray-400 truncate">{selectedMeta.description}</p>
            </div>
          </div>

          {selectedPeople.length > SEARCH_THRESHOLD && (
            <div className="relative w-full sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, ID, team…"
                className="w-full pl-8 pr-8 py-2 text-xs font-semibold text-[#2B3674] bg-white border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-[#4318FF]/30 placeholder:text-gray-400"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-3 pb-3 pt-1 flex-1 min-h-0">
          {selectedPeople.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <span
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${selectedMeta.color}1A`, color: selectedMeta.color }}
              >
                <Users size={20} />
              </span>
              <p className="text-sm font-semibold text-[#2B3674]">{selectedMeta.emptyText}</p>
            </div>
          ) : filteredPeople.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              No one matches "{query}".
            </p>
          ) : (
            <div
              key={selected}
              className="animate-fade-in-up grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[236px] overflow-y-auto custom-scrollbar pr-1 pt-1"
              style={{ animationDuration: "0.35s" }}
            >
              {filteredPeople.map((person) => (
                <EmployeeCard
                  key={person.employeeId}
                  person={person}
                  color={selectedMeta.color}
                  onOpen={() => navigate(`${basePath}/employee-details/${person.employeeId}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default TodaySnapshotCard;
