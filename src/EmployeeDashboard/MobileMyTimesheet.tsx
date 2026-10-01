import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Lock,
  Rocket,
  X,
} from "lucide-react";

import { TimesheetEntry } from "../types";
import { TimesheetBlocker } from "../reducers/timesheetBlocker.reducer";
import { AttendanceStatus } from "../enums";
import trackProductiveIllustration from "../assets/track_productive_illustration.png";

interface MobileMyTimesheetProps {
  entries?: TimesheetEntry[];
  now?: Date;
  today?: Date;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  currentWeekEntries?: { entry: TimesheetEntry; originalIndex: number }[];
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onHoursInput: (
    index: number,
    value: string,
    immediate?: boolean,
  ) => TimesheetEntry[] | undefined | void;
  onSave: (overrideEntries?: TimesheetEntry[]) => void;
  onAutoUpdate?: () => void;
  isViewedMonthEligible?: boolean;
  monthTotalHours: number;
  currentMonthName: string;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isManagerView: boolean;
  readOnly: boolean;
  blockers: TimesheetBlocker[];
  isDateBlocked: (date: Date) => boolean;
  isEditableMonth: (date: Date) => boolean;
  isHoliday: (date: Date) => boolean;
  onBlockedClick?: () => void;
  department?: string;
  localInputValues: Record<number, string>;
  onInputBlur: (index: number) => void;
  selectedDateId: number | null;
  isHighlighted: boolean;
  containerClassName?: string;
}

const MobileMyTimesheet: React.FC<MobileMyTimesheetProps> = ({
  entries = [],
  now = new Date(),
  today = new Date(),
  onPrevMonth,
  onNextMonth,
  currentWeekEntries: _currentWeekEntries,
  onPrevWeek,
  onNextWeek,
  onHoursInput,
  onSave,
  onAutoUpdate,
  isViewedMonthEligible = true,
  monthTotalHours,
  loading,
  isAdmin,
  isManager,
  readOnly,
  blockers,
  isEditableMonth,
  isHoliday,
  isDateBlocked,
  onBlockedClick,
  localInputValues,
  onInputBlur,
  selectedDateId,
  isHighlighted,
  containerClassName,
}) => {
  const currentNow = now || new Date();
  const realToday = today || new Date();

  // Modal State for Log Hours
  const [logModalState, setLogModalState] = useState<{
    isOpen: boolean;
    entry: TimesheetEntry | null;
    originalIndex: number;
    hours: string;
  }>({
    isOpen: false,
    entry: null,
    originalIndex: -1,
    hours: "9",
  });

  const handleOpenLogModal = (entry: TimesheetEntry, originalIndex: number) => {
    const currentVal =
      localInputValues[originalIndex] !== undefined
        ? localInputValues[originalIndex]
        : entry.totalHours != null && entry.totalHours > 0
        ? String(entry.totalHours)
        : "9";

    setLogModalState({
      isOpen: true,
      entry,
      originalIndex,
      hours: currentVal,
    });
  };

  const handleCloseLogModal = () => {
    setLogModalState({
      isOpen: false,
      entry: null,
      originalIndex: -1,
      hours: "9",
    });
  };

  const handleModalSubmit = () => {
    if (logModalState.originalIndex === -1 || !logModalState.entry) return;

    const hoursToSave = logModalState.hours.trim();
    const updatedEntries = onHoursInput(
      logModalState.originalIndex,
      hoursToSave,
      true,
    );
    onInputBlur(logModalState.originalIndex);

    handleCloseLogModal();

    if (Array.isArray(updatedEntries)) {
      onSave(updatedEntries);
    } else {
      onSave();
    }
  };

  // 1. Prepare full month days
  const { allEntries, blanks } = useMemo(() => {
    const year = currentNow.getFullYear();
    const month = currentNow.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const blanksArr = Array.from({ length: firstDayIndex }, (_, i) => i);

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Map each day 1..daysInMonth
    const list: { entry: TimesheetEntry; originalIndex: number }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const foundIdx = entries.findIndex((e) => e.date === day);
      if (foundIdx !== -1) {
        list.push({ entry: entries[foundIdx], originalIndex: foundIdx });
      } else {
        const fullDate = new Date(year, month, day);
        const dayOfWeek = fullDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        list.push({
          entry: {
            date: day,
            fullDate,
            totalHours: 0,
            status: isWeekend ? AttendanceStatus.WEEKEND : AttendanceStatus.NOT_UPDATED,
            isWeekend,
            isToday:
              day === realToday.getDate() &&
              month === realToday.getMonth() &&
              year === realToday.getFullYear(),
            isFuture: fullDate > realToday,
          } as unknown as TimesheetEntry,
          originalIndex: day - 1,
        });
      }
    }

    return { allEntries: list, blanks: blanksArr };
  }, [currentNow, entries, realToday]);

  const hasManualEdits = Object.keys(localInputValues).length > 0;

  return (
    <div
      className={
        containerClassName ||
        "flex flex-col w-full min-h-screen bg-[#E8F4FD] px-3 py-2 pb-16 relative"
      }
    >
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#4318FF]"></div>
        </div>
      )}

      {/* Top Header Card (Matching Reference Design) */}
      <div className="bg-white rounded-2xl px-3 py-2.5 shadow-sm border border-gray-100 flex items-center justify-between mb-3">
        {/* Left: Particular Month with Previous & Next Month Arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth || onPrevWeek}
            disabled={loading}
            className="p-1 text-[#4318FF] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft size={18} strokeWidth={2.6} />
          </button>
          <span
            className="text-xs sm:text-sm font-bold text-[#1B2559] select-none whitespace-nowrap px-1"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {dayjs(currentNow).format("MMM YYYY")}
          </span>
          <button
            onClick={onNextMonth || onNextWeek}
            disabled={
              loading ||
              currentNow.getFullYear() > realToday.getFullYear() ||
              (currentNow.getFullYear() === realToday.getFullYear() &&
                currentNow.getMonth() >= realToday.getMonth())
            }
            className={`p-1 text-[#4318FF] rounded-lg transition-colors ${
              loading ||
              currentNow.getFullYear() > realToday.getFullYear() ||
              (currentNow.getFullYear() === realToday.getFullYear() &&
                currentNow.getMonth() >= realToday.getMonth())
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-blue-50 cursor-pointer"
            }`}
            title="Next Month"
          >
            <ChevronRight size={18} strokeWidth={2.6} />
          </button>
        </div>

        {/* Right: Total Hours with Auto Fill Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1 select-none">
            <span className="text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-tight whitespace-nowrap">
              TOTAL TRACKED:
            </span>
            <span className="text-xs sm:text-sm font-black text-[#4318FF] whitespace-nowrap">
              {(Number(monthTotalHours) || 0).toFixed(1)}{" "}
              <span className="text-[9px] font-bold">hrs</span>
            </span>
          </div>

          {onAutoUpdate && (
            <button
              onClick={onAutoUpdate}
              disabled={!isViewedMonthEligible}
              className="flex items-center gap-1.5 bg-[#4318FF] hover:bg-[#320ec4] active:scale-95 text-white px-2.5 py-1.5 rounded-xl shadow-md shadow-blue-500/25 transition-all shrink-0 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              title="Auto Fill Timesheet"
            >
              <div className="flex flex-col text-left leading-none font-black text-[8px] tracking-wider">
                <span>AUTO</span>
                <span>FILL</span>
              </div>
              <Rocket
                size={13}
                strokeWidth={2.4}
                className="shrink-0 animate-pulse fill-white/20"
              />
            </button>
          )}
        </div>
      </div>

      {/* Complete Month Calendar in One Page */}
      <div className="w-full mb-3 py-1">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 mb-2 text-center text-[10px] font-bold text-slate-600 uppercase tracking-tight">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="aspect-[4/5] min-h-[54px]" />
          ))}

          {allEntries.map(({ entry, originalIndex }) => {
            const displayVal = entry.totalHours || 0;
            const inputValue =
              localInputValues[originalIndex] !== undefined
                ? localInputValues[originalIndex]
                : displayVal === 0
                  ? ""
                  : displayVal.toString();

            const isHolidayDate = isHoliday(entry.fullDate);
            const manualBlocker = blockers?.find((b) => {
              const d = new Date(entry.fullDate);
              d.setHours(0, 0, 0, 0);
              const start = new Date(b.blockedFrom);
              start.setHours(0, 0, 0, 0);
              const end = new Date(b.blockedTo);
              end.setHours(0, 0, 0, 0);
              return d >= start && d <= end;
            });

            // Block visually only on manual admin blockers
            const isBlocked = !!manualBlocker;
            const isEditable =
              (isAdmin || !readOnly) &&
              (isAdmin || isEditableMonth(entry.fullDate)) &&
              !manualBlocker &&
              !isDateBlocked(entry.fullDate);

            const dayOfWeek = entry.fullDate.getDay();
            const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
            const hasHours =
              Number(inputValue) > 0 || (entry.totalHours != null && entry.totalHours > 0);

            const isToday =
              entry.isToday ||
              (entry.date === realToday.getDate() &&
                currentNow.getMonth() === realToday.getMonth() &&
                currentNow.getFullYear() === realToday.getFullYear());

            const statusLower = (entry.status || "").toLowerCase().trim();
            const isLeave =
              statusLower === AttendanceStatus.LEAVE.toLowerCase() ||
              statusLower.includes("leave");

            const isAbsent =
              statusLower === AttendanceStatus.ABSENT.toLowerCase() ||
              statusLower.includes("absent");

            const isHalfDay =
              statusLower === AttendanceStatus.HALF_DAY.toLowerCase() ||
              statusLower.includes("half day") ||
              (!!entry.firstHalf &&
                !!entry.secondHalf &&
                entry.firstHalf !== entry.secondHalf);

            const isSplitDay = !isBlocked && isHalfDay;
            const getSplitHalfBg = (val: string | null | undefined, isFirst: boolean) => {
              const s = (val || "").toLowerCase().trim();
              if (s.includes("leave") || s.includes("absent")) {
                return "bg-pink-200";
              }
              if (
                s.includes("office") ||
                s.includes("present") ||
                s.includes("full day") ||
                s.includes("work") ||
                s.includes("wfh") ||
                s.includes("client")
              ) {
                return "bg-sky-100";
              }
              return isFirst ? "bg-sky-100" : "bg-pink-200";
            };

            const firstHalfBg = isSplitDay ? getSplitHalfBg(entry.firstHalf, true) : "";
            const secondHalfBg = isSplitDay ? getSplitHalfBg(entry.secondHalf, false) : "";

            const isWFH =
              statusLower === AttendanceStatus.WFH.toLowerCase() ||
              statusLower.includes("wfh") ||
              statusLower.includes("work from home");

            const isClientVisit =
              statusLower === AttendanceStatus.CLIENT_VISIT.toLowerCase() ||
              statusLower.includes("client");

            const isFullDay =
              hasHours ||
              statusLower === AttendanceStatus.FULL_DAY.toLowerCase() ||
              statusLower === AttendanceStatus.PRESENT.toLowerCase() ||
              statusLower.includes("full day");

            // Cell Styles matching reference design
            let colorClass = "bg-white text-gray-600 border border-gray-200";

            if (isBlocked) {
              colorClass = isToday
                ? "bg-gray-200 border border-gray-400 text-gray-700 font-bold ring-2 ring-[#4318FF]"
                : "bg-gray-200 border border-gray-400 text-gray-700 font-bold";
            } else if (isToday && !hasHours && !isLeave && !isAbsent && !isHolidayDate && !isWeekendDay) {
              colorClass =
                "bg-white ring-2 ring-[#4318FF] text-[#4318FF] border-transparent font-extrabold shadow-md";
            } else if (isSplitDay) {
              colorClass =
                "border border-orange-500 text-orange-500 font-bold" + (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (isFullDay) {
              colorClass =
                "bg-green-100 border border-green-600 text-green-700 font-bold" + (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (isLeave) {
              colorClass =
                "bg-pink-100 border border-pink-400 text-red-600 font-bold" + (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (isAbsent) {
              colorClass =
                "bg-pink-200 border border-pink-500 text-red-600 font-bold" + (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (isWFH) {
              colorClass =
                "bg-indigo-100 border border-indigo-500 text-indigo-700 font-bold" + (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (isClientVisit) {
              colorClass =
                "bg-yellow-100 border border-yellow-500 text-yellow-800 font-bold" + (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (isHolidayDate) {
              colorClass =
                "bg-sky-200 border border-sky-500 text-sky-800 font-bold" + (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (entry.isWeekend || isWeekendDay) {
              colorClass =
                "bg-pink-100 border border-pink-400 text-red-600 font-bold" + (isToday ? " ring-2 ring-[#4318FF]" : "");
            } else if (entry.isFuture) {
              colorClass = "bg-slate-50 border border-slate-200 text-slate-400 font-bold";
            }

            const isDateHighlighted =
              selectedDateId &&
              new Date(selectedDateId).toDateString() ===
                entry.fullDate.toDateString() &&
              isHighlighted;

            const highlightClass = isDateHighlighted
              ? "ring-4 ring-[#4318FF] scale-105 shadow-xl z-20"
              : "";

            const hasBottomContent =
              (hasHours && !isBlocked) ||
              (isHolidayDate && !isBlocked) ||
              ((isLeave || isAbsent) && !isBlocked) ||
              isBlocked ||
              (isSplitDay && !isBlocked) ||
              (isWFH && !isBlocked) ||
              (isClientVisit && !isBlocked) ||
              (isEditable && !isWeekendDay);

            const isClickable = isBlocked || isEditable;

            return (
              <div
                key={originalIndex}
                onClick={() => {
                  if (isBlocked) {
                    if ((isAdmin || isManager) && onBlockedClick) {
                      onBlockedClick();
                    }
                  } else if (isEditable) {
                    handleOpenLogModal(entry, originalIndex);
                  }
                }}
                tabIndex={isClickable ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (isBlocked) {
                      if ((isAdmin || isManager) && onBlockedClick) {
                        onBlockedClick();
                      }
                    } else if (isEditable) {
                      e.preventDefault();
                      handleOpenLogModal(entry, originalIndex);
                    }
                  }
                }}
                className={`
                  aspect-[4/5] sm:aspect-square
                  rounded-2xl relative
                  flex flex-col items-center justify-center
                  shadow-sm transition-all outline-none focus:ring-2 focus:ring-[#4318FF]
                  ${colorClass}
                  ${highlightClass}
                  ${
                    isEditable
                      ? "cursor-pointer hover:shadow-md active:scale-95"
                      : isBlocked
                      ? "cursor-pointer"
                      : "cursor-default"
                  }
                `}
              >
                {/* Background Layer for Split Days */}
                {isSplitDay && (
                  <div className="absolute inset-0 z-0 rounded-2xl overflow-hidden flex flex-col pointer-events-none">
                    <div className={`flex-1 ${firstHalfBg}`} />
                    <div className={`flex-1 ${secondHalfBg}`} />
                  </div>
                )}

                {/* Day Number */}
                <span
                  className={`text-xs sm:text-base font-bold leading-none z-10 select-none ${
                    hasBottomContent ? "-translate-y-2 sm:-translate-y-2.5" : "translate-y-0"
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {entry.date}
                </span>

                {/* Absolute Bottom Content: Hours, Holiday, Leave, or Contact Admin */}
                <div className="absolute bottom-1 sm:bottom-1.5 inset-x-0 flex items-center justify-center z-10 px-0.5 pointer-events-none select-none">
                  {hasHours && !isBlocked && (
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        color: isSplitDay
                          ? "#ea580c"
                          : (Number(inputValue) >= 9 || (Number(inputValue) === 0 && (entry.totalHours || 0) >= 9))
                          ? "#16a34a"
                          : "#d97706",
                      }}
                      className="text-[9.5px] sm:text-[10.5px] font-bold leading-none select-none"
                    >
                      {(() => {
                        const valNum =
                          inputValue !== ""
                            ? parseFloat(inputValue)
                            : (entry.totalHours || 0);
                        return valNum % 1 === 0 ? `${valNum} h` : `${valNum.toFixed(1)} h`;
                      })()}
                    </span>
                  )}

                  {isHolidayDate && !hasHours && !isBlocked && (
                    <span
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      className="text-[8px] sm:text-[9.5px] font-bold leading-none uppercase tracking-tight text-sky-800 select-none"
                    >
                      HOLIDAY
                    </span>
                  )}

                  {(isLeave || isAbsent) && !hasHours && !isBlocked && (
                    <span
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      className="text-[8px] sm:text-[9.5px] font-bold leading-none uppercase tracking-tight text-red-700 select-none"
                    >
                      {isAbsent ? "ABSENT" : "LEAVE"}
                    </span>
                  )}

                  {isBlocked && (
                    <div className="flex flex-col items-center justify-center leading-none px-0.5 select-none">
                      <Lock size={8.5} className="text-gray-600 mb-0.5 shrink-0" strokeWidth={2.4} />
                      <span className="text-[6.5px] sm:text-[7.5px] font-bold text-gray-600 leading-tight uppercase tracking-tighter text-center">
                        {manualBlocker
                          ? (isAdmin || isManager
                            ? "UNBLOCK"
                            : `CONTACT\nADMIN`)
                          : "CONTACT\nADMIN"}
                      </span>
                    </div>
                  )}

                  {isWFH && !hasHours && !isBlocked && (
                    <span
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      className="text-[8px] sm:text-[9.5px] font-bold leading-none uppercase tracking-tight text-indigo-700 select-none"
                    >
                      WFH
                    </span>
                  )}

                  {isClientVisit && !hasHours && !isBlocked && (
                    <span
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      className="text-[7.5px] sm:text-[8.5px] font-bold leading-none uppercase tracking-tight text-yellow-800 select-none"
                    >
                      CLIENT
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-2.5 sm:px-3.5 py-3 mb-4">
        <div className="grid grid-cols-3 gap-x-1 sm:gap-x-2.5 gap-y-2.5 items-center">
          {[
            {
              label: AttendanceStatus.FULL_DAY,
              className: "bg-green-100 border border-green-600",
            },
            {
              label: "HALF DAY LEAVE",
              className: "border border-orange-500 overflow-hidden flex flex-col",
              split: true,
            },
            {
              label: AttendanceStatus.LEAVE,
              className: "bg-pink-100 border border-pink-400",
            },
            {
              label: AttendanceStatus.ABSENT,
              className: "bg-pink-300 border border-pink-500",
            },
            {
              label: AttendanceStatus.WFH,
              className: "bg-indigo-100 border border-indigo-500",
            },
            {
              label: AttendanceStatus.CLIENT_VISIT,
              className: "bg-yellow-100 border border-yellow-500",
            },
            {
              label: "TODAY",
              className: "bg-white border-2 border-[#4318FF]",
            },
            {
              label: AttendanceStatus.HOLIDAY,
              className: "bg-sky-200 border border-sky-500",
            },
            {
              label: AttendanceStatus.WEEKEND,
              className: "bg-pink-100 border border-pink-400",
            },
            {
              label: AttendanceStatus.UPCOMING,
              className: "bg-slate-50 border border-slate-200",
            },
            {
              label: "BLOCKED",
              className: "bg-gray-200 border border-gray-400",
            },
            {
              label: AttendanceStatus.NOT_UPDATED,
              className: "bg-white border border-gray-300",
              icon: true,
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center ${item.className}`}
              >
                {"split" in item && item.split ? (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex-1 bg-sky-100" />
                    <div className="flex-1 bg-pink-200" />
                  </div>
                ) : "icon" in item && item.icon ? (
                  <span className="text-[9px] font-black text-slate-500 leading-none">
                    !
                  </span>
                ) : null}
              </div>
              <span
                className="text-[9px] min-[360px]:text-[9.5px] sm:text-[10px] font-extrabold text-slate-700 uppercase tracking-tight whitespace-nowrap"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
 
      {/* Stay on Track, Stay Productive Banner */}
      <div className="w-full py-2.5 px-2 mb-3 relative overflow-hidden flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left Illustration - Transparent PNG */}
        <div className="relative shrink-0 w-36 min-[360px]:w-40 sm:w-48 flex items-center justify-center z-10 -my-1">
          <img
            src={trackProductiveIllustration}
            alt="Stay on Track, Stay Productive"
            className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-sm"
          />
        </div>

        {/* Right Text Content */}
        <div className="flex-1 flex flex-col justify-center z-10 pr-0.5">
          <h4
            className="text-[12px] min-[360px]:text-[13px] sm:text-base font-extrabold text-[#1B2559] leading-tight select-none"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Stay on Track,<br />
            Stay Productive!
          </h4>
          <p
            className="text-[9.5px] min-[360px]:text-[10px] sm:text-xs text-slate-500 font-medium leading-snug mt-1 select-none"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            View and manage your<br />
            tracked hours effortlessly.
          </p>
        </div>

        {/* Decorative Wave Lines along Bottom */}
        <svg
          className="absolute -bottom-0.5 left-0 right-0 w-full h-7 pointer-events-none opacity-40 text-blue-300"
          viewBox="0 0 400 30"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0 15 Q 100 26, 200 15 T 400 15"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M0 22 Q 100 10, 200 22 T 400 22"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.7"
          />
        </svg>
      </div>

      {/* Log Hours Modal (Matching Design in Reference Screenshot) */}
      {logModalState.isOpen && logModalState.entry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={handleCloseLogModal}
        >
          <div
            className="bg-white w-full max-w-[340px] sm:max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#4318FF] px-6 pt-5 pb-5 text-center text-white relative">
              <div className="text-[11px] sm:text-xs font-black tracking-widest uppercase opacity-90 mb-1 select-none">
                {dayjs(logModalState.entry.fullDate).format("ddd, MMM D").toUpperCase()}
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight select-none">
                Log Hours
              </h3>
              <button
                type="button"
                onClick={handleCloseLogModal}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/15 hover:bg-white/25 active:scale-90 rounded-full p-1.5 transition-all cursor-pointer"
                title="Close"
              >
                <X size={18} strokeWidth={2.6} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 flex flex-col items-center gap-3">
              {/* Status Pill */}
              {(() => {
                const num = parseFloat(logModalState.hours);
                let text = "Full Day - 9h";
                let badgeBg = "bg-[#E8FAF0] text-[#00A389]";
                if (isNaN(num) || num <= 0) {
                  text = "Unlogged - 0h";
                  badgeBg = "bg-slate-100 text-slate-600";
                } else if (num >= 7) {
                  text = `Full Day - ${num % 1 === 0 ? num : num.toFixed(1)}h`;
                  badgeBg = "bg-[#E8FAF0] text-[#00A389]";
                } else {
                  text = `Half Day - ${num % 1 === 0 ? num : num.toFixed(1)}h`;
                  badgeBg = "bg-[#FFF7ED] text-[#EA580C]";
                }
                return (
                  <div
                    className={`w-full py-2.5 px-4 rounded-xl text-center font-bold text-sm select-none ${badgeBg}`}
                  >
                    {text}
                  </div>
                );
              })()}

              {/* Big Hours Input */}
              <div className="w-full">
                <div className="border-2 border-[#4318FF] rounded-2xl py-3 px-4 flex items-center justify-center bg-white shadow-sm focus-within:ring-4 focus-within:ring-[#4318FF]/20 transition-all">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={logModalState.hours}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/h/gi, "");
                      if (clean === "" || /^\d*\.?\d*$/.test(clean)) {
                        const parsed = parseFloat(clean);
                        if (clean === "" || (!isNaN(parsed) && parsed <= 9)) {
                          setLogModalState((prev) => ({ ...prev, hours: clean }));
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleModalSubmit();
                      }
                    }}
                    placeholder="0"
                    className="w-full text-center font-black text-4xl sm:text-5xl text-[#1B2559] bg-transparent outline-none p-0"
                    autoFocus
                  />
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-2 text-center select-none">
                  Enter hours (0 - 9)
                </p>
              </div>

              {/* Quick Select */}
              <div className="w-full mt-1">
                <p className="text-xs font-bold text-slate-400 mb-2 text-center select-none">
                  Quick Select
                </p>
                <div className="grid grid-cols-5 gap-2 w-full">
                  {["4", "5", "6", "7.5", "9"].map((val) => {
                    const isSelected =
                      logModalState.hours === val ||
                      parseFloat(logModalState.hours) === parseFloat(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() =>
                          setLogModalState((prev) => ({ ...prev, hours: val }))
                        }
                        className={`py-2 rounded-xl font-black text-base sm:text-lg transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-[#4318FF] text-white shadow-md shadow-blue-500/30 scale-102"
                            : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full mt-3">
                <button
                  type="button"
                  onClick={handleCloseLogModal}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-sm sm:text-base transition-all cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleModalSubmit}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#4318FF] hover:bg-[#320ec4] active:scale-98 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all cursor-pointer select-none"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMyTimesheet;
