import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Modal } from "antd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AttendanceStatus } from "../enums";
import { TimesheetEntry } from "../types";

interface EditAccessModalProps {
  open: boolean;
  onClose: () => void;
  monthDate: Date;
  entries: TimesheetEntry[];
  pendingDates: string[];
  onSubmit: (dates: string[]) => Promise<void>;
  submitting?: boolean;
  subtitle?: string;
  onMonthChange?: (next: Date) => void;
  /** Only Locked dates in the current calendar month can be requested. */
  currentMonthOnly?: boolean;
}

const EditAccessModal = ({
  open,
  onClose,
  monthDate,
  entries,
  pendingDates,
  onSubmit,
  submitting = false,
  subtitle,
  onMonthChange,
  currentMonthOnly = false,
}: EditAccessModalProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const pendingSet = useMemo(() => new Set(pendingDates), [pendingDates]);
  const isOutsideAllowedMonth =
    currentMonthOnly && !dayjs(monthDate).isSame(dayjs(), "month");

  const weeks = useMemo(() => {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const padding = first.getDay();
    const padded: (TimesheetEntry | null)[] = [
      ...Array.from({ length: padding }, () => null),
      ...entries,
    ];
    const rows: (TimesheetEntry | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      rows.push(padded.slice(i, i + 7));
    }
    return rows;
  }, [entries, monthDate]);

  const isLockedDay = (entry: TimesheetEntry | null) =>
    !!entry && !isOutsideAllowedMonth && entry.status === AttendanceStatus.LOCKED;

  const toggleDate = (dateStr: string, locked: boolean, pending: boolean) => {
    if (!locked || pending) return;
    setSelected((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr],
    );
  };

  const selectWeekLocked = (week: (TimesheetEntry | null)[]) => {
    const weekLocked = week
      .filter((day) => isLockedDay(day))
      .map((day) => dayjs(day!.fullDate).format("YYYY-MM-DD"))
      .filter((d) => !pendingSet.has(d));
    if (weekLocked.length === 0) return;
    setSelected((prev) => {
      const allSelected = weekLocked.every((d) => prev.includes(d));
      if (allSelected) {
        return prev.filter((d) => !weekLocked.includes(d));
      }
      return Array.from(new Set([...prev, ...weekLocked]));
    });
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    await onSubmit(selected);
    setSelected([]);
  };

  const handleClose = () => {
    setSelected([]);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={720}
      centered
      title={
        <div>
          <p className="text-lg font-black text-[#2B3674] mb-0">Access Request</p>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {subtitle || "Select Locked days only"}
          </p>
        </div>
      }
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          Only Locked days{currentMonthOnly ? " of the current month" : ""} can be
          requested. Pending dates are already submitted. Click a week row to
          select that week&apos;s Locked days.
        </p>
        {currentMonthOnly && (
          <span className="shrink-0 text-[11px] font-bold text-[#2B3674] px-3 py-1.5 rounded-lg bg-[#EEF2FF]">
            {dayjs(monthDate).format("MMM YYYY")}
          </span>
        )}
        {onMonthChange && !currentMonthOnly && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() =>
                onMonthChange(
                  new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1),
                )
              }
              className="p-1.5 rounded-lg hover:bg-[#EEF2FF] text-[#4318FF]"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[11px] font-bold text-[#2B3674] min-w-[110px] text-center">
              {dayjs(monthDate).format("MMM YYYY")}
            </span>
            <button
              type="button"
              onClick={() =>
                onMonthChange(
                  new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1),
                )
              }
              className="p-1.5 rounded-lg hover:bg-[#EEF2FF] text-[#4318FF]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {isOutsideAllowedMonth && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-xs font-semibold text-amber-700">
          Edit Access can only be requested for Locked days of the current month (
          {dayjs().format("MMMM YYYY")}).
        </div>
      )}

      <div className="grid grid-cols-8 gap-2 mb-2 px-1">
        <div />
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-black text-gray-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 mb-5">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-8 gap-2 items-stretch">
            <button
              type="button"
              onClick={() => selectWeekLocked(week)}
              className="text-[9px] font-black uppercase tracking-wider text-[#4318FF] bg-[#EEF2FF] rounded-lg hover:bg-[#4318FF] hover:text-white transition-all"
            >
              Week
            </button>
            {week.map((day, idx) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${weekIdx}-${idx}`}
                    className="min-h-[64px] rounded-xl bg-gray-50/40 border border-dashed border-gray-100"
                  />
                );
              }
              const dateStr = dayjs(day.fullDate).format("YYYY-MM-DD");
              const locked = isLockedDay(day);
              const pending = pendingSet.has(dateStr);
              const isSelected = selected.includes(dateStr);
              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={!locked || pending}
                  onClick={() => toggleDate(dateStr, locked, pending)}
                  className={`min-h-[64px] rounded-xl border p-1.5 text-left transition-all ${
                    pending
                      ? "bg-amber-50 border-amber-200 cursor-not-allowed"
                      : isSelected
                        ? "bg-[#4318FF] border-[#4318FF] text-white"
                        : locked
                          ? "bg-[#F3E8FF] border-[#7C3AED]/30 hover:border-[#7C3AED]"
                          : "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <p className="text-[11px] font-black">
                    {dayjs(day.fullDate).format("D")}
                  </p>
                  <p className="text-[8px] font-bold uppercase tracking-wide mt-1">
                    {pending
                      ? "Requested"
                      : locked
                        ? isSelected
                          ? "Selected"
                          : "Locked"
                        : day.status || "—"}
                  </p>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-gray-500">
          {selected.length} date{selected.length === 1 ? "" : "s"} selected
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide text-gray-500 bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selected.length === 0 || submitting}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide text-white bg-[#4318FF] disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditAccessModal;
