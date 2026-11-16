import { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import dayjs from "dayjs";
import {
  CalendarDays,
  Loader2,
  Sparkles,
  Clock,
  PartyPopper,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../hooks";

import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import { MasterHoliday } from "../types/masterHoliday.types";

const YEAR_OPTIONS = [2025, 2026, 2027, 2028, 2029, 2030];

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const dateKey = (value?: string) => {
  const raw = String(value || "");
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
};

const YearHoliday = () => {
  const dispatch = useAppDispatch();
  const currentYear = dayjs().year();

  const { holidays, loading } = useAppSelector(
    (state) =>
      state.masterHolidays || {
        holidays: [],
        loading: false,
      },
  );

  const [year, setYear] = useState(
    YEAR_OPTIONS.includes(currentYear) ? currentYear : YEAR_OPTIONS[0],
  );

  useEffect(() => {
    dispatch(fetchHolidays(year));
  }, [dispatch, year]);

  const rows = useMemo(() => {
    return (holidays || [])
      .map((holiday: MasterHoliday) => ({
        ...holiday,
        dateValue: dateKey(holiday.date),
      }))
      .filter((holiday) => holiday.dateValue.startsWith(String(year)))
      .sort((a, b) => a.dateValue.localeCompare(b.dateValue));
  }, [holidays, year]);

  const today = dayjs().startOf("day");

  const nextHoliday = useMemo(() => {
    return (
      rows.find(
        (h) => h.dateValue && !dayjs(h.dateValue).startOf("day").isBefore(today),
      ) || null
    );
  }, [rows, today]);

  const remainingCount = useMemo(() => {
    return rows.filter(
      (h) => h.dateValue && !dayjs(h.dateValue).startOf("day").isBefore(today),
    ).length;
  }, [rows, today]);

  const byMonth = useMemo(() => {
    const counts = Array.from({ length: 12 }, () => 0);
    rows.forEach((h) => {
      if (!h.dateValue) return;
      const m = dayjs(h.dateValue).month();
      counts[m] += 1;
    });
    return counts;
  }, [rows]);

  const daysUntilNext = nextHoliday?.dateValue
    ? dayjs(nextHoliday.dateValue).startOf("day").diff(today, "day")
    : null;

  return (
    <div className="p-4 md:p-6 bg-[#F4F7FE] font-sans min-h-full space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7551FF] to-[#4318FF] text-white shadow-lg shadow-[#4318FF]/30">
            <CalendarDays size={22} strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1B2559]">
              Holidays
            </h1>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-2xl bg-white px-3 py-2 ring-1 ring-[#E0E5F2] shadow-sm">
          <label
            className="text-[11px] font-black uppercase tracking-wider text-[#707EAE]"
            htmlFor="holiday-year"
          >
            Year
          </label>
          <Select
            id="holiday-year"
            value={year}
            onChange={(value) => setYear(value)}
            className="h-8 w-[100px]"
            popupMatchSelectWidth={120}
            options={YEAR_OPTIONS.map((option) => ({
              value: option,
              label: String(option),
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
        {/* Table */}
        <div className="bg-white rounded-3xl shadow-[0_18px_40px_-16px_rgba(67,24,255,0.15)] border border-white/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base border-separate border-spacing-0">
              <thead>
                <tr className="bg-gradient-to-r from-[#5B2EFF] to-[#4318FF] text-white">
                  <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-wider w-[80px]">
                    SL No
                  </th>
                  <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-wider w-[180px]">
                    Date
                  </th>
                  <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-wider">
                    Holiday
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-16 text-center text-[#A3AED0] font-semibold"
                    >
                      <Loader2
                        className="inline animate-spin mr-2 text-[#4318FF]"
                        size={18}
                      />
                      Loading holidays...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-3">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F7FE] text-[#4318FF] ring-1 ring-[#4318FF]/10">
                          <CalendarDays size={24} />
                        </span>
                        <p className="text-sm font-semibold text-[#707EAE]">
                          No holidays found for {year}.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((holiday, index) => {
                    const isPast =
                      holiday.dateValue &&
                      dayjs(holiday.dateValue).startOf("day").isBefore(today);
                    const isNext =
                      nextHoliday && holiday.id === nextHoliday.id;
                    return (
                      <tr
                        key={holiday.id}
                        className={`border-b border-[#F4F7FE] last:border-0 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                        } ${isNext ? "bg-[#EEF2FF]/80" : "hover:bg-[#F1F4FF]"}`}
                      >
                        <td
                          className={`px-5 py-4 align-middle font-bold ${
                            isPast ? "text-[#707EAE]" : "text-[#475569]"
                          }`}
                        >
                          {index + 1}
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                              isPast
                                ? "bg-[#F4F7FE] text-[#707EAE] ring-[#E0E5F2]"
                                : "bg-[#F4F7FE] text-[#4318FF] ring-[#4318FF]/10"
                            }`}
                          >
                            {holiday.dateValue
                              ? dayjs(holiday.dateValue).format("DD MMM YYYY")
                              : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <span
                            className={`font-bold ${
                              isPast ? "text-[#707EAE]" : "text-[#2B3674]"
                            }`}
                          >
                            {holiday.name}
                          </span>
                          {isNext && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-[#4318FF] px-2 py-0.5 text-[10px] font-bold text-white">
                              Next
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right summary — fills empty space */}
        <div className="flex flex-col gap-4 xl:sticky xl:top-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5B2EFF] via-[#6D3BFF] to-[#9A4DFF] p-5 text-white shadow-[0_18px_40px_-14px_rgba(91,46,255,0.55)]">
            <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-amber-200/40 blur-md" />
            <div className="relative flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-wider">
              <PartyPopper size={14} />
              This year
            </div>
            <p className="relative mt-3 text-4xl font-black tracking-tight">
              {rows.length}
            </p>
            <p className="relative mt-1 text-sm font-medium text-white/75">
              holiday{rows.length === 1 ? "" : "s"} in {year}
            </p>
            <div className="relative mt-4 flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-2.5 ring-1 ring-white/20 backdrop-blur-sm">
              <Clock size={16} className="shrink-0 text-white/90" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  Remaining
                </p>
                <p className="text-sm font-bold truncate">
                  {year === currentYear
                    ? `${remainingCount} left this year`
                    : year > currentYear
                      ? "All upcoming"
                      : "Year completed"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-[0_18px_40px_-16px_rgba(67,24,255,0.15)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F7FE] text-[#4318FF] ring-1 ring-[#4318FF]/10">
                <Sparkles size={16} />
              </span>
              <div>
                <h3 className="text-sm font-black text-[#1B2559]">
                  Next holiday
                </h3>
                <p className="text-[11px] font-medium text-[#A3AED0]">
                  Coming up on the calendar
                </p>
              </div>
            </div>
            {nextHoliday ? (
              <div className="rounded-2xl bg-[#F4F7FE] p-4 ring-1 ring-[#E0E5F2]">
                <p className="text-base font-black text-[#1B2559]">
                  {nextHoliday.name}
                </p>
                <p className="mt-1 text-sm font-bold text-[#4318FF]">
                  {dayjs(nextHoliday.dateValue).format("ddd, DD MMM YYYY")}
                </p>
                {daysUntilNext != null && (
                  <p className="mt-2 text-xs font-semibold text-[#707EAE]">
                    {daysUntilNext === 0
                      ? "Today"
                      : daysUntilNext === 1
                        ? "Tomorrow"
                        : `In ${daysUntilNext} days`}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm font-semibold text-[#A3AED0]">
                {rows.length === 0
                  ? "No holidays listed for this year."
                  : "No upcoming holidays left this year."}
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-[0_18px_40px_-16px_rgba(67,24,255,0.15)]">
            <h3 className="text-sm font-black text-[#1B2559] mb-3">
              By month
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {MONTH_LABELS.map((label, i) => {
                const count = byMonth[i];
                return (
                  <div
                    key={label}
                    className={`rounded-xl px-1.5 py-2 text-center ring-1 ${
                      count > 0
                        ? "bg-[#EEF2FF] text-[#4318FF] ring-[#4318FF]/15"
                        : "bg-[#F8F9FC] text-[#A3AED0] ring-[#E0E5F2]"
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="text-sm font-black">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearHoliday;
