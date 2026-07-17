import { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Lock, Rocket } from "lucide-react";
import { AttendanceStatus } from "../../enums";
import {
  MobileTimesheetModalMode,
  MobileTimesheetDayTone,
} from "./mobileTimesheet.enums";
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

const WorkLocation = {
  OFFICE: "office",
  WFH: "wfh",
  WORK_FROM_HOME: "work from home",
  CLIENT: "client",
  CLIENT_VISIT: "client visit",
  CLIENT_PLACE: "client place",
} as const;

const APPROVED_DUTY_STATUS_VALUES = [
  WorkLocation.WORK_FROM_HOME,
  WorkLocation.WFH,
  `${WorkLocation.WORK_FROM_HOME} / office`,
  `${WorkLocation.WFH} / office`,
  WorkLocation.CLIENT_VISIT,
  `${WorkLocation.CLIENT_VISIT} / office`,
];

interface ExtendedInputModalState
  extends Omit<MobileTimesheetInputModalState, "entry"> {
  entry:
  | (MobileTimesheetInputModalState["entry"] & {
    isBlockedHalfDay?: boolean;
    isBlockedHalfLeave?: boolean;
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
interface DayToneColor {
  bgClass: string;
  bgHex: string;
  textHex: string;
  borderClass: string;
}

const DAY_TONE_COLORS: Record<MobileTimesheetDayTone, DayToneColor> = {
  [MobileTimesheetDayTone.DEFAULT]: {
    bgClass: "bg-[#F8FAFC]",
    bgHex: "#F8FAFC",
    textHex: "#64748B",
    borderClass: "border-gray-300",
  },
  [MobileTimesheetDayTone.TODAY]: {
    bgClass: "bg-white",
    bgHex: "#FFFFFF",
    textHex: "#4318FF",
    borderClass: "!border-2 !border-[#4318FF]",
  },
  [MobileTimesheetDayTone.WEEKEND]: {
    bgClass: "bg-[#FEE2E2]",
    bgHex: "#FEE2E2",
    textHex: "#EE5D50",
    borderClass: "border-[#EE5D50]/10",
  },
  [MobileTimesheetDayTone.SATURDAY]: {
    // Saturdays with no data fold into the same weekend styling as Sunday.
    bgClass: "bg-[#FEE2E2]",
    bgHex: "#FEE2E2",
    textHex: "#EE5D50",
    borderClass: "border-[#EE5D50]/10",
  },
  [MobileTimesheetDayTone.ABSENT_OR_LEAVE]: {
    bgClass: "bg-[#FECACA]",
    bgHex: "#FECACA",
    textHex: "#DC2626",
    borderClass: "border-[#DC2626]/20",
  },
  [MobileTimesheetDayTone.HALF_DAY]: {
    bgClass: "bg-[#FEF3C7]",
    bgHex: "#FEF3C7",
    textHex: "#FFB020",
    borderClass: "border-[#FFB020]/20",
  },
  [MobileTimesheetDayTone.HOLIDAY]: {
    bgClass: "bg-[#DBEAFE]",
    bgHex: "#DBEAFE",
    textHex: "#1890FF",
    borderClass: "border-[#1890FF]/20",
  },
  [MobileTimesheetDayTone.PRESENT]: {
    bgClass: "bg-[#E6FFFA]",
    bgHex: "#E6FFFA",
    textHex: "#01B574",
    borderClass: "border-[#01B574]/20",
  },
  [MobileTimesheetDayTone.CLIENT_VISIT]: {
    bgClass: "bg-[#f2fcbd]",
    bgHex: "#f2fcbd",
    textHex: "#4318FF",
    borderClass: "border-[#4318FF]/20",
  },
  [MobileTimesheetDayTone.WFH]: {
    bgClass: "bg-[#d2dcfcff]",
    bgHex: "#d2dcfcff",
    textHex: "#4F46E5",
    borderClass: "border-[#6366F1]/20",
  },
};

/** Hours-input modal preview badge uses its own (slightly different)
 *  palette from the grid cells, matching the original design exactly. */
const HOURS_PREVIEW_STYLES: Record<
  MobileTimesheetDayTone,
  { bg: string; text: string }
> = {
  [MobileTimesheetDayTone.DEFAULT]: { bg: "bg-gray-100", text: "text-gray-500" },
  [MobileTimesheetDayTone.TODAY]: { bg: "bg-white", text: "text-[#4318FF]" },
  [MobileTimesheetDayTone.WEEKEND]: { bg: "bg-[#8F9BBA]/20", text: "text-[#8F9BBA]" },
  [MobileTimesheetDayTone.SATURDAY]: { bg: "bg-[#8F9BBA]/20", text: "text-[#8F9BBA]" },
  [MobileTimesheetDayTone.ABSENT_OR_LEAVE]: { bg: "bg-[#FECACA]", text: "text-[#DC2626]" },
  [MobileTimesheetDayTone.HALF_DAY]: { bg: "bg-[#FEF3C7]", text: "text-[#FFB020]" },
  [MobileTimesheetDayTone.HOLIDAY]: { bg: "bg-[#DBEAFE]", text: "text-[#1890FF]" },
  [MobileTimesheetDayTone.PRESENT]: { bg: "bg-[#E6FFFA]", text: "text-[#01B574]" },
  [MobileTimesheetDayTone.CLIENT_VISIT]: { bg: "bg-[#f2fcbd]", text: "text-[#4318FF]" },
  [MobileTimesheetDayTone.WFH]: { bg: "bg-[#d2dcfcff]", text: "text-[#4F46E5]" },
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

const getHoursPreview = (
  value: string,
  entry: ExtendedInputModalState["entry"],
): MobileTimesheetPreview => {
  if (!entry) {
    return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.DEFAULT], label: "Enter hours" };
  }

  const hours = parseFloat(value);
  const entryDate = entry.fullDate ? new Date(entry.fullDate) : null;
  const isSunday = entryDate?.getDay() === 0;
  const isSaturday = entryDate?.getDay() === 6;

  if (hours > 9) {
    return {
      ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.ABSENT_OR_LEAVE],
      label: "Maximum 9 hours allowed",
    };
  }

  if (!value || Number.isNaN(hours)) {
    return isSunday
      ? { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.WEEKEND], label: "Week Off" }
      : { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.DEFAULT], label: "No hours" };
  }

  if (isSunday && hours >= 1) {
    return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.PRESENT], label: "Full Day (Weekend)" };
  }

  if (isSaturday && hours >= 4) {
    return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.PRESENT], label: "Full Day (Sat)" };
  }

  if (hours > 6) {
    return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.PRESENT], label: `Full Day - ${hours}h` };
  }

  if (hours > 0 && hours <= 6) {
    return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.HALF_DAY], label: `Half Day - ${hours}h` };
  }

  if (hours === 0) {
    return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.ABSENT_OR_LEAVE], label: "Absent" };
  }

  return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.DEFAULT], label: "Enter hours" };
};

const resolveDayTone = (
  status: string | null | undefined,
  workLocation?: string | null,
): MobileTimesheetDayTone => {
  const normalizedStatus = (status || "").toLowerCase().trim();
  const normalizedLocation = (workLocation || "").toLowerCase().trim();

  if (normalizedStatus === AttendanceStatus.HOLIDAY.toLowerCase()) {
    return MobileTimesheetDayTone.HOLIDAY;
  }
  if (
    normalizedStatus === AttendanceStatus.WEEKEND.toLowerCase() ||
    normalizedStatus === AttendanceStatus.LEAVE.toLowerCase()
  ) {
    return MobileTimesheetDayTone.ABSENT_OR_LEAVE;
  }
  if (
    normalizedStatus === AttendanceStatus.FULL_DAY.toLowerCase() ||
    normalizedStatus === "full day" ||
    normalizedLocation === WorkLocation.OFFICE ||
    normalizedStatus === WorkLocation.OFFICE
  ) {
    return MobileTimesheetDayTone.PRESENT;
  }
  if (normalizedStatus.includes(AttendanceStatus.HALF_DAY.toLowerCase())) {
    return MobileTimesheetDayTone.HALF_DAY;
  }
  if (normalizedStatus === AttendanceStatus.ABSENT.toLowerCase()) {
    return MobileTimesheetDayTone.ABSENT_OR_LEAVE;
  }
  if (
    normalizedStatus === WorkLocation.WFH ||
    normalizedLocation === WorkLocation.WFH ||
    normalizedStatus === WorkLocation.WORK_FROM_HOME
  ) {
    return MobileTimesheetDayTone.WFH;
  }
  if (
    normalizedStatus === WorkLocation.CLIENT_VISIT ||
    normalizedLocation === WorkLocation.CLIENT_VISIT ||
    normalizedLocation === WorkLocation.CLIENT_PLACE ||
    normalizedStatus === WorkLocation.CLIENT
  ) {
    return MobileTimesheetDayTone.CLIENT_VISIT;
  }

  return MobileTimesheetDayTone.DEFAULT;
};

/** Same tone vocabulary, applied to a single half-day label ("Office",
 *  "WFH", "Leave", ...) so the split-day gradient can reuse DAY_TONE_COLORS
 *  instead of re-deriving colors by hand. */
const resolveHalfDayTone = (halfDayLabel: string): MobileTimesheetDayTone => {
  const normalized = halfDayLabel.toLowerCase().trim();
  if (normalized === WorkLocation.OFFICE) return MobileTimesheetDayTone.PRESENT;
  if (normalized === WorkLocation.WFH || normalized === WorkLocation.WORK_FROM_HOME) {
    return MobileTimesheetDayTone.WFH;
  }
  if (
    normalized === WorkLocation.CLIENT ||
    normalized === WorkLocation.CLIENT_VISIT ||
    normalized === WorkLocation.CLIENT_PLACE
  ) {
    return MobileTimesheetDayTone.CLIENT_VISIT;
  }
  if (normalized === AttendanceStatus.LEAVE.toLowerCase()) return MobileTimesheetDayTone.ABSENT_OR_LEAVE;
  return MobileTimesheetDayTone.DEFAULT;
};

const getSplitDayBackground = (
  firstHalf: string,
  secondHalf: string,
): React.CSSProperties => {
  const firstTone = resolveHalfDayTone(firstHalf);
  const secondTone = resolveHalfDayTone(secondHalf);

  if (firstTone === secondTone) {
    return { background: DAY_TONE_COLORS[firstTone].bgHex };
  }

  return {
    background: `linear-gradient(to bottom, ${DAY_TONE_COLORS[firstTone].bgHex} 50%, ${DAY_TONE_COLORS[secondTone].bgHex} 50%)`,
  };
};

/** When the API doesn't send explicit half-day labels but the combined
 *  status string mentions both "office" and "leave", split it into an
 *  ordered first/second half pair for display. */
const resolveHalfDayLabels = (
  status: string | null | undefined,
  rawFirstHalf?: string | null,
  rawSecondHalf?: string | null,
): { firstHalf: string; secondHalf: string } => {
  let firstHalf = (rawFirstHalf || "").trim();
  let secondHalf = (rawSecondHalf || "").trim();

  if (!firstHalf && !secondHalf) {
    const normalizedStatus = (status || "").toLowerCase().trim();
    const leaveKeyword = AttendanceStatus.LEAVE.toLowerCase();
    if (normalizedStatus.includes(WorkLocation.OFFICE) && normalizedStatus.includes(leaveKeyword)) {
      if (normalizedStatus.indexOf(WorkLocation.OFFICE) < normalizedStatus.indexOf(leaveKeyword)) {
        firstHalf = "Office";
        secondHalf = "Leave";
      } else {
        firstHalf = "Leave";
        secondHalf = "Office";
      }
    }
  }

  return { firstHalf, secondHalf };
};

const isApprovedDutyStatus = (statusStr: string): boolean => {
  const normalized = (statusStr || "").toLowerCase().trim();
  return APPROVED_DUTY_STATUS_VALUES.some(
    (target) => normalized === target || normalized.includes(target),
  );
};

const getDisplayStatus = (
  day: MobileTimesheetProps["localEntries"][number],
  holidayInfo: MobileHoliday | undefined,
) => {
  const dayOfWeek = day.fullDate.getDay();
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;
  const totalHoursValue = Number(day.totalHours || 0);
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
      ((isSunday || !!holidayInfo) && totalHoursValue >= 1 && totalHoursValue <= 9) ||
      (isSaturday && totalHoursValue >= 4 && totalHoursValue <= 9);

    return totalHoursValue > 6 || isNonWorkingFull
      ? AttendanceStatus.FULL_DAY
      : AttendanceStatus.HALF_DAY;
  }

  return displayStatus || AttendanceStatus.UPCOMING;
};

const formatTotalHours = (val: string | number | null | undefined): string =>
  (Number(val) || 0).toFixed(1);

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

  const openHoursModal = (index: number) => {
    const entry = localEntries[index];
    if (!entry) return;

    const status = (entry.status || "").toLowerCase().trim();
    const workLocation = (entry.workLocation || "").toLowerCase().trim();

    if (
      isApprovedDutyStatus(entry.status || "") ||
      isApprovedDutyStatus(entry.workLocation || "")
    ) {
      setMobileInputModal({ open: true, index: null, value: "", entry });
      return;
    }

    if (status.includes(AttendanceStatus.HALF_DAY.toLowerCase()) && workLocation === WorkLocation.OFFICE) {
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
          isBlockedHalfDay: status.includes(AttendanceStatus.HALF_DAY.toLowerCase()),
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
      setMobileInputModal({ open: true, index: null, value: "", entry });
      return;
    }

    const halfDayKeyword = AttendanceStatus.HALF_DAY.toLowerCase();
    setMobileInputModal({
      open: true,
      index: null,
      value: "",
      entry: {
        ...entry,
        isBlockedHalfDay: status.includes(halfDayKeyword),
        isBlockedHalfLeave:
          status.includes(AttendanceStatus.LEAVE.toLowerCase()) || !status.includes(halfDayKeyword),
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

    const entry = mobileInputModal.entry;

    let mode: MobileTimesheetModalMode = MobileTimesheetModalMode.HOURS;
    if (
      isApprovedDutyStatus(entry?.status || "") ||
      isApprovedDutyStatus(entry?.workLocation || "")
    ) {
      mode = MobileTimesheetModalMode.BLOCKED_APPROVED_DUTY;
    } else if (entry?.isBlockedHalfDay) {
      mode = MobileTimesheetModalMode.BLOCKED_HALF_DAY;
    } else if (entry?.isBlockedHalfLeave) {
      mode = MobileTimesheetModalMode.BLOCKED_LEAVE;
    }

    const statusLower = (entry?.status || "").toLowerCase().trim();
    const { firstHalf, secondHalf } = resolveHalfDayLabels(
      entry?.status,
      entry?.firstHalf,
      entry?.secondHalf,
    );

    const isFullWFH =
      statusLower === WorkLocation.WFH ||
      statusLower === WorkLocation.WORK_FROM_HOME ||
      statusLower === "wfh / wfh";
    const isFullClient =
      statusLower === WorkLocation.CLIENT_VISIT ||
      statusLower === "client visit / client visit";
    const areHalvesIdentical = firstHalf.toLowerCase() === secondHalf.toLowerCase() && firstHalf !== "";

    if (mode !== MobileTimesheetModalMode.HOURS) {
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
      } else if (statusLower === AttendanceStatus.LEAVE.toLowerCase()) {
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

    const preview = getHoursPreview(mobileInputModal.value, entry);
    const entryDate = entry?.fullDate ? new Date(entry.fullDate) : null;
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
                  {formatTotalHours(monthTotalHours)}
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

                const dayTone = resolveDayTone(displayStatus, day.workLocation);
                const dayToneColors = DAY_TONE_COLORS[dayTone];

                // Resolved as an inline hex style, not a Tailwind arbitrary
                // text-[#hex] class — those classes weren't reliably
                // rendering, which is why day numbers / hours / status
                // labels were showing up black instead of the intended
                // status color.
                const cellTextColor = day.isToday
                  ? DAY_TONE_COLORS[MobileTimesheetDayTone.TODAY].textHex
                  : dayToneColors.textHex;

                const statusLabel = day.status
                  ? (day.status as string).toUpperCase()
                  : "BLOCKED";

                const { firstHalf, secondHalf } = resolveHalfDayLabels(
                  day.status,
                  (day as any).firstHalf,
                  (day as any).secondHalf,
                );

                const dayOfWeek = day.fullDate.getDay();
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;
                const totalHoursValue = Number(day.totalHours || 0);
                const isNonWorkingDay = isSunday || !!holidayInfo;

                const isSplitDay =
                  !!firstHalf &&
                  !!secondHalf &&
                  !((isNonWorkingDay && totalHoursValue >= 1) || (isSaturday && totalHoursValue >= 4));

                const splitBgStyle: React.CSSProperties = isSplitDay
                  ? getSplitDayBackground(firstHalf, secondHalf)
                  : {};

                const isSundayCell = dayOfWeek === 0;

                const cellBgClass = isSundayCell
                  ? DAY_TONE_COLORS[MobileTimesheetDayTone.WEEKEND].bgClass
                  : day.isToday
                    ? DAY_TONE_COLORS[MobileTimesheetDayTone.TODAY].bgClass
                    : isSplitDay
                      ? ""
                      : dayToneColors.bgClass;
                const cellBorderClass = day.isToday
                  ? DAY_TONE_COLORS[MobileTimesheetDayTone.TODAY].borderClass
                  : isSplitDay
                    ? "border-transparent"
                    : dayToneColors.borderClass;

                // Same fix as cellTextColor above: bg-[#hex] arbitrary
                // Tailwind classes weren't reliably applying for plain
                // weekend cells (blank Sundays AND blank Saturdays — both
                // resolve to AttendanceStatus.WEEKEND via getDisplayStatus),
                // so they fell back to white. Resolve to an inline hex
                // background for that case, like the history view does.
                const isWeekendFallbackCell = displayStatus === AttendanceStatus.WEEKEND;
                const cellBgStyle: React.CSSProperties = {
                  ...splitBgStyle,
                  ...(isWeekendFallbackCell
                    ? { background: DAY_TONE_COLORS[MobileTimesheetDayTone.WEEKEND].bgHex }
                    : {}),
                };

                return (
                  <div
                    key={index}
                    id={`day-${day.fullDate.getTime()}`}
                    className={`mobile-timesheet-day relative flex flex-col items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer aspect-[4/5] sm:aspect-square w-full shadow-sm group overflow-visible
                      ${cellBgClass} ${cellBorderClass} ${highlightClass}
                      ${isBlocked ? "cursor-pointer" : "active:scale-95"}`}
                    style={cellBgStyle}
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

export default MobileTimesheet;