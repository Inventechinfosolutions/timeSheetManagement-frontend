import { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Lock, Rocket } from "lucide-react";
import { AttendanceStatus } from "../../enums";
import AutoUpdateModal from "../AutoUpdateModal";
import AutoUpdateSuccessModal from "../AutoUpdateSuccessModal";
import {
  MobileHoliday,
  MobileTimesheetInputModalState,
  MobileTimesheetPreview,
  MobileTimesheetProps,
} from "./mobileTimesheet.types";
import {
  MobileTimesheetDayTone,
} from "./mobileTimesheet.enums";
import "./MobileTimesheet.css";

interface ExtendedInputModalState extends Omit<
  MobileTimesheetInputModalState,
  "entry"
> {
  entry:
  | (MobileTimesheetInputModalState["entry"] & {
    isBlockedHalfDay?: boolean;
    isBlockedHalfLeave?: boolean;
    isBlockedFullDayContext?: boolean;
    fullDayDisplayLabel?: string;
    firstHalf?: string;
    secondHalf?: string;
  })
  | null;
}

const emptyInputModal: ExtendedInputModalState = {
  open: false,
  index: null,
  value: "",
  entry: null,
};

const getHolidayForDate = (
  date: Date,
  holidays: MobileHoliday[] | undefined,
) => {
  const dateKey = dayjs(date).format("YYYY-MM-DD");
  return holidays?.find((holiday) => {
    const holidayDate = holiday.holidayDate || holiday.date;
    return holidayDate && dayjs(holidayDate).format("YYYY-MM-DD") === dateKey;
  });
};

const getMobileModalPreview = (
  value: string,
  entry: ExtendedInputModalState["entry"],
): MobileTimesheetPreview => {
  if (!entry) {
    return { bg: "bg-gray-100", text: "text-gray-500", label: "Enter hours" };
  }

  const hours = parseFloat(value);
  const date = entry.fullDate ? new Date(entry.fullDate) : null;
  const isSunday = date?.getDay() === 0;
  const isSaturday = date?.getDay() === 6;

  if (hours > 9) {
    return {
      bg: "bg-[#FECACA]",
      text: "text-[#DC2626]",
      label: "Maximum 9 hours allowed",
    };
  }

  if (!value || Number.isNaN(hours)) {
    if (isSunday) {
      return {
        bg: "bg-[#8F9BBA]/20",
        text: "text-[#8F9BBA]",
        label: "Week Off",
      };
    }
    return { bg: "bg-gray-100", text: "text-gray-500", label: "No hours" };
  }

  if (isSunday && hours >= 1) {
    return {
      bg: "bg-[#E6FFFA]",
      text: "text-[#01B574]",
      label: "Full Day (Weekend)",
    };
  }

  if (isSaturday && hours >= 4) {
    return {
      bg: "bg-[#E6FFFA]",
      text: "text-[#01B574]",
      label: "Full Day (Sat)",
    };
  }

  if (hours > 6) {
    return {
      bg: "bg-[#E6FFFA]",
      text: "text-[#01B574]",
      label: `Full Day - ${hours}h`,
    };
  }

  if (hours > 0 && hours <= 6) {
    return {
      bg: "bg-[#FEF3C7]",
      text: "text-[#FFB020]",
      label: `Half Day - ${hours}h`,
    };
  }

  if (hours === 0) {
    return { bg: "bg-[#FECACA]", text: "text-[#DC2626]", label: "Absent" };
  }

  return { bg: "bg-gray-100", text: "text-gray-500", label: "Enter hours" };
};

// Fixed getDayTone prioritizing Client Visit and WFH raw states
const getDayTone = (
  day: MobileTimesheetProps["localEntries"][number],
  displayStatus: string,
  holidayInfo: MobileHoliday | undefined,
): MobileTimesheetDayTone => {
  const dayOfWeek = day.fullDate.getDay();
  const statusStr = (day.status as string || "").toLowerCase().trim();
  const locationStr = (day.workLocation as string || "").toLowerCase().trim();

  // 1. Force structural status matches first (fixes the image_b9cfc0.png green override issue)
  if (statusStr.includes("client visit") || locationStr.includes("client visit")) {
    return MobileTimesheetDayTone.CLIENT_VISIT;
  }

  if (
    statusStr === "wfh" ||
    statusStr.includes("work from home") ||
    locationStr.includes("wfh") ||
    locationStr.includes("work from home")
  ) {
    return MobileTimesheetDayTone.WFH;
  }

  // 2. Base date configurations
  if (dayOfWeek === 0) return MobileTimesheetDayTone.WEEKEND;
  if (day.isToday) return MobileTimesheetDayTone.TODAY;
  if (dayOfWeek === 6) return MobileTimesheetDayTone.SATURDAY;

  if (holidayInfo || displayStatus === AttendanceStatus.HOLIDAY) {
    return MobileTimesheetDayTone.HOLIDAY;
  }

  if (
    displayStatus === AttendanceStatus.LEAVE ||
    displayStatus === AttendanceStatus.ABSENT
  ) {
    return MobileTimesheetDayTone.ABSENT_OR_LEAVE;
  }

  if (
    displayStatus === AttendanceStatus.HALF_DAY ||
    displayStatus.toLowerCase().includes("half day")
  ) {
    return MobileTimesheetDayTone.HALF_DAY;
  }

  if (
    (day.totalHours && Number(day.totalHours) > 0) ||
    displayStatus === AttendanceStatus.FULL_DAY
  ) {
    return MobileTimesheetDayTone.PRESENT;
  }

  return MobileTimesheetDayTone.DEFAULT;
};

const mobileToneClasses: Record<any, { bg: string; border: string; text: string }> = {
  [MobileTimesheetDayTone.DEFAULT]: {
    bg: "bg-white",
    border: "border border-gray-200",
    text: "text-gray-800",
  },
  [MobileTimesheetDayTone.TODAY]: {
    bg: "bg-white",
    border: "border-2 border-[#4318FF]",
    text: "text-[#4318FF]",
  },
  [MobileTimesheetDayTone.WEEKEND]: {
    bg: "bg-gray-100",
    border: "border border-gray-300",
    text: "text-gray-500 font-bold",
  },
  [MobileTimesheetDayTone.SATURDAY]: {
    bg: "bg-pink-50",
    border: "border border-pink-300",
    text: "text-pink-700 font-bold",
  },
  [MobileTimesheetDayTone.ABSENT_OR_LEAVE]: {
    bg: "bg-red-50",
    border: "border border-red-300",
    text: "text-red-600 font-bold",
  },
  [MobileTimesheetDayTone.HALF_DAY]: {
    bg: "bg-amber-50",
    border: "border border-amber-300",
    text: "text-amber-700 font-bold",
  },
  [MobileTimesheetDayTone.HOLIDAY]: {
    bg: "bg-cyan-50",
    border: "border border-cyan-300",
    text: "text-cyan-700 font-bold",
  },
  [MobileTimesheetDayTone.PRESENT]: {
    bg: "bg-emerald-50",
    border: "border border-emerald-400",
    text: "text-emerald-700 font-bold",
  },
  [MobileTimesheetDayTone.WFH]: {
    bg: "bg-indigo-50",
    border: "border border-indigo-200",
    text: "text-indigo-600 font-bold",
  },
  [MobileTimesheetDayTone.CLIENT_VISIT]: {
    bg: "bg-slate-100",
    border: "border border-slate-300",
    text: "text-slate-600 font-bold",
  },
};

const getDisplayStatus = (
  day: MobileTimesheetProps["localEntries"][number],
  holidayInfo: MobileHoliday | undefined,
) => {
  const dayOfWeek = day.fullDate.getDay();
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;
  const hours = Number(day.totalHours || 0);
  const displayStatus = day.status as string;

  const isSaturdayWithNoData =
    isSaturday &&
    !day.workLocation &&
    (!day.status ||
      [
        AttendanceStatus.WEEKEND,
        AttendanceStatus.PENDING,
        AttendanceStatus.NOT_UPDATED,
      ].includes(day.status as AttendanceStatus));

  if (displayStatus === AttendanceStatus.ABSENT) {
    return displayStatus;
  }

  if (holidayInfo || displayStatus === AttendanceStatus.HOLIDAY) {
    return AttendanceStatus.HOLIDAY;
  }

  if (isSunday || isSaturdayWithNoData) {
    return AttendanceStatus.WEEKEND;
  }

  if (
    day.totalHours &&
    Number(day.totalHours) > 0 &&
    displayStatus !== AttendanceStatus.ABSENT &&
    displayStatus !== AttendanceStatus.LEAVE
  ) {
    const isNonWorkingFull =
      ((isSunday || !!holidayInfo) && hours >= 1 && hours <= 9) ||
      (isSaturday && hours >= 4 && hours <= 9);

    return hours > 6 || isNonWorkingFull
      ? AttendanceStatus.FULL_DAY
      : AttendanceStatus.HALF_DAY;
  }

  return displayStatus || AttendanceStatus.UPCOMING;
};

const getHalfDayColorHex = (statusString: string): string => {
  const lower = statusString.toLowerCase();
  if (lower.includes("office") || lower.includes("present")) return "#ecfdf5";
  if (lower.includes("leave") || lower.includes("absent")) return "#fef2f2";
  if (lower.includes("wfh") || lower.includes("work from home")) return "#e0e7ff";
  if (lower.includes("client")) return "#f1f5f9";
  return "#fffbeb";
};

const MobileTimesheet = ({
  now,
  loading,
  localEntries,
  paddingDays,
  monthTotalHours,
  holidays,
  selectedDateId,
  isHighlighted,
  effectiveReadOnly,
  isAdmin,
  isManager,
  isAdminView,
  isManagerView,
  isViewedMonthEligible,
  containerClassName,
  showAutoUpdateModal,
  showSuccessModal,
  isAutoUpdating,
  updateResult,
  setShowAutoUpdateModal,
  setShowSuccessModal,
  confirmAutoUpdate,
  handlePrevMonth,
  handleNextMonth,
  handleAutoUpdateClick,
  handleHoursInput,
  onSaveAll,
  isDateBlocked,
  onBlockedClick,
}: MobileTimesheetProps) => {
  const [mobileInputModal, setMobileInputModal] =
    useState<ExtendedInputModalState>(emptyInputModal);
  const onSaveAllRef = useRef(onSaveAll);
  onSaveAllRef.current = onSaveAll;

  const monthName = useMemo(
    () => now.toLocaleDateString("en-US", { month: "long" }),
    [now],
  );

  const isApprovedDutyStatus = (statusStr: string): boolean => {
    const normalized = (statusStr || "").toLowerCase().trim();
    const targets = [
      "work from home",
      "wfh",
      "work from home / office",
      "wfh / office",
      "client visit",
      "client visit / office",
    ];
    return targets.some(
      (target) => normalized === target || normalized.includes(target),
    );
  };

  const openHoursModal = (index: number) => {
    const entry = localEntries[index];
    if (!entry) return;

    const status = (entry.status || "").toLowerCase().trim();
    const workLocation = (entry.workLocation || "").toLowerCase().trim();

    if (
      isApprovedDutyStatus(entry.status || "") ||
      isApprovedDutyStatus(entry.workLocation || "")
    ) {
      setMobileInputModal({
        open: true,
        index: null,
        value: "",
        entry: {
          ...entry,
          isBlockedFullDayContext: true,
          fullDayDisplayLabel: entry.status || entry.workLocation,
        },
      });
      return;
    }

    if (status.includes("half day") && workLocation === "office") {
      setMobileInputModal({
        open: true,
        index: null,
        value: "",
        entry: { ...entry, isBlockedHalfDay: true },
      });
      return;
    }

    if (isDateBlocked(entry.fullDate)) {
      setMobileInputModal({
        open: true,
        index: null,
        value: "",
        entry: {
          ...entry,
          isBlockedHalfDay: status.includes("half day"),
          isBlockedHalfLeave: true,
        },
      });
      return;
    }

    setMobileInputModal({
      open: true,
      index: index,
      value:
        entry.totalHours === null || entry.totalHours === undefined
          ? ""
          : entry.totalHours.toString(),
      entry,
    });
  };

  const openBlockedModal = (
    entry: MobileTimesheetProps["localEntries"][number],
  ) => {
    const status = (entry.status || "").toLowerCase().trim();

    if (
      isApprovedDutyStatus(entry.status || "") ||
      isApprovedDutyStatus(entry.workLocation || "")
    ) {
      setMobileInputModal({
        open: true,
        index: null,
        value: "",
        entry: {
          ...entry,
          isBlockedFullDayContext: true,
          fullDayDisplayLabel: entry.status || entry.workLocation,
        },
      });
      return;
    }

    setMobileInputModal({
      open: true,
      index: null,
      value: "",
      entry: {
        ...entry,
        isBlockedHalfDay: status.includes("half day"),
        isBlockedHalfLeave:
          status.includes("leave") || !status.includes("half day"),
      },
    });
  };

  const closeModal = () => setMobileInputModal(emptyInputModal);

  const handleModalSubmit = () => {
    const currentModal = mobileInputModal;
    const hours = parseFloat(currentModal.value);

    if (!Number.isNaN(hours) && hours > 9) {
      return;
    }

    if (currentModal.index !== null) {
      handleHoursInput(currentModal.index, currentModal.value);
    }

    closeModal();

    window.setTimeout(() => {
      onSaveAllRef.current();
    }, currentModal.value === "" ? 0 : 550);
  };

  const renderInputModal = () => {
    if (!mobileInputModal.open) return null;

    let mode = "HOURS";
    if (
      isApprovedDutyStatus(mobileInputModal.entry?.status || "") ||
      isApprovedDutyStatus(mobileInputModal.entry?.workLocation || "")
    ) {
      mode = "BLOCKED_APPROVED_DUTY";
    } else if (mobileInputModal.entry?.isBlockedHalfDay) {
      mode = "BLOCKED_HALF_DAY";
    } else if (mobileInputModal.entry?.isBlockedHalfLeave) {
      mode = "BLOCKED_LEAVE";
    }

    const entry = mobileInputModal.entry;
    const statusLower = (entry?.status || "").toLowerCase().trim();

    let firstHalf = (entry?.firstHalf || "").trim();
    let secondHalf = (entry?.secondHalf || "").trim();

    if (!firstHalf && !secondHalf) {
      if (statusLower.includes("office") && statusLower.includes("leave")) {
        if (statusLower.indexOf("office") < statusLower.indexOf("leave")) {
          firstHalf = "Office";
          secondHalf = "Leave";
        } else {
          firstHalf = "Leave";
          secondHalf = "Office";
        }
      }
    }

    const isFullWFH = statusLower === "wfh" || statusLower === "work from home" || statusLower === "wfh / wfh";
    const isFullClient = statusLower === "client visit" || statusLower === "client visit / client visit";
    const areHalvesIdentical = firstHalf.toLowerCase() === secondHalf.toLowerCase() && firstHalf !== "";

    if (mode !== "HOURS") {
      let modalHeaderTitle = "Leave";
      let modalBodyText = "Hours are already assigned for this leave status and cannot be edited.";

      if (isFullClient || (areHalvesIdentical && firstHalf.toLowerCase().includes("client"))) {
        modalHeaderTitle = "Client Visit";
        modalBodyText = "Hours are already assigned for this client visit status and cannot be edited.";
      } else if (isFullWFH || (areHalvesIdentical && firstHalf.toLowerCase().includes("wfh"))) {
        modalHeaderTitle = "Work From Home";
        modalBodyText = "Hours are already assigned for this work from home status and cannot be edited.";
      } else if (areHalvesIdentical) {
        modalHeaderTitle = firstHalf;
        modalBodyText = `Hours are already assigned for this ${firstHalf.toLowerCase()} status and cannot be edited.`;
      } else if (firstHalf && secondHalf) {
        modalHeaderTitle = `Half Day (${firstHalf} / ${secondHalf})`;
        modalBodyText = `Hours are already assigned for this half day where the 1st half is "${firstHalf}" and the 2nd half is "${secondHalf}" and cannot be edited.`;
      } else if (statusLower === "leave") {
        modalHeaderTitle = "Leave";
        modalBodyText = "Hours are already assigned for this leave status and cannot be edited.";
      } else {
        const fallbackLabel = entry?.status || "Approved Status";
        modalHeaderTitle = fallbackLabel;
        modalBodyText = `Hours are already assigned for this ${fallbackLabel.toLowerCase()} attendance and cannot be edited.`;
      }

      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="bg-white w-full max-w-sm rounded-3xl overflow-hidden mobile-timesheet-modal shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-[#4318FF] to-[#6B4EFF] px-6 py-5">
              <h3 className="text-xl font-black text-white text-center">
                {modalHeaderTitle}
              </h3>
            </div>

            <div className="p-6 text-center">
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                {modalBodyText}
              </p>
              <button
                onClick={closeModal}
                className="w-full mt-5 py-3 rounded-2xl bg-[#4318FF] text-white font-black transition-all active:scale-95 shadow-lg shadow-blue-500/30"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      );
    }

    const preview = getMobileModalPreview(
      mobileInputModal.value,
      mobileInputModal.entry,
    );
    const entryDate = mobileInputModal.entry?.fullDate
      ? new Date(mobileInputModal.entry.fullDate)
      : null;
    const dayLabel = entryDate
      ? entryDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
      : "";

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div
          className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden mobile-timesheet-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="bg-gradient-to-br from-[#4318FF] to-[#6B4EFF] px-6 pt-5 pb-5">
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest text-center mb-1">
              {dayLabel}
            </p>
            <h3 className="text-2xl font-black text-white text-center">
              Log Hours
            </h3>
          </div>

          <div className="px-6 pt-4 pb-2">
            <div
              className={`w-full py-3 rounded-2xl text-center text-sm font-black tracking-wide transition-all duration-300 ${preview.bg} ${preview.text}`}
            >
              {preview.label}
            </div>
          </div>

          <div className="px-6 pt-2 pb-3">
            <input
              type="number"
              autoFocus
              value={mobileInputModal.value}
              onChange={(event) =>
                setMobileInputModal((previous) => ({
                  ...previous,
                  value: event.target.value,
                }))
              }
              className="w-full border-2 border-gray-200 focus:border-[#4318FF] rounded-2xl p-4 text-center text-4xl font-black text-[#2B3674] outline-none transition-all duration-200"
              placeholder="0"
              min="0"
              max="9"
              step="0.5"
            />
            <p className="text-center text-xs text-gray-400 mt-2 font-medium">
              Enter hours (0 - 9)
            </p>
          </div>

          <div className="px-6 pt-2 pb-3">
            <p className="text-center text-xs text-gray-400 mt-2 font-medium">
              Quick Select
            </p>
            <div className="grid grid-cols-5 gap-2">
              {["4", "5", "6", "7.5", "9"].map((hours) => (
                <button
                  key={hours}
                  onClick={() =>
                    setMobileInputModal((previous) => ({
                      ...previous,
                      value: hours,
                    }))
                  }
                  className={`py-2 rounded-xl text-sm font-black transition-all border ${mobileInputModal.value === hours
                    ? "bg-[#4318FF] text-white border-[#4318FF] scale-105"
                    : "bg-gray-50 text-[#2B3674] border-gray-200 hover:border-[#4318FF]"
                    }`}
                >
                  {hours}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={closeModal}
              className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-black text-sm transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleModalSubmit}
              disabled={
                loading ||
                (!Number.isNaN(parseFloat(mobileInputModal.value)) &&
                  parseFloat(mobileInputModal.value) > 9)
              }
              className={`flex-1 py-3.5 rounded-2xl bg-[#4318FF] text-white font-black text-sm shadow-lg shadow-blue-500/30 transition-all active:scale-95 ${loading ||
                (!Number.isNaN(parseFloat(mobileInputModal.value)) &&
                  parseFloat(mobileInputModal.value) > 9)
                ? "opacity-70 cursor-not-allowed"
                : ""
                }`}
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white" />
                  Saving...
                </span>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderInputModal()}

      <div
        className={`mobile-timesheet-shell flex flex-col ${containerClassName || "h-full max-h-full overflow-visible bg-[#F4F7FE] py-2 px-1 relative"}`}
      >
        <AutoUpdateModal
          isOpen={showAutoUpdateModal}
          onClose={() => { }}
          onConfirm={confirmAutoUpdate}
          monthName={monthName}
          year={now.getFullYear()}
          loading={isAutoUpdating}
        />
        <AutoUpdateSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          count={updateResult?.count || 0}
          monthName={monthName}
          year={now.getFullYear()}
        />

        <div className="flex-1 overflow-visible mt-1 mb-3 flex flex-col bg-transparent p-2 shadow-none border-none">
          {/* Toolbar container wrapper */}
          <div className="mobile-timesheet-toolbar bg-white rounded-[20px] px-3 py-2 shadow-sm border border-gray-50 mb-3 w-full box-border">

            {/* Strict three equal columns layout */}
            <div className="mobile-timesheet-summary-row grid grid-cols-3 items-center w-full overflow-hidden">

              {/* 1. LEFT COLUMN: Month Picker */}
              <div className="flex items-center justify-start gap-0.5">
                <button
                  onClick={handlePrevMonth}
                  disabled={isAdminView || loading}
                  className={`p-1 transition-all ${isAdminView
                    ? "text-gray-300 cursor-not-allowed hidden"
                    : loading
                      ? "text-gray-300 cursor-wait"
                      : "text-[#4318FF] active:scale-95"
                    }`}
                >
                  <ChevronLeft size={14} strokeWidth={2.8} />
                </button>
                <p className="text-xs font-black text-[#2B3674] min-w-[60px] text-center whitespace-nowrap">
                  {now.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <button
                  onClick={handleNextMonth}
                  disabled={isAdminView || loading}
                  className={`p-1 transition-all ${isAdminView
                    ? "text-gray-300 cursor-not-allowed hidden"
                    : loading
                      ? "text-gray-300 cursor-wait"
                      : "text-[#4318FF] active:scale-95"
                    }`}
                >
                  <ChevronRight size={14} strokeWidth={2.8} />
                </button>
              </div>

              {/* 2. CENTER COLUMN: Total Tracked */}
              <div className="mobile-timesheet-total flex flex-row flex-nowrap items-baseline justify-center gap-0.5 min-w-0">
                <p className="text-[10px] tracking-tight uppercase font-black text-gray-600 leading-none whitespace-nowrap">
                  TOTAL TRACKED:
                </p>
                <p className="text-base font-black text-[#4318FF] leading-none whitespace-nowrap">
                  {PlatformTotalHoursFix(monthTotalHours)}
                </p>
                <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">hrs</span>
              </div>

              {/* 3. RIGHT COLUMN: Auto Fill Button (Text stacked vertically, Icon to the side) */}
              <div className="mobile-timesheet-actions flex items-center justify-end">
                {(!effectiveReadOnly ||
                  (isAdmin && !isAdminView) ||
                  (isManager && !isManagerView)) &&
                  isViewedMonthEligible && (
                    <button
                      onClick={handleAutoUpdateClick}
                      className="flex flex-row items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg font-black text-[7.5px] uppercase tracking-wide text-white transition-all active:scale-95 bg-[#4318FF] whitespace-nowrap text-left"
                      title="Auto-fill working days to 9 hours"
                    >
                      {/* Stacked text blocks */}
                      <div className="flex flex-col leading-[1.1]">
                        <span>Auto</span>
                        <span>Fill</span>
                      </div>
                      {/* Icon cleanly on the side */}
                      <Rocket size={11} className="flex-shrink-0" />
                    </button>
                  )}
              </div>

            </div>
          </div>

          <div className="p-3 flex flex-col flex-1 overflow-visible">
            <div className="grid grid-cols-7 gap-1.5 mb-1 px-1 pb-1">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                (dayName) => (
                  <div
                    key={dayName}
                    className="text-center text-[10px] font-black text-[#8F9BBA] uppercase tracking-wider"
                  >
                    {dayName}
                  </div>
                ),
              )}
            </div>

            <div className="grid grid-cols-7 gap-2 overflow-visible p-0 pt-1 pb-1 mobile-timesheet-grid">
              {Array.from({ length: paddingDays }).map((_, index) => (
                <div key={`p-${index}`} className="min-h-[40px]" />
              ))}

              {localEntries.map((day, index) => {
                const holidayInfo = getHolidayForDate(day.fullDate, holidays);
                const displayStatus = getDisplayStatus(day, holidayInfo);
                const isSelected =
                  selectedDateId &&
                  new Date(selectedDateId).toDateString() ===
                  day.fullDate.toDateString();
                const highlightClass =
                  isSelected && isHighlighted
                    ? "date-highlight ring-4 ring-[#4318FF]/20 z-10 scale-[1.02]"
                    : "";
                const isBlocked = isDateBlocked(day.fullDate);
                const tone = getDayTone(day, displayStatus, holidayInfo);
                const toneClasses = mobileToneClasses[tone] || mobileToneClasses[MobileTimesheetDayTone.DEFAULT];

                const statusLabel = day.status
                  ? (day.status as string).toUpperCase()
                  : "BLOCKED";

                const statusLower = (day.status || "").toLowerCase().trim();
                let firstHalf = ((day as any).firstHalf || "").trim();
                let secondHalf = ((day as any).secondHalf || "").trim();

                if (!firstHalf && !secondHalf) {
                  if (statusLower.includes("office") && statusLower.includes("leave")) {
                    if (statusLower.indexOf("office") < statusLower.indexOf("leave")) {
                      firstHalf = "Office";
                      secondHalf = "Leave";
                    } else {
                      firstHalf = "Leave";
                      secondHalf = "Office";
                    }
                  }
                }

                const isSplitDay = firstHalf && secondHalf && firstHalf.toLowerCase() !== secondHalf.toLowerCase();
                const dynamicSplitBgStyle = isSplitDay
                  ? { background: `linear-gradient(to bottom, ${getHalfDayColorHex(firstHalf)} 50%, ${getHalfDayColorHex(secondHalf)} 50%)` }
                  : {};

                return (
                  <div
                    key={index}
                    id={`day-${day.fullDate.getTime()}`}
                    className={`mobile-timesheet-day relative flex flex-col items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer aspect-[4/5] sm:aspect-square w-full shadow-sm group overflow-visible
                    ${isSplitDay ? "" : toneClasses.bg} ${toneClasses.border} ${highlightClass} ${day.isToday ? "ring-2 ring-[#4318FF] ring-offset-1" : ""}
                    ${isBlocked ? "cursor-pointer" : "active:scale-95"}`}
                    style={dynamicSplitBgStyle}
                    onClick={() => openHoursModal(index)}
                  >
                    {/* Top Right Lock Icon */}
                    {isBlocked && (
                      <div
                        className="absolute top-1.5 right-1.5 cursor-pointer z-30 p-0.5"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openBlockedModal(day);
                        }}
                      >
                        <Lock size={9} className={`${toneClasses.text} opacity-85`} />
                      </div>
                    )}

                    {/* Date Number */}
                    <span
                      className={`text-[13px] font-extrabold ${toneClasses.text} ${day.isToday ? "font-black" : ""} leading-none`}
                    >
                      {day.date}
                    </span>

                    {/* Hours (if present and not blocked) */}
                    {day.totalHours !== null &&
                      day.totalHours !== undefined &&
                      Number(day.totalHours) > 0 &&
                      !isBlocked && (
                        <span className="text-[9px] font-black opacity-80 mt-0.5 text-gray-500">
                          {Number(day.totalHours)}h
                        </span>
                      )}

                    {/* Status Label container remains at the bottom */}
                    {isBlocked && (
                      <div
                        className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center p-0.5 text-center cursor-pointer z-20"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openBlockedModal(day);
                        }}
                      >
                        <span className={`text-[6px] font-black leading-none uppercase tracking-tighter max-w-full truncate px-0.5 ${toneClasses.text}`}>
                          {statusLabel}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mobile-timesheet-legend flex gap-x-2 gap-y-1 px-2 mb-2 mobile-timesheet-scrollbar pb-0">
              {[
                {
                  label: AttendanceStatus.FULL_DAY,
                  color: "bg-emerald-50",
                  border: "border-emerald-400",
                },
                {
                  label: "Half Day Leave",
                  color: "bg-amber-50",
                  border: "border-amber-300",
                },
                {
                  label: AttendanceStatus.ABSENT,
                  color: "bg-red-100",
                  border: "border-red-400",
                },
                {
                  label: AttendanceStatus.LEAVE,
                  color: "bg-red-50",
                  border: "border-red-300",
                },
                {
                  label: "WFH",
                  color: "bg-indigo-50",
                  border: "border-indigo-200",
                },
                {
                  label: "Client Visit",
                  color: "bg-slate-100",
                  border: "border-slate-300",
                },
                {
                  label: AttendanceStatus.NOT_UPDATED,
                  color: "bg-[#F8FAFC]",
                  border: "border-[#64748B]",
                },
                {
                  label: "Today",
                  color: "bg-[#4318FF]",
                  border: "border-transparent",
                },
                {
                  label: AttendanceStatus.HOLIDAY,
                  color: "bg-cyan-50",
                  border: "border-cyan-300",
                },
                {
                  label: "Upcoming",
                  color: "bg-[#F8FAFC]",
                  border: "border-[#64748B]",
                },
                {
                  label: "Blocked",
                  color: "bg-gray-100",
                  border: "border-gray-300",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="mobile-timesheet-legend-item flex items-center gap-1 text-[10px] font-bold text-gray-600 whitespace-nowrap uppercase tracking-wider"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${item.color} border ${item.border}`}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const PlatformTotalHoursFix = (val: string | number | null | undefined): string =>
  (Number(val) || 0).toFixed(1);

export default MobileTimesheet;
