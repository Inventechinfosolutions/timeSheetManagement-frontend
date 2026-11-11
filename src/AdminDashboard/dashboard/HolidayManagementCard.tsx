import { useMemo } from "react";
import dayjs from "dayjs";
import { CalendarDays, ChevronRight } from "lucide-react";

interface HolidayRow {
  date?: string;
  name?: string;
}

interface Props {
  holidays: HolidayRow[];
  onOpen: () => void;
}

const dateKey = (value?: string) => {
  const raw = String(value || "");
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
};

const HolidayManagementCard = ({ holidays, onOpen }: Props) => {
  const year = dayjs().year();

  const { count, upcoming } = useMemo(() => {
    const today = dayjs().format("YYYY-MM-DD");
    const thisYear = (holidays || [])
      .map((holiday) => ({
        date: dateKey(holiday.date),
        name: holiday.name || "Holiday",
      }))
      .filter((holiday) => holiday.date.startsWith(String(year)))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      count: thisYear.length,
      upcoming: thisYear.filter((holiday) => holiday.date >= today).slice(0, 5),
    };
  }, [holidays, year]);

  return (
    <div className="bg-white rounded-2xl shadow-[0px_8px_24px_rgba(112,144,176,0.1)] border border-gray-100/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#1055E8] flex items-center justify-center">
            <CalendarDays size={18} strokeWidth={2.2} />
          </span>
          <div>
            <h3 className="text-lg font-bold text-[#2B3674] leading-tight">Holiday Management</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {count} holiday{count === 1 ? "" : "s"} in {year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpen}
            className="cursor-pointer text-[11px] font-black px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#1055E8]"
          >
            {year}
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="cursor-pointer flex items-center gap-1 text-xs font-bold text-[#4318FF] hover:underline"
          >
            Open <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {upcoming.length === 0 ? (
        <div className="px-5 py-6 text-sm text-gray-400">No upcoming holidays in {year}</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {upcoming.map((holiday) => (
            <button
              key={`${holiday.date}-${holiday.name}`}
              type="button"
              onClick={onOpen}
              className="cursor-pointer w-full px-5 py-3 flex items-center justify-between gap-3 text-left hover:bg-[#F4F7FE]/60 transition-colors"
            >
              <span className="text-sm font-bold text-[#2B3674] truncate">{holiday.name}</span>
              <span className="text-xs font-semibold text-[#A3AED0] shrink-0">
                {dayjs(holiday.date).format("DD MMM")}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="px-5 py-2.5 bg-[#EEF2FF] text-[11px] font-semibold text-[#1E40AF]">
        Save and update company holidays used by timesheet and leave.
      </div>
    </div>
  );
};

export default HolidayManagementCard;
