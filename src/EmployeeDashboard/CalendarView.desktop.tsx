import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, ShieldBan } from "lucide-react";
import { AttendanceStatus } from "../enums";
import type { TimesheetEntry } from "../types";
import type { CalendarViewRenderProps } from "./CalendarView";
import "./CalendarView.desktop.css";
import {
  CALENDAR_LEGEND_ITEMS,
  calendarEntryIsClientVisit,
  calendarEntryIsWFH,
  getShortStatus,
  getStatusStyles,
  isWorkLoc,
} from "./CalendarView.enums";

type CalendarDayCellProps = CalendarViewRenderProps & {
  day: number;
  compact?: boolean;
};

const getCalendarDayState = (
  props: CalendarDayCellProps,
): {
  entry: TimesheetEntry | undefined;
  holiday: any;
  isBlocked: boolean;
  blockedReason: string | null;
  isToday: boolean;
  isSunday: boolean;
  isSaturdayWithNoData: boolean | TimesheetEntry | undefined;
  isIncomplete: boolean | TimesheetEntry | undefined;
  isSplitDay: boolean;
  cellClass: string;
  statusLabel: string;
} => {
  const { day, displayDate, entries, now } = props;
  const entry = entries.find((item) => item.date === day);
  const cellDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
  const holiday = props.checkIsHoliday(displayDate.getFullYear(), displayDate.getMonth(), day);
  const isToday =
    day === now.getDate() &&
    displayDate.getMonth() === now.getMonth() &&
    displayDate.getFullYear() === now.getFullYear();
  const isBlocked = props.isDateBlocked(cellDate);
  const blockedReason = isBlocked ? props.getBlockedReason(cellDate) : "";
  const dayOfWeek = cellDate.getDay();
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;
  const isSaturdayWithNoData =
    isSaturday &&
    entry &&
    !entry.workLocation &&
    (entry.status === AttendanceStatus.WEEKEND ||
      entry.status === AttendanceStatus.PENDING ||
      entry.status === AttendanceStatus.NOT_UPDATED ||
      !entry.status);
  const isIncomplete =
    entry &&
    !entry.isFuture &&
    !entry.isToday &&
    !entry.isWeekend &&
    !holiday &&
    !entry.totalHours &&
    entry.status !== AttendanceStatus.LEAVE &&
    entry.status !== AttendanceStatus.ABSENT &&
    !calendarEntryIsWFH(entry) &&
    !calendarEntryIsClientVisit(entry);
  const isSplitDay =
    !!(entry as any)?.firstHalf &&
    !!(entry as any)?.secondHalf &&
    (entry as any).firstHalf !== (entry as any).secondHalf &&
    !(
      ((isSunday || !!holiday) && Number(entry?.totalHours || 0) >= 1) ||
      (isSaturday && Number(entry?.totalHours || 0) >= 4)
    );

  const baseHover = "hover:shadow-md hover:-translate-y-1 transition-all duration-300";
  let cellClass = `bg-white border-gray-200 ${baseHover}`;
  let statusLabel = entry?.status || "-";

  if (isToday) {
    cellClass = `bg-white ring-2 ring-[#4318FF] shadow-lg shadow-blue-200 z-10 ${baseHover}`;
    if (statusLabel === "-" || !statusLabel || statusLabel === AttendanceStatus.PENDING) {
      statusLabel = isSunday || (isSaturdayWithNoData && entry && !entry.workLocation) ? "WEEKEND" : "";
    }
  } else if ((entry?.status as any) === AttendanceStatus.ABSENT) {
    cellClass = `bg-red-50 border-transparent hover:bg-red-100 ${baseHover}`;
    statusLabel = "ABSENT";
  } else if (holiday) {
    cellClass = `bg-blue-50 border-transparent hover:bg-blue-100 ${baseHover}`;
    statusLabel = holiday.name || "HOLIDAY";
  } else if (isSunday || isSaturdayWithNoData) {
    cellClass = `bg-red-50 border-transparent text-red-600 hover:bg-red-100 ${baseHover}`;
    statusLabel = "WEEKEND";
  } else if (entry && Number(entry.totalHours) > 0 && entry.status !== AttendanceStatus.LEAVE) {
    const h = Number(entry.totalHours);
    const isNonWorkingFull =
      ((isSunday || !!holiday) && h >= 1 && h <= 9) || (isSaturday && h >= 4 && h <= 9);
    if (h > 6 || isNonWorkingFull) {
      cellClass = `bg-emerald-50 border-transparent hover:bg-emerald-100 ${baseHover}`;
      statusLabel = AttendanceStatus.FULL_DAY;
    } else {
      cellClass = `bg-amber-100 border-amber-300 hover:bg-amber-200 ${baseHover}`;
      statusLabel = AttendanceStatus.HALF_DAY;
    }
  } else if (isSplitDay) {
    cellClass = `bg-white border-transparent ${baseHover}`;
  } else if (entry?.status === AttendanceStatus.FULL_DAY) {
    cellClass = `bg-emerald-50 border-transparent hover:bg-emerald-100 ${baseHover}`;
    if (holiday && entry && Number(entry.totalHours) > 0) {
      statusLabel = AttendanceStatus.FULL_DAY;
    } else if (!entry?.totalHours || Number(entry.totalHours) === 0) {
      statusLabel = "";
    }
  } else if (entry?.status === AttendanceStatus.HALF_DAY) {
    cellClass = `bg-amber-100 border-amber-300 hover:bg-amber-200 ${baseHover}`;
    if (holiday && entry && Number(entry.totalHours) > 0) {
      statusLabel = AttendanceStatus.HALF_DAY;
    } else if (!entry?.totalHours || Number(entry.totalHours) === 0) {
      statusLabel = "";
    }
  } else if (entry?.status === AttendanceStatus.LEAVE) {
    cellClass = `bg-red-50 border-transparent hover:bg-red-100 ${baseHover}`;
    statusLabel = AttendanceStatus.LEAVE;
  } else if (calendarEntryIsClientVisit(entry)) {
    cellClass = `bg-blue-50 border-transparent hover:bg-blue-100 ${baseHover}`;
    statusLabel = entry?.workLocation || entry?.status || "Client Visit";
  } else if (calendarEntryIsWFH(entry)) {
    cellClass = `bg-blue-50 border-transparent hover:bg-blue-100 ${baseHover}`;
    statusLabel = entry?.workLocation || entry?.status || AttendanceStatus.WFH;
  } else if (isIncomplete) {
    cellClass = `bg-white border-gray-300 hover:bg-gray-50 ${baseHover}`;
    if (!entry?.totalHours || Number(entry.totalHours) === 0) {
      statusLabel = AttendanceStatus.NOT_UPDATED;
    }
  } else if (entry?.isFuture) {
    cellClass = `bg-white border-gray-300 hover:bg-gray-50 ${baseHover}`;
    statusLabel = AttendanceStatus.UPCOMING;
  }

  if (isBlocked) cellClass += " cursor-not-allowed";

  return {
    entry,
    holiday,
    isBlocked,
    blockedReason,
    isToday,
    isSunday,
    isSaturdayWithNoData,
    isIncomplete,
    isSplitDay,
    cellClass,
    statusLabel,
  };
};

export const CalendarDayCell = (props: CalendarDayCellProps) => {
  const { day, compact = false } = props;
  const state = getCalendarDayState(props);
  const {
    entry,
    holiday,
    isBlocked,
    blockedReason,
    isToday,
    isSunday,
    isSaturdayWithNoData,
    isIncomplete,
    isSplitDay,
    cellClass,
    statusLabel,
  } = state;
  const firstHalf = (entry as any)?.firstHalf;
  const secondHalf = (entry as any)?.secondHalf;

  const labelClass =
    (entry?.status as any) === AttendanceStatus.ABSENT
      ? "text-white bg-[#EE5D50]/70"
      : holiday
        ? "text-white bg-[#1890FF]/70"
        : isSunday
          ? "text-white bg-red-400/70"
          : isSplitDay
            ? isWorkLoc(firstHalf) && isWorkLoc(secondHalf)
              ? "text-white bg-[#01B574]"
              : "text-white bg-[#FFB020]/80"
            : entry?.status === AttendanceStatus.FULL_DAY && statusLabel
              ? "text-white bg-[#01B574]"
              : entry?.status === AttendanceStatus.HALF_DAY && statusLabel
                ? "text-white bg-[#FFB020]/80"
                : entry?.status === AttendanceStatus.LEAVE
                  ? "text-white bg-red-400/70"
                  : calendarEntryIsClientVisit(entry) || calendarEntryIsWFH(entry)
                    ? "text-white bg-[#4318FF]/70"
                    : isIncomplete && statusLabel
                      ? "text-white bg-[#64748B]/90"
                      : entry?.isWeekend
                        ? "text-white bg-red-400/70"
                        : "text-white bg-[#64748B]/90";

  const labelText =
    (entry?.status as any) === AttendanceStatus.ABSENT
      ? "ABSENT"
      : holiday
        ? holiday.name || "HOLIDAY"
        : isSunday || (isSaturdayWithNoData && !entry?.workLocation)
          ? "WEEKEND"
          : isSplitDay
            ? isWorkLoc(firstHalf) && isWorkLoc(secondHalf)
              ? "FULL DAY"
              : `${(isWorkLoc(firstHalf) ? firstHalf : secondHalf)?.toUpperCase()} (HALF DAY)`
            : (entry?.status as string) === AttendanceStatus.LEAVE
              ? "LEAVE"
              : (entry?.status as string) === AttendanceStatus.FULL_DAY
                ? `${(entry?.workLocation || "OFFICE")
                    .replace(/\(FULL DAY\)/i, "")
                    .trim()
                    .toUpperCase()} (FULL DAY)`
                : entry?.workLocation &&
                    (entry?.status as string) !== AttendanceStatus.LEAVE &&
                    (entry?.status as string) !== AttendanceStatus.FULL_DAY
                  ? entry.workLocation
                  : isIncomplete && !statusLabel
                    ? AttendanceStatus.NOT_UPDATED
                    : statusLabel;

  return (
    <div
      onClick={() => props.handleDayClick(day, isBlocked)}
      className={`calendar-view__day relative flex flex-col items-start justify-between rounded-2xl border cursor-pointer group overflow-hidden ${cellClass} ${compact ? "p-1.5" : "p-2"}`}
      title={isBlocked ? `Blocked by Admin: ${blockedReason}` : ""}
    >
      {isSplitDay ? (
        <div className="absolute inset-0 z-0 rounded-2xl flex flex-col sm:flex-row overflow-hidden">
          {isWorkLoc(firstHalf) && isWorkLoc(secondHalf) ? (
            <>
              <div className="flex-1 bg-[#E6FFFA] border-b sm:border-b-0 sm:border-r border-[#01B574]/20" />
              <div className="flex-1 bg-[#E6FFFA]" />
            </>
          ) : (
            <>
              <div className={`flex-1 ${getStatusStyles(firstHalf).bg}`} />
              <div className={`flex-1 ${getStatusStyles(secondHalf).bg}`} />
            </>
          )}
        </div>
      ) : null}

      <span
        className={`${compact ? "text-xs w-5 h-5" : "text-sm w-6 h-6"} font-bold text-black mb-2 flex items-center justify-center rounded-full z-10 transition-colors duration-300 ${
          isToday ? "bg-[#4318FF] text-white" : "group-hover:bg-[#4318FF] group-hover:text-white"
        }`}
      >
        {day}
      </span>

      {isBlocked && entry?.status !== AttendanceStatus.ABSENT && (
        <div className="absolute top-2 right-2 z-10 transition-transform hover:scale-110">
          <ShieldBan size={compact ? 12 : 14} className="text-red-500 drop-shadow-sm" strokeWidth={2.5} />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
        {isSplitDay && (
          <div className="flex gap-1.5 w-full mb-1 px-1">
            <div className={`flex-1 py-1 rounded-md text-center text-[8px] font-bold uppercase shadow-sm ${getStatusStyles(firstHalf).badge}`}>
              {getShortStatus(firstHalf)}
            </div>
            <div className={`flex-1 py-1 rounded-md text-center text-[8px] font-bold uppercase shadow-sm ${getStatusStyles(secondHalf).badge}`}>
              {getShortStatus(secondHalf)}
            </div>
          </div>
        )}

        {entry?.totalHours || entry?.totalHours === 0 ? (
          <div className="text-center">
            <span className={`${compact ? "text-lg" : "text-2xl"} font-medium text-gray-800 leading-none`}>
              {entry.totalHours || entry.totalHours === 0 ? entry.totalHours : "-"}
            </span>
            <span className="block text-[8px] font-bold text-black uppercase">hrs</span>
          </div>
        ) : (
          <div className={`h-1 w-8 rounded-full ${holiday ? "bg-[#00A3C4]/20" : isBlocked ? "bg-gray-300" : "bg-gray-100"}`} />
        )}
      </div>

      <div className={`calendar-view__status-label truncate w-full text-center px-1 py-1 rounded-md mt-1 backdrop-blur-sm z-10 ${labelClass}`}>
        {labelText}
      </div>

      {isIncomplete && (
        <div className="absolute top-2 right-2 w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center shadow-sm animate-pulse">
          <span className="text-white text-[10px] font-bold">!</span>
        </div>
      )}
    </div>
  );
};

export const CalendarGrid = (props: CalendarViewRenderProps & { compact?: boolean }) => (
  <div className={`flex flex-col relative ${props.scrollable ? "flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0 calendar-view__scroll" : ""}`}>
    <div className={`calendar-view__weekday-grid ${props.compact ? "gap-1" : "gap-3"}`}>
      {props.daysOfWeek.map((day) => (
        <div key={day} className={`${props.compact ? "text-[8px] mb-1" : "text-[10px] py-2"} text-center font-black text-gray-700 uppercase tracking-wide`}>
          {day}
        </div>
      ))}
    </div>

    <div className={`calendar-view__grid pb-2 mt-2 flex-1 ${props.compact ? "gap-1" : "gap-3"}`}>
      {props.blanks.map((blank) => (
        <div key={`blank-${blank}`} className="calendar-view__blank min-h-[40px] md:min-h-[80px]" />
      ))}
      {props.monthDays.map((day) => (
        <CalendarDayCell key={day} {...props} day={day} compact={props.compact} />
      ))}
    </div>
  </div>
);

const CalendarViewDesktop = (props: CalendarViewRenderProps) => (
  <div className={`calendar-view calendar-view--desktop flex flex-col ${props.scrollable ? "h-full flex-1 min-h-0" : ""}`}>
    {!props.hideBackButton && (
      <button onClick={props.handleBack} className="group flex items-center gap-2 text-[#A3AED0] hover:text-[#4318FF] transition-all mb-2 w-fit">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[11px] font-black uppercase tracking-widest pl-1">Back</span>
      </button>
    )}

    <div className={`calendar-view__surface calendar-view__surface--desktop ${props.scrollable ? "flex-1 h-full overflow-hidden" : ""}`}>
      <div className="calendar-view__desktop-header flex flex-wrap items-center justify-between gap-y-4 gap-x-2 mb-6">
        <div className="flex items-center gap-3 min-w-fit">
          <div className="p-2 rounded-lg bg-[#4318FF]/10">
            <CalendarIcon className="w-6 h-6 text-[#4318FF]" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-[#2B3674] tracking-tight leading-tight">
            Monthly Attendance Snapshot
          </h3>
        </div>

        <div className="flex items-center gap-2 md:gap-3 ml-auto sm:ml-0">
          <button onClick={props.handleDownload} className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-[#4318FF] text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 text-xs font-bold tracking-wide uppercase group" title="Download Monthly Report">
            <Download size={16} strokeWidth={2.5} className="group-hover:animate-bounce" />
            <span>Download Report</span>
          </button>
          <button onClick={props.handleDownload} className="md:hidden flex p-2.5 bg-[#4318FF] text-white rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all" title="Download Monthly Report">
            <Download size={18} strokeWidth={2.5} />
          </button>

          {!props.hideMonthNavigation && (
            <div className="flex items-center gap-1 bg-[#F4F7FE] p-1 rounded-xl border border-transparent hover:border-gray-200 transition-colors">
              <button onClick={props.handlePrevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-[#A3AED0] hover:text-[#4318FF] active:scale-90">
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <span className="text-sm font-extrabold min-w-[120px] md:min-w-[140px] text-[#2B3674] text-center select-none">
                {props.currentMonthName}
              </span>
              <button onClick={props.handleNextMonth} disabled={!props.canNavigateToNextMonth} className={`p-1.5 rounded-lg transition-all active:scale-90 ${!props.canNavigateToNextMonth ? "text-gray-300 cursor-not-allowed" : "text-[#A3AED0] hover:text-[#4318FF] hover:bg-white hover:shadow-sm"}`}>
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-x-6 gap-y-2 flex-wrap mb-4 overflow-x-auto pb-2 scrollbar-none">
        {CALENDAR_LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs font-bold text-gray-600 whitespace-nowrap">
            <div className={`w-3 h-3 rounded-full ${item.color} border ${item.border}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <CalendarGrid {...props} />
    </div>
  </div>
);

export default CalendarViewDesktop;
