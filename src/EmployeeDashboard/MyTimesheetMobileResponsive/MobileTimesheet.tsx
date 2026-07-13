import { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Lock, Rocket } from "lucide-react";
import { AttendanceStatus } from "../../enums";
import AutoUpdateModal from "../AutoUpdateModal";
import AutoUpdateSuccessModal from "../AutoUpdateSuccessModal";
import TimesheetImg from "../../assets/TimesheetIMG.png";
import {
  MobileHoliday,
  MobileTimesheetInputModalState,
  MobileTimesheetPreview,
  MobileTimesheetProps,
} from "./mobileTimesheet.types";
import "./MobileTimesheet.css";

interface ExtendedInputModalState
  extends Omit<MobileTimesheetInputModalState, "entry"> {
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

/* ============================================================
  COLOR ENGINE — Updated for explicit WFH (Purple) & Client (Blue)
  ============================================================ */

const getStatusStyles = (
  statusStr: string | null | undefined,
  location?: string | null,
) => {
  const s = (statusStr || "").toLowerCase();
  const loc = (location || "").toLowerCase();

  if (s === "blocked")
    return {
      bg: "bg-gray-200",
      badge: "bg-gray-600 text-white",
      border: "border-transparent",
      text: "text-gray-600",
    };
  if (s === "holiday")
    return {
      bg: "bg-[#DBEAFE]",
      badge: "bg-[#1890FF]/70 text-white font-bold",
      border: "border-[#1890FF]/20",
      text: "text-[#1890FF]",
    };
  if (
    s === AttendanceStatus.WEEKEND.toLowerCase() ||
    s === AttendanceStatus.LEAVE.toLowerCase()
  )
    return {
      bg: "bg-[#FEE2E2]", // 🔴 Leave / Absent Red
      badge: "bg-[#EE5D50]/70 text-white font-bold",
      border: "border-[#EE5D50]/10",
      text: "text-[#EE5D50]",
    };
  if (s === AttendanceStatus.FULL_DAY.toLowerCase() || s === "full day" || loc === "office" || s === "office")
    return {
      bg: "bg-[#E6FFFA]", // 🟢 Office / Full Day Green
      badge: "bg-[#01B574] text-white font-bold",
      border: "border-[#01B574]/20",
      text: "text-[#01B574]",
    };
  if (s.includes("half day"))
    return {
      bg: "bg-[#FEF3C7]",
      badge: "bg-[#FFB020]/80 text-white font-bold",
      border: "border-[#FFB020]/20",
      text: "text-[#FFB020]",
    };
  if (s === AttendanceStatus.ABSENT.toLowerCase())
    return {
      bg: "bg-[#FECACA]",
      badge: "bg-[#DC2626]/70 text-white font-bold",
      border: "border-[#DC2626]/20",
      text: "text-[#DC2626]",
    };
  if (s === "wfh" || loc === "wfh" || s === "work from home")
    return {
      bg: "bg-[#d2dcfcff]",
      badge: "bg-[#6366F1]/70 text-white font-bold",
      border: "border-[#6366F1]/20",
      text: "text-[#4F46E5]",
    };
  if (
    s === "client visit" ||
    loc === "client visit" ||
    loc === "client place" ||
    s === "client"
  )
    return {
      bg: "bg-[#f2fcbd]",
      badge: "bg-[#4318FF]/70 text-white font-bold",
      border: "border-[#4318FF]/20",
      text: "text-[#4318FF]",
    };

  return {
    bg: "bg-[#F8FAFC]",
    badge: "bg-[#64748B]/90 text-white font-bold",
    border: "border-gray-300",
    text: "text-gray-600",
  };
};

const HEX_FALLBACK: Record<string, string> = {
  "bg-gray-200": "#e5e7eb",
  "bg-white": "#ffffff",
  "bg-[#E6FFFA]": "#E6FFFA",
  "bg-[#EEF2FF]": "#EEF2FF",
  "bg-[#DBEAFE]": "#DBEAFE",
  "bg-[#FEE2E2]": "#FEE2E2",
};

const bgClassToHex = (bgClass: string): string => {
  const match = bgClass.match(/#([0-9a-fA-F]{3,8})/);
  if (match) return `#${match[1]}`;
  return HEX_FALLBACK[bgClass] || "#F8FAFC";
};

/* ------------------------------------------------------------
   TEXT COLOR ENGINE
   Mirrors MobileTimesheetHistory's approach: resolve an actual
   hex color and apply it via inline style, instead of relying on
   a Tailwind arbitrary-value text-[#hex] class. Those classes
   were not reliably rendering, which is why day numbers / hours /
   status labels were showing up black instead of the intended
   status color (as correctly seen in the History view).
   ------------------------------------------------------------ */

const TEXT_HEX_FALLBACK: Record<string, string> = {
  "text-gray-600": "#4b5563",
  "text-gray-500": "#6b7280",
};

const textClassToHex = (textClass: string): string => {
  const match = textClass.match(/#([0-9a-fA-F]{3,8})/);
  if (match) return `#${match[1]}`;
  return TEXT_HEX_FALLBACK[textClass] || "#4b5563";
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
        const fallbackLabel = entry?.status || "Weekend";
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
          onClose={() => setShowAutoUpdateModal(false)}
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
          <div className="mobile-timesheet-toolbar bg-white rounded-[20px] px-3 py-2 shadow-sm border border-gray-50 mb-3 w-full box-border">
            <div className="mobile-timesheet-summary-row flex flex-row flex-nowrap items-center w-full overflow-visible">
              <div className="mobile-timesheet-month-selector flex items-center justify-start gap-0.5">
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
                <p className="mobile-timesheet-month-label text-xs font-black text-[#2B3674] min-w-[60px] text-center whitespace-nowrap">
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

              <div className="mobile-timesheet-total flex flex-row flex-nowrap items-baseline justify-center gap-0.5 min-w-0">
                <p className="mobile-timesheet-total-label text-[10px] tracking-tight uppercase font-black text-gray-600 leading-none whitespace-nowrap">
                  TOTAL <span className="mobile-timesheet-total-label-long">TRACKED</span>:
                </p>
                <p className="mobile-timesheet-total-value text-base font-black text-[#4318FF] leading-none whitespace-nowrap">
                  {PlatformTotalHoursFix(monthTotalHours)}
                </p>
                <span className="mobile-timesheet-total-unit text-[10px] font-bold text-gray-500 whitespace-nowrap">hrs</span>
              </div>

              <div className="mobile-timesheet-actions flex items-center justify-end">
                {(!effectiveReadOnly ||
                  (isAdmin && !isAdminView) ||
                  (isManager && !isManagerView)) &&
                  isViewedMonthEligible && (
                    <button
                      onClick={handleAutoUpdateClick}
                      className="mobile-timesheet-autofill-btn flex flex-row items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg font-black text-[7.5px] uppercase tracking-wide text-white transition-all active:scale-95 bg-[#4318FF] whitespace-nowrap text-left"
                      title="Auto-fill working days to 9 hours"
                    >
                      <div className="flex flex-col leading-[1.1]">
                        <span>Auto</span>
                        <span>Fill</span>
                      </div>
                      <Rocket size={11} className="flex-shrink-0 animate-pulse" />
                    </button>
                  )}
              </div>
            </div>
          </div>

          <div className="p-3 flex flex-col flex-1 overflow-visible">
            <div className="mobile-timesheet-weekday-row grid grid-cols-7 gap-1.5 mb-1 px-1 pb-1">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                (dayName) => (
                  <div
                    key={dayName}
                    className="mobile-timesheet-weekday-cell text-center text-[10px] font-black text-[#8F9BBA] uppercase tracking-wider"
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

                const overallStyles = getStatusStyles(
                  displayStatus,
                  day.workLocation,
                );

                // Resolve an actual hex color (same behavior as
                // MobileTimesheetHistory) instead of relying on a Tailwind
                // arbitrary text-[#hex] class, which was not rendering
                // reliably and caused the day number / hours / status
                // label text to fall back to black.
                const cellTextColor = day.isToday
                  ? "#4318FF"
                  : textClassToHex(overallStyles.text);

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

                const dayOfWeek = day.fullDate.getDay();
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;
                const h_val = Number(day.totalHours || 0);
                const isNonWorkingDay = isSunday || !!holidayInfo;

                const isSplitDay =
                  !!firstHalf &&
                  !!secondHalf &&
                  !((isNonWorkingDay && h_val >= 1) || (isSaturday && h_val >= 4));

                let splitBgStyle: React.CSSProperties = {};
                if (isSplitDay) {
                  const normalizedFirst = firstHalf.toLowerCase();
                  const normalizedSecond = secondHalf.toLowerCase();

                  const checkOffice = (s: string) => s === "office";
                  const checkWfh = (s: string) => s === "wfh" || s === "work from home";
                  const checkClient = (s: string) => s === "client" || s === "client visit" || s === "client place";
                  const checkLeave = (s: string) => s === "leave";

                  if (checkOffice(normalizedFirst) && checkOffice(normalizedSecond)) {
                    splitBgStyle = { background: bgClassToHex(getStatusStyles("office").bg) };
                  } else if (checkWfh(normalizedFirst) && checkWfh(normalizedSecond)) {
                    splitBgStyle = { background: bgClassToHex(getStatusStyles("wfh").bg) };
                  } else if (checkClient(normalizedFirst) && checkClient(normalizedSecond)) {
                    splitBgStyle = { background: bgClassToHex(getStatusStyles("client visit").bg) };
                  } else {
                    // HORIZONTAL GRADIENT SPLIT (Top Half / Bottom Half) as requested per image_cf597f.png
                    let firstColor = bgClassToHex(getStatusStyles(firstHalf).bg);
                    let secondColor = bgClassToHex(getStatusStyles(secondHalf).bg);

                    if (checkOffice(normalizedFirst)) firstColor = bgClassToHex(getStatusStyles("office").bg);
                    if (checkWfh(normalizedFirst)) firstColor = bgClassToHex(getStatusStyles("wfh").bg);
                    if (checkClient(normalizedFirst)) firstColor = bgClassToHex(getStatusStyles("client visit").bg);
                    if (checkLeave(normalizedFirst)) firstColor = bgClassToHex(getStatusStyles(AttendanceStatus.LEAVE).bg);

                    if (checkOffice(normalizedSecond)) secondColor = bgClassToHex(getStatusStyles("office").bg);
                    if (checkWfh(normalizedSecond)) secondColor = bgClassToHex(getStatusStyles("wfh").bg);
                    if (checkClient(normalizedSecond)) secondColor = bgClassToHex(getStatusStyles("client visit").bg);
                    if (checkLeave(normalizedSecond)) secondColor = bgClassToHex(getStatusStyles(AttendanceStatus.LEAVE).bg);

                    splitBgStyle = {
                      background: `linear-gradient(to bottom, ${firstColor} 50%, ${secondColor} 50%)`,
                    };
                  }
                }

                const isSundayCell = day.fullDate.getDay() === 0;

                const cellBgClass = isSundayCell
                  ? "bg-[#FEE2E2]"
                  : day.isToday
                    ? "bg-white"
                    : isSplitDay
                      ? ""
                      : overallStyles.bg;
                const cellBorderClass = day.isToday
                  ? "!border-2 !border-[#4318FF]"
                  : isSplitDay
                    ? "border-transparent"
                    : overallStyles.border;

                return (
                  <div
                    key={index}
                    id={`day-${day.fullDate.getTime()}`}
                    className={`mobile-timesheet-day relative flex flex-col items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer aspect-[4/5] sm:aspect-square w-full shadow-sm group overflow-visible
                      ${cellBgClass} ${cellBorderClass} ${highlightClass}
                      ${isBlocked ? "cursor-pointer" : "active:scale-95"}`}
                    style={splitBgStyle}
                    onClick={() => openHoursModal(index)}
                  >
                    {isBlocked && (
                      <div
                        className="absolute top-1.5 right-1.5 cursor-pointer z-30 p-0.5"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openBlockedModal(day);
                        }}
                      >
                        <Lock size={9} color={cellTextColor} className="opacity-85" />
                      </div>
                    )}

                    <span
                      className={`mobile-timesheet-day-number text-[13px] font-extrabold ${day.isToday ? "font-black" : ""} leading-none`}
                      style={{ color: cellTextColor }}
                    >
                      {day.date}
                    </span>

                    {day.totalHours !== null &&
                      day.totalHours !== undefined &&
                      Number(day.totalHours) > 0 &&
                      !isBlocked && (
                        <span
                          className="mobile-timesheet-day-hours text-[9px] font-black opacity-80 mt-0.5"
                          style={{ color: cellTextColor }}
                        >
                          {Number(day.totalHours)}h
                        </span>
                      )}

                    {isBlocked && (
                      <div
                        className="mobile-timesheet-day-status-label absolute inset-x-0 bottom-1 flex flex-col items-center justify-center p-0.5 text-center cursor-pointer z-20"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openBlockedModal(day);
                        }}
                      >
                        <span
                          className="text-[6px] font-black leading-none uppercase tracking-tighter max-w-full truncate px-0.5"
                          style={{ color: cellTextColor }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mobile-timesheet-legend flex flex-wrap gap-x-4 gap-y-3 px-4 py-3 mb-4 bg-white border border-gray-100 rounded-xl shadow-sm items-center justify-start">
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
                  color: "bg-[#d2dcfcff]",
                  border: "border-[#8FA8F8]",
                },
                {
                  label: "Client Visit",
                  color: "bg-[#F2FCBD]",
                  border: "border-[#B7D94A]",
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
                  className="mobile-timesheet-legend-item flex items-center gap-1.5 text-[10px] font-bold text-slate-600 whitespace-nowrap uppercase tracking-wider"
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${item.color} border ${item.border}`}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="w-full px-2 mt-2">
              <img
                src={TimesheetImg}
                alt="Stay on Track, Stay Productive"
                className="w-full h-auto object-contain rounded-2xl"
              />
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