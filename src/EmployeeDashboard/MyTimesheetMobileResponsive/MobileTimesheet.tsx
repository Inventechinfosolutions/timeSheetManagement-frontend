import { useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Lock, Rocket, X } from "lucide-react";
import {
  AttendanceStatus,
  WorkLocation as WorkLocationLabel,
  WorkLocationKeyword,
} from "../../enums";
import {
  MobileTimesheetModalMode,
  MobileTimesheetDayTone,
  MobileTimesheetLabel,
  MobileTimesheetMessage,
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

// Hours thresholds used across getHoursPreview / getDisplayStatus / split-day logic.
const MAX_LOGGABLE_HOURS = 9;
const FULL_DAY_HOURS_THRESHOLD = 6; // > this many hours on a normal weekday counts as Full Day
const SATURDAY_FULL_DAY_MIN_HOURS = 4;
const WEEKEND_FULL_DAY_MIN_HOURS = 1;

const QUICK_SELECT_HOURS = ["4", "5", "6", "7.5", String(MAX_LOGGABLE_HOURS)];
const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface ExtendedInputModalState
  extends Omit<MobileTimesheetInputModalState, "entry"> {
  entry:
  | (MobileTimesheetInputModalState["entry"] & {
    isBlockedHalfDay?: boolean;
    isBlockedHalfLeave?: boolean;
    firstHalf?: string | null;
    secondHalf?: string | null;
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

// Saturdays with no data fold into the same weekend styling as Sunday, so both
// tones share one definition instead of two copies of the same hex values.
const WEEKEND_TONE_COLOR: DayToneColor = {
  bgClass: "bg-[#FEE2E2]",
  bgHex: "#FEE2E2",
  textHex: "#EE5D50",
  borderClass: "border-[#EE5D50]/10",
};

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
  [MobileTimesheetDayTone.WEEKEND]: WEEKEND_TONE_COLOR,
  [MobileTimesheetDayTone.SATURDAY]: WEEKEND_TONE_COLOR,
  [MobileTimesheetDayTone.ABSENT_OR_LEAVE]: {
    bgClass: "bg-[#FECACA]",
    bgHex: "#FECACA",
    textHex: "#DC2626",
    borderClass: "border-[#DC2626]/20",
  },
  [MobileTimesheetDayTone.HALF_DAY]: {
    bgClass: "bg-[#FEF3C7]",
    bgHex: "#FEF3C7",
    textHex: "#DC2626",
    borderClass: "border-[#DC2626]/20",
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
    bgHex: "#FFECDB ",
    textHex: "#4318FF",
    borderClass: "border-[#4318FF]/20",
  },
  [MobileTimesheetDayTone.WFH]: {
    bgClass: "bg-[#d2dcfcff]",
    bgHex: "#E2CAFF",
    textHex: "#4F46E5",
    borderClass: "border-[#6366F1]/20",
  },
};

/** Hours-input modal preview badge uses its own (slightly different)
 *  palette from the grid cells, matching the original design exactly. */
const WEEKEND_PREVIEW_STYLE = { bg: "bg-[#8F9BBA]/20", text: "text-[#8F9BBA]" };

const HOURS_PREVIEW_STYLES: Record<
  MobileTimesheetDayTone,
  { bg: string; text: string }
> = {
  [MobileTimesheetDayTone.DEFAULT]: { bg: "bg-gray-100", text: "text-gray-500" },
  [MobileTimesheetDayTone.TODAY]: { bg: "bg-white", text: "text-[#4318FF]" },
  [MobileTimesheetDayTone.WEEKEND]: WEEKEND_PREVIEW_STYLE,
  [MobileTimesheetDayTone.SATURDAY]: WEEKEND_PREVIEW_STYLE,
  [MobileTimesheetDayTone.ABSENT_OR_LEAVE]: { bg: "bg-[#FECACA]", text: "text-[#DC2626]" },
  [MobileTimesheetDayTone.HALF_DAY]: { bg: "bg-[#FEF3C7]", text: "text-[#FFB020]" },
  [MobileTimesheetDayTone.HOLIDAY]: { bg: "bg-[#DBEAFE]", text: "text-[#1890FF]" },
  [MobileTimesheetDayTone.PRESENT]: { bg: "bg-[#E6FFFA]", text: "text-[#01B574]" },
  [MobileTimesheetDayTone.CLIENT_VISIT]: { bg: "bg-[#f2fcbd]", text: "text-[#4318FF]" },
  [MobileTimesheetDayTone.WFH]: { bg: "bg-[#d2dcfcff]", text: "text-[#4F46E5]" },
};

// Static legend data — hoisted out of the render body so it isn't rebuilt on every render.
const DAY_LEGEND_ITEMS = [
  { label: AttendanceStatus.FULL_DAY, color: "bg-emerald-50", border: "border-emerald-400" },
  { label: "Half Day Leave", color: "bg-amber-50", border: "border-amber-300" },
  { label: AttendanceStatus.ABSENT, color: "bg-red-100", border: "border-red-400" },
  { label: AttendanceStatus.LEAVE, color: "bg-red-50", border: "border-red-300" },
  { label: AttendanceStatus.WFH, color: "bg-[#d2dcfcff]", border: "border-[#8FA8F8]" },
  { label: "Today", color: "bg-[#4318FF]", border: "border-transparent" },
  { label: AttendanceStatus.CLIENT_VISIT, color: "bg-[#F2FCBD]", border: "border-[#B7D94A]" },
  { label: AttendanceStatus.NOT_UPDATED, color: "bg-[#F8FAFC]", border: "border-[#64748B]" },
  { label: AttendanceStatus.HOLIDAY, color: "bg-cyan-50", border: "border-cyan-300" },
  { label: "Upcoming", color: "bg-[#F8FAFC]", border: "border-[#64748B]" },
  { label: "Blocked", color: "bg-gray-100", border: "border-gray-300" },
];

/** Shared `(value || "").toLowerCase().trim()` used everywhere status/location
 *  strings need comparing, instead of re-typing it in each function. */
const normalize = (value: string | null | undefined): string =>
  (value || "").toLowerCase().trim();

const isStatusMatch = (status: string | null | undefined, keyword: string): boolean =>
  normalize(status).includes(keyword.toLowerCase());

const isExactMatch = (status: string | null | undefined, keyword: string): boolean =>
  normalize(status) === keyword.toLowerCase();

// Helpers for Status/Location Matching
const isHalfDay = (status?: string | null) => isStatusMatch(status, AttendanceStatus.HALF_DAY);
const isLeaveStatus = (status?: string | null) => isStatusMatch(status, AttendanceStatus.LEAVE);
const isHolidayStatus = (status?: string | null) => isExactMatch(status, AttendanceStatus.HOLIDAY);
const isWeekendStatus = (status?: string | null) => isExactMatch(status, AttendanceStatus.WEEKEND);
const isAbsentStatus = (status?: string | null) => isStatusMatch(status, AttendanceStatus.ABSENT);
const isFullDayStatus = (status?: string | null) => isExactMatch(status, AttendanceStatus.FULL_DAY);

const isWFHLocation = (location?: string | null) =>
  isExactMatch(location, WorkLocationKeyword.WFH) ||
  isExactMatch(location, WorkLocationKeyword.WORK_FROM_HOME);

const isClientVisitLocation = (location?: string | null) =>
  isExactMatch(location, WorkLocationKeyword.CLIENT_VISIT) ||
  isExactMatch(location, WorkLocationKeyword.CLIENT_PLACE) ||
  isExactMatch(location, WorkLocationKeyword.CLIENT);

const isOfficeLocation = (location?: string | null) =>
  isExactMatch(location, WorkLocationKeyword.OFFICE);

const isApprovedDutyStatus = (statusStr?: string | null, workLocStr?: string | null): boolean => {
  return isWFHLocation(statusStr) || isWFHLocation(workLocStr) ||
    isClientVisitLocation(statusStr) || isClientVisitLocation(workLocStr);
};

const isSundayDate = (date: Date | null | undefined): boolean => date?.getDay() === 0;
const isSaturdayDate = (date: Date | null | undefined): boolean => date?.getDay() === 6;

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
    return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.DEFAULT], label: MobileTimesheetLabel.ENTER_HOURS };
  }

  const hours = parseFloat(value);
  const entryDate = entry.fullDate ? new Date(entry.fullDate) : null;
  const isSunday = isSundayDate(entryDate);
  const isSaturday = isSaturdayDate(entryDate);

  if (hours > MAX_LOGGABLE_HOURS) {
    return {
      ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.ABSENT_OR_LEAVE],
      label: `${MobileTimesheetMessage.MAX_HOURS_PREFIX}${MAX_LOGGABLE_HOURS}${MobileTimesheetMessage.MAX_HOURS_SUFFIX}`,
    };
  }

  if (!value || Number.isNaN(hours)) {
    return isSunday
      ? { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.WEEKEND], label: MobileTimesheetLabel.WEEK_OFF }
      : { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.DEFAULT], label: MobileTimesheetLabel.NO_HOURS };
  }

  if (isSunday && hours >= WEEKEND_FULL_DAY_MIN_HOURS) {
    return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.PRESENT], label: MobileTimesheetLabel.FULL_DAY_WEEKEND };
  }

  if (isSaturday && hours >= SATURDAY_FULL_DAY_MIN_HOURS) {
    return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.PRESENT], label: MobileTimesheetLabel.FULL_DAY_SAT };
  }

  if (hours > FULL_DAY_HOURS_THRESHOLD) {
    return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.PRESENT], label: `${MobileTimesheetMessage.FULL_DAY_PREFIX}${hours}h` };
  }

  if (hours > 0 && hours <= FULL_DAY_HOURS_THRESHOLD) {
    return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.HALF_DAY], label: `${MobileTimesheetMessage.HALF_DAY_PREFIX}${hours}h` };
  }

  if (hours === 0) {
    return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.ABSENT_OR_LEAVE], label: AttendanceStatus.ABSENT };
  }

  return { ...HOURS_PREVIEW_STYLES[MobileTimesheetDayTone.DEFAULT], label: MobileTimesheetLabel.ENTER_HOURS };
};

const resolveDayTone = (
  status: string | null | undefined,
  workLocation?: string | null,
): MobileTimesheetDayTone => {
  if (isHolidayStatus(status)) return MobileTimesheetDayTone.HOLIDAY;
  if (isWeekendStatus(status) || isLeaveStatus(status) || isAbsentStatus(status)) return MobileTimesheetDayTone.ABSENT_OR_LEAVE;
  if (isFullDayStatus(status) || isOfficeLocation(workLocation) || isOfficeLocation(status)) return MobileTimesheetDayTone.PRESENT;
  if (isHalfDay(status)) return MobileTimesheetDayTone.HALF_DAY;
  if (isWFHLocation(status) || isWFHLocation(workLocation)) return MobileTimesheetDayTone.WFH;
  if (isClientVisitLocation(status) || isClientVisitLocation(workLocation)) return MobileTimesheetDayTone.CLIENT_VISIT;

  return MobileTimesheetDayTone.DEFAULT;
};

/** Same tone vocabulary, applied to a single half-day label ("Office",
 *  "WFH", "Leave", ...) so the split-day gradient can reuse DAY_TONE_COLORS
 *  instead of re-deriving colors by hand. */
const resolveHalfDayTone = (halfDayLabel: string): MobileTimesheetDayTone => {
  if (isOfficeLocation(halfDayLabel)) return MobileTimesheetDayTone.PRESENT;
  if (isWFHLocation(halfDayLabel)) return MobileTimesheetDayTone.WFH;
  if (isClientVisitLocation(halfDayLabel)) return MobileTimesheetDayTone.CLIENT_VISIT;
  if (isLeaveStatus(halfDayLabel) || isAbsentStatus(halfDayLabel)) return MobileTimesheetDayTone.ABSENT_OR_LEAVE;
  return MobileTimesheetDayTone.DEFAULT;
};
/** Returns the two solid hex colors for a split day, so they can be painted
 *  as two exact-50%-height blocks instead of a CSS gradient. Hard-stop
 *  gradients (`color 50%, color 50%`) can rasterize with an uneven or
 *  blurry seam at small cell sizes/DPRs — rendering two real elements each
 *  pinned to `h-1/2` guarantees an always-even, crisp split. */
const getSplitDayHexPair = (
  firstHalf: string,
  secondHalf: string,
): { firstHex: string; secondHex: string } => {
  const firstTone = resolveHalfDayTone(firstHalf);
  const secondTone = resolveHalfDayTone(secondHalf);
  return {
    firstHex: DAY_TONE_COLORS[firstTone].bgHex,
    secondHex: DAY_TONE_COLORS[secondTone].bgHex,
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
    const normalizedStatus = normalize(status);
    if (normalizedStatus.includes(WorkLocationKeyword.OFFICE) && normalizedStatus.includes(AttendanceStatus.LEAVE.toLowerCase())) {
      if (normalizedStatus.indexOf(WorkLocationKeyword.OFFICE) < normalizedStatus.indexOf(AttendanceStatus.LEAVE.toLowerCase())) {
        firstHalf = WorkLocationLabel.OFFICE;
        secondHalf = AttendanceStatus.LEAVE;
      } else {
        firstHalf = AttendanceStatus.LEAVE;
        secondHalf = WorkLocationLabel.OFFICE;
      }
    }
  }

  return { firstHalf, secondHalf };
};

/** Consolidates the "is this entry an approved duty (WFH/Client Visit/etc.)"
 *  check that was previously duplicated across openHoursModal, openBlockedModal,
 *  and renderInputModal. */
const hasApprovedDutyStatus = (
  entry: { status?: string | null; workLocation?: string | null } | null | undefined,
): boolean => isApprovedDutyStatus(entry?.status, entry?.workLocation);

const getDisplayStatus = (
  day: MobileTimesheetProps["localEntries"][number],
  holidayInfo: MobileHoliday | undefined,
) => {
  const isSunday = isSundayDate(day.fullDate);
  const isSaturday = isSaturdayDate(day.fullDate);
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

  if (isAbsentStatus(displayStatus)) {
    return AttendanceStatus.ABSENT;
  }

  if (holidayInfo || isHolidayStatus(displayStatus)) {
    return AttendanceStatus.HOLIDAY;
  }

  if (isSunday || isSaturdayWithNoData) {
    return AttendanceStatus.WEEKEND;
  }

  if (
    day.totalHours &&
    totalHoursValue > 0 &&
    !isAbsentStatus(displayStatus) &&
    !isLeaveStatus(displayStatus)
  ) {
    const isNonWorkingFull =
      ((isSunday || !!holidayInfo) &&
        totalHoursValue >= WEEKEND_FULL_DAY_MIN_HOURS &&
        totalHoursValue <= MAX_LOGGABLE_HOURS) ||
      (isSaturday &&
        totalHoursValue >= SATURDAY_FULL_DAY_MIN_HOURS &&
        totalHoursValue <= MAX_LOGGABLE_HOURS);

    return totalHoursValue > FULL_DAY_HOURS_THRESHOLD || isNonWorkingFull
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

    const status = normalize(entry.status);
    const workLocation = normalize(entry.workLocation);

    if (hasApprovedDutyStatus(entry)) {
      setMobileInputModal({ open: true, index: null, value: "", entry });
      return;
    }

    if (isHalfDay(status) && isOfficeLocation(workLocation)) {
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
          isBlockedHalfDay: isHalfDay(status),
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
    const status = normalize(entry.status);

    if (hasApprovedDutyStatus(entry)) {
      setMobileInputModal({ open: true, index: null, value: "", entry });
      return;
    }

    setMobileInputModal({
      open: true,
      index: null,
      value: "",
      entry: {
        ...entry,
        isBlockedHalfDay: isHalfDay(status),
        isBlockedHalfLeave:
          isLeaveStatus(status) || !isHalfDay(status),
      },
    });
  };

  const closeModal = () => setMobileInputModal(emptyInputModal);

  const handleModalSubmit = () => {
    const currentModal = mobileInputModal;
    const hours = parseFloat(currentModal.value);

    if (!Number.isNaN(hours) && hours > MAX_LOGGABLE_HOURS) {
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
    if (hasApprovedDutyStatus(entry)) {
      mode = MobileTimesheetModalMode.BLOCKED_APPROVED_DUTY;
    } else if (entry?.isBlockedHalfDay) {
      mode = MobileTimesheetModalMode.BLOCKED_HALF_DAY;
    } else if (entry?.isBlockedHalfLeave) {
      mode = MobileTimesheetModalMode.BLOCKED_LEAVE;
    }

    const statusLower = normalize(entry?.status);
    const { firstHalf, secondHalf } = resolveHalfDayLabels(
      entry?.status,
      entry?.firstHalf,
      entry?.secondHalf,
    );

    const isFullWFH =
      isWFHLocation(entry?.status) ||
      statusLower === `${WorkLocationKeyword.WFH} / ${WorkLocationKeyword.WFH}`;

    const isFullClient =
      isClientVisitLocation(entry?.status) ||
      statusLower === `${WorkLocationKeyword.CLIENT_VISIT} / ${WorkLocationKeyword.CLIENT_VISIT}`;

    const areHalvesIdentical = firstHalf.toLowerCase() === secondHalf.toLowerCase() && firstHalf !== "";

    if (mode !== MobileTimesheetModalMode.HOURS) {
      let modalHeaderTitle: string = AttendanceStatus.LEAVE;
      let modalBodyText: string = MobileTimesheetMessage.HOURS_ASSIGNED_LEAVE;

      if (isFullClient || (areHalvesIdentical && isClientVisitLocation(firstHalf))) {
        modalHeaderTitle = WorkLocationLabel.CLIENT_VISIT;
        modalBodyText = MobileTimesheetMessage.HOURS_ASSIGNED_CLIENT;
      } else if (isFullWFH || (areHalvesIdentical && isWFHLocation(firstHalf))) {
        modalHeaderTitle = WorkLocationLabel.WORK_FROM_HOME;
        modalBodyText = MobileTimesheetMessage.HOURS_ASSIGNED_WFH;
      } else if (areHalvesIdentical) {
        modalHeaderTitle = firstHalf;
        modalBodyText = `${MobileTimesheetMessage.HOURS_ASSIGNED_GENERIC_PREFIX}${firstHalf.toLowerCase()}${MobileTimesheetMessage.HOURS_ASSIGNED_STATUS_SUFFIX}`;
      } else if (firstHalf && secondHalf) {
        modalHeaderTitle = `Half Day (${firstHalf} / ${secondHalf})`;
        modalBodyText = `${MobileTimesheetMessage.HOURS_ASSIGNED_HALF_DAY} "${firstHalf}" and the 2nd half is "${secondHalf}" and cannot be edited.`;
      } else if (isLeaveStatus(entry?.status)) {
        modalHeaderTitle = AttendanceStatus.LEAVE;
        modalBodyText = MobileTimesheetMessage.HOURS_ASSIGNED_LEAVE;
      } else {
        const fallbackLabel = entry?.status || AttendanceStatus.WEEKEND;
        modalHeaderTitle = fallbackLabel;
        modalBodyText = `${MobileTimesheetMessage.HOURS_ASSIGNED_GENERIC_PREFIX}${fallbackLabel.toLowerCase()}${MobileTimesheetMessage.HOURS_ASSIGNED_GENERIC_SUFFIX}`;
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
                {MobileTimesheetLabel.OK}
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
          className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden mobile-timesheet-modal relative"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="bg-gradient-to-br from-[#4318FF] to-[#6B4EFF] px-6 pt-5 pb-5">
            <button
              onClick={closeModal}
              className="absolute top-2 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all"
              aria-label="Close"
            >
              <X size={18} className="text-white" strokeWidth={2.5} />
            </button>
            <p className="text-white/70 text-sm font-bold uppercase tracking-widest text-center mb-1">
              {dayLabel}
            </p>
            <h3 className="text-2xl font-black text-white text-center">
              {MobileTimesheetLabel.LOG_HOURS}
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
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const hours = parseFloat(mobileInputModal.value);
                  const isOverMax = !Number.isNaN(hours) && hours > MAX_LOGGABLE_HOURS;
                  if (!loading && !isOverMax) {
                    handleModalSubmit();
                  }
                }
              }}
              className="w-full border-2 border-gray-200 focus:border-[#4318FF] rounded-2xl p-4 text-center text-4xl font-black text-[#2B3674] outline-none transition-all duration-200"
              placeholder="0"
              min="0"
              max={MAX_LOGGABLE_HOURS}
              step="0.5"
            />
            <p className="text-center text-xs text-gray-400 mt-2 font-medium">
              {MobileTimesheetMessage.ENTER_HOURS_PLACEHOLDER}{MAX_LOGGABLE_HOURS})
            </p>
          </div>

          <div className="px-6 pt-2 pb-3">
            <p className="text-center text-xs text-gray-400 mt-2 font-medium">
              {MobileTimesheetLabel.QUICK_SELECT}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {QUICK_SELECT_HOURS.map((hours) => (
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
                  parseFloat(mobileInputModal.value) > MAX_LOGGABLE_HOURS)
              }
              className={`flex-1 py-3.5 rounded-2xl bg-[#4318FF] text-white font-black text-sm shadow-lg shadow-blue-500/30 transition-all active:scale-95 ${loading ||
                (!Number.isNaN(parseFloat(mobileInputModal.value)) &&
                  parseFloat(mobileInputModal.value) > MAX_LOGGABLE_HOURS)
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
        className={`mobile-timesheet-shell flex flex-col ${containerClassName || "h-full max-h-full overflow-visible bg-[#F4F7FE]  pt-[1px] relative"}`}
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

        <div className="flex-1 overflow-visible mt-2 mb-3 flex flex-col bg-transparent pt-2 pb-2 pl-0 shadow-none border-none">
          <div className="mobile-timesheet-toolbar">
            <div className="mobile-timesheet-summary-row flex flex-row flex-nowrap items-center w-full overflow-visible">
              {/* Month navigator — always fixed width on the left */}
              <div className="mobile-timesheet-month-selector flex items-center justify-start gap-0.5 flex-shrink-0">
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

              {/* Right group: total + autofill share the same flex row so they
                  can never overlap — total is always to the LEFT of the button */}
              <div className="mobile-timesheet-right-group ">
                <div className="mobile-timesheet-total">
                  <p className="mobile-timesheet-total-label tracking-tight uppercase font-black text-gray-600 leading-none whitespace-nowrap">
                    TOTAL <span className="mobile-timesheet-total-label-long">TRACKED</span>:
                  </p>
                  <p className="mobile-timesheet-total-value font-black text-[#4318FF] leading-none whitespace-nowrap">
                    {formatTotalHours(monthTotalHours)}
                  </p>
                  <span className="mobile-timesheet-total-unit font-bold text-gray-500 whitespace-nowrap">hrs</span>
                </div>

                <div className="mobile-timesheet-actions">
                  {(!effectiveReadOnly ||
                    (isAdmin && !isAdminView) ||
                    (isManager && !isManagerView)) &&
                    isViewedMonthEligible && (
                      <button
                        onClick={handleAutoUpdateClick}
                        className="mobile-timesheet-autofill-btn flex flex-row items-center justify-center mr-2 gap-1.5 py-1 px-2.5 rounded-lg font-black text-[7.5px] uppercase tracking-wide text-white transition-all active:scale-95 bg-[#4318FF] whitespace-nowrap text-left"
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
          </div>

          <div className="p-1 flex flex-col flex-1 overflow-visible">
            <div className="mobile-timesheet-weekday-row grid grid-cols-7 gap-1.5 mb-1 px-1 pb-1">
              {WEEKDAY_LABELS.map((dayName) => (
                <div
                  key={dayName}
                  className="mobile-timesheet-weekday-cell text-center text-[10px] font-black text-[#8F9BBA] uppercase tracking-wider"
                >
                  {dayName}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2 overflow-visible p-0 pt-1 pb-1 mobile-timesheet-grid">
              {Array.from({ length: paddingDays }).map((_, index) => (
                <div key={`p-${index}`} className="min-h-[40px]" />
              ))}

              {localEntries.map((day, index) => {
                const holidayInfo = getHolidayForDate(day.fullDate, holidays);
                const isHoliday = !!holidayInfo; // NEW: single source of truth for "this cell is a holiday"
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

                // const dayTone = resolveDayTone(displayStatus, day.workLocation);
                const dayTone = isHoliday
                  ? MobileTimesheetDayTone.HOLIDAY
                  : resolveDayTone(displayStatus, day.workLocation);
                const dayToneColors = DAY_TONE_COLORS[dayTone];

                const cellTextColor = isHoliday
                  ? DAY_TONE_COLORS[MobileTimesheetDayTone.HOLIDAY].textHex
                  : day.isToday
                    ? DAY_TONE_COLORS[MobileTimesheetDayTone.TODAY].textHex
                    : dayToneColors.textHex;;

                const statusLabel = day.status
                  ? (day.status as string).toUpperCase()
                  : "BLOCKED";

                const { firstHalf, secondHalf } = resolveHalfDayLabels(
                  day.status,
                  (day as any).firstHalf,
                  (day as any).secondHalf,
                );

                const isSunday = isSundayDate(day.fullDate);
                const isSaturday = isSaturdayDate(day.fullDate);
                const totalHoursValue = Number(day.totalHours || 0);
                const isNonWorkingDay = isSunday || !!holidayInfo;

                // NEW: weekday Full Day / Absent cells don't set isBlocked, so they need
                // their own flags to get a status label like WFH/Client Visit/split-day/Leave do.
                const isFullDayStatusCell = !isBlocked && displayStatus === AttendanceStatus.FULL_DAY;
                const isAbsentStatusCell = !isBlocked && displayStatus === AttendanceStatus.ABSENT;

                const isSplitDay =
                  !isHoliday && // NEW guard
                  !!firstHalf &&
                  !!secondHalf &&
                  !(
                    (isNonWorkingDay && totalHoursValue >= WEEKEND_FULL_DAY_MIN_HOURS) ||
                    (isSaturday && totalHoursValue >= SATURDAY_FULL_DAY_MIN_HOURS)
                  );

                // Two solid hex colors for the split-day background layer
                // (rendered as two exact-50%-height blocks below, instead of
                // a CSS gradient, so the divide is always crisp and even).
                const splitDayHexPair = isSplitDay
                  ? getSplitDayHexPair(firstHalf, secondHalf)
                  : null;

                const cellBgClass = isHoliday
                  ? DAY_TONE_COLORS[MobileTimesheetDayTone.HOLIDAY].bgClass
                  : isSunday
                    ? DAY_TONE_COLORS[MobileTimesheetDayTone.WEEKEND].bgClass
                    : day.isToday
                      ? DAY_TONE_COLORS[MobileTimesheetDayTone.TODAY].bgClass
                      : isSplitDay
                        ? ""
                        : dayToneColors.bgClass;

                const cellBorderClass = isHoliday
                  ? DAY_TONE_COLORS[MobileTimesheetDayTone.HOLIDAY].borderClass
                  : day.isToday
                    ? DAY_TONE_COLORS[MobileTimesheetDayTone.TODAY].borderClass
                    : isSplitDay
                      ? "border-transparent"
                      : dayToneColors.borderClass;

                const isWeekendFallbackCell = !isHoliday && displayStatus === AttendanceStatus.WEEKEND;
                const cellBgStyle: React.CSSProperties = {
                  ...(isWeekendFallbackCell
                    ? { background: DAY_TONE_COLORS[MobileTimesheetDayTone.WEEKEND].bgHex }
                    : {}),
                  // Split-day cells paint their own two-tone background right up to
                  // the edge (see the masked layer below); a leftover border here
                  // would show a thin line where the page background peeks through
                  // between the border and the rounded mask, so drop the border
                  // entirely for these cells instead of just making it transparent.
                  ...(isSplitDay && !isWeekendFallbackCell ? { borderWidth: 0 } : {}),
                };

                // NEW: whether this cell actually shows an hours value — drives whether
                // the status label sits at the bottom (hours present, so center is taken)
                // or centered (no hours to occupy the middle of the box).
                const hasHours =
                  day.totalHours !== null &&
                  day.totalHours !== undefined &&
                  Number(day.totalHours) > 0 &&
                  !isBlocked;

                return (
                  <div
                    key={index}
                    id={`day-${day.fullDate.getTime()}`}
                    className={`mobile-timesheet-day relative flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer aspect-square w-full shadow-sm group overflow-visible
      ${cellBgClass} ${cellBorderClass} ${highlightClass}
      ${isBlocked ? "cursor-pointer" : "active:scale-95"}`}
                    style={cellBgStyle}
                    onClick={() => openHoursModal(index)}
                  >
                    {/* {isSplitDay && splitDayHexPair && !isWeekendFallbackCell && (
                      <div
                        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
                        style={{ borderRadius: "inherit" }}
                      >
                        <div
                          className="absolute inset-x-0 top-0 h-1/2"
                          style={{ background: splitDayHexPair.firstHex }}
                        />
                        <div
                          className="absolute inset-x-0 bottom-0 h-1/2"
                          style={{ background: splitDayHexPair.secondHex }}
                        />
                      </div>
                    )} */}

                    {isSplitDay && splitDayHexPair && !isWeekendFallbackCell && (
                      <div
                        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
                        style={{ borderRadius: "inherit" }}
                      >
                        {splitDayHexPair.firstHex === splitDayHexPair.secondHex ? (
                          // Both halves resolve to the same tone (e.g. duplicate "Leave"/"Leave"
                          // labels) — paint one solid block instead of two, so there's no seam
                          // to show through at all.
                          <div
                            className="absolute inset-0"
                            style={{ background: splitDayHexPair.firstHex }}
                          />
                        ) : (
                          // Both blocks anchored from the SAME edge (top), with a 1px overlap
                          // at the seam. Anchoring one from `top` and the other from `bottom`
                          // (the old code) lets the browser round each side's pixel boundary
                          // independently — that's what leaves a hairline gap where the white
                          // cell background peeks through. The overlap guarantees full coverage.
                          <>
                            <div
                              className="absolute inset-x-0"
                              style={{ top: 0, height: "calc(50% + 1px)", background: splitDayHexPair.firstHex }}
                            />
                            <div
                              className="absolute inset-x-0"
                              style={{ top: "calc(50% - 1px)", bottom: 0, background: splitDayHexPair.secondHex }}
                            />
                          </>
                        )}
                      </div>
                    )}

                    {(isBlocked || isSunday || isSaturday) && (
                      <div
                        className="absolute top-0.5 right-0.5 cursor-pointer z-30 p-0.5"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openBlockedModal(day);
                        }}
                      >
                        <Lock
                          size={7}
                          color={cellTextColor}
                          className="opacity-85 mobile-timesheet-lock-icon"
                        />
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
                      <span
                        className={`mobile-timesheet-day-number text-[13px] font-extrabold ${day.isToday ? "font-black" : ""} leading-none`}
                        style={{ color: cellTextColor }}
                      >
                        {day.date}
                      </span>

                      {hasHours && (
                        <span
                          className="mobile-timesheet-day-hours text-[10px] font-black opacity-80"
                          style={{ color: cellTextColor }}
                        >
                          {Number(day.totalHours)}h
                        </span>
                      )}
                    </div>

                    {/* Status label — inside the box, always anchored to the bottom edge */}
                    {/* Status label — inside the box, always anchored to the bottom edge.
    Now also shown for non-blocked weekday cells resolved as Full Day or
    Absent, matching the label already shown for WFH/Client Visit/split-day/Leave. */}
                    {(isBlocked || isSunday || isSaturday || isFullDayStatusCell || isAbsentStatusCell) && (
                      <div
                        className="mobile-timesheet-day-status-label absolute inset-x-0 bottom-1 flex flex-col items-center justify-center p-0.5 text-center cursor-pointer z-20"
                        onClick={
                          isBlocked
                            ? (event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              openBlockedModal(day);
                            }
                            : undefined
                        }
                      >
                        <span
                          className="text-[6px] font-black leading-none uppercase tracking-tighter max-w-full truncate px-0.5"
                          style={{ color: cellTextColor }}
                        >
                          {isBlocked
                            ? statusLabel
                            : isFullDayStatusCell
                              ? AttendanceStatus.FULL_DAY
                              : isAbsentStatusCell
                                ? AttendanceStatus.ABSENT
                                : AttendanceStatus.WEEKEND}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mobile-timesheet-legend flex flex-wrap gap-x-4 gap-y-3 px-4 py-3 mb-4 bg-white border border-gray-100 rounded-xl shadow-sm items-center justify-start">
              {DAY_LEGEND_ITEMS.map((item) => (
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