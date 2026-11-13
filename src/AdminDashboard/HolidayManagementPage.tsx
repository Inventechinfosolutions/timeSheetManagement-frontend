import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DatePicker, Select, message } from "antd";
import dayjs from "dayjs";
import { CalendarDays, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { UserType } from "../enums";
import {
  createBulkHolidays,
  fetchHolidays,
  updateHoliday,
} from "../reducers/masterHoliday.reducer";
import { MasterHoliday } from "../types/masterHoliday.types";

const YEAR_OPTIONS = [2025, 2026, 2027, 2028, 2029, 2030];
const DATE_FORMAT = "DD-MM-YYYY";
const DEFAULT_ADD_ROWS = 10;

type DraftHoliday = { key: string; date: string; name: string };

const blankRow = (): DraftHoliday => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  date: "",
  name: "",
});

const dateKey = (value?: string) => {
  const raw = String(value || "");
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
};

const maskDate = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
};

/** Calendar plus a typed field that only shows dd-mm-yyyy. */
const HolidayDateInput = ({
  value,
  onChange,
  year,
  className = "",
  subtle = false,
}: {
  value: string;
  onChange: (isoDate: string) => void;
  year?: number;
  className?: string;
  subtle?: boolean;
}) => {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const focused = useRef(false);

  useEffect(() => {
    if (focused.current) return;
    const parsed = dayjs(value, "YYYY-MM-DD", true);
    setText(parsed.isValid() ? parsed.format(DATE_FORMAT) : "");
  }, [value]);

  const commit = (display: string) => {
    const parsed = dayjs(display, DATE_FORMAT, true);
    onChange(parsed.isValid() ? parsed.format("YYYY-MM-DD") : "");
  };

  return (
    <div className={`relative h-10 ${className}`}>
      <input
        value={text}
        inputMode="numeric"
        maxLength={10}
        placeholder="dd-mm-yyyy"
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          commit(text);
        }}
        onChange={(e) => {
          const next = maskDate(e.target.value);
          setText(next);
          commit(next);
        }}
        className={`box-border h-10 w-full rounded-lg border bg-white pl-3 pr-10 text-base leading-10 text-[#2B3674] focus:outline-none focus:ring-2 ${
          subtle
            ? "border-black/30 focus:ring-black/10"
            : "border-[#4318FF] focus:ring-[#4318FF]/20"
        }`}
      />
      <button
        type="button"
        aria-label="Open calendar"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen(true)}
        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 cursor-pointer text-[#4318FF]"
      >
        <CalendarDays size={16} />
      </button>
      <DatePicker
        open={open}
        onOpenChange={setOpen}
        placement="bottomLeft"
        value={dayjs(value, "YYYY-MM-DD", true).isValid() ? dayjs(value) : null}
        format={DATE_FORMAT}
        allowClear={false}
        inputReadOnly
        suffixIcon={null}
        defaultPickerValue={year ? dayjs(`${year}-01-01`) : undefined}
        disabledDate={year ? (current) => !current || current.year() !== year : undefined}
        popupStyle={{ zIndex: 3100 }}
        getPopupContainer={() => document.body}
        onChange={(picked) => {
          if (!picked) return;
          focused.current = false;
          setText(picked.format(DATE_FORMAT));
          onChange(picked.format("YYYY-MM-DD"));
          setOpen(false);
        }}
        className="pointer-events-none !absolute inset-0 !m-0 !h-10 !w-full !min-w-0 opacity-0"
      />
    </div>
  );
};

const HolidayManagementPage = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const canEditHolidays = currentUser?.userType !== UserType.RECEPTIONIST;
  const currentYear = dayjs().year();
  const { holidays, loading } = useAppSelector(
    (state) => state.masterHolidays || { holidays: [], loading: false },
  );

  const [year, setYear] = useState(
    YEAR_OPTIONS.includes(currentYear) ? currentYear : YEAR_OPTIONS[0],
  );
  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<"year" | "rows">("year");
  const [addYear, setAddYear] = useState(
    YEAR_OPTIONS.includes(currentYear) ? currentYear : YEAR_OPTIONS[0],
  );
  const [draftYear, setDraftYear] = useState(addYear);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [drafts, setDrafts] = useState<DraftHoliday[]>([]);
  const [ready, setReady] = useState<DraftHoliday[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchHolidays(year));
  }, [dispatch, year]);

  // Toasts must sit above Add/Confirm portals (z-[3000])
  useEffect(() => {
    message.config({ top: 80, duration: 3, maxCount: 3 });
    const styleId = "holiday-mgmt-message-z";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `.ant-message { z-index: 5000 !important; }`;
      document.head.appendChild(style);
    }
    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, []);

  const rows = useMemo(() => {
    // API already filters by year when year query is sent
    return (holidays || [])
      .map((holiday: MasterHoliday) => ({
        ...holiday,
        dateValue: dateKey(holiday.date),
      }))
      .filter((holiday) => holiday.dateValue.startsWith(String(year)))
      .sort((a, b) => a.dateValue.localeCompare(b.dateValue));
  }, [holidays, year]);

  const holidayOnDate = (isoDate: string, ignoreId?: number) =>
    (holidays || []).some((holiday: MasterHoliday) => {
      if (ignoreId != null && holiday.id === ignoreId) return false;
      return dateKey(holiday.date) === isoDate;
    });

  const validatedDate = (isoDate: string) => {
    const parsed = dayjs(isoDate, "YYYY-MM-DD", true);
    if (!isoDate || !parsed.isValid()) {
      message.error("Date must be DD-MM-YYYY");
      return "";
    }
    return isoDate;
  };

  const openAdd = () => {
    if (!canEditHolidays) return;
    setEditingId(null);
    setAddYear(year);
    setDraftYear(year);
    setAddStep("year");
    setDrafts(Array.from({ length: DEFAULT_ADD_ROWS }, () => blankRow()));
    setReady([]);
    setPreviewOpen(false);
    setAddOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
    setAddStep("year");
    setPreviewOpen(false);
    setDrafts([]);
    setReady([]);
  };

  const continueToRows = () => {
    if (addYear !== draftYear) {
      setDrafts(Array.from({ length: DEFAULT_ADD_ROWS }, () => blankRow()));
      setDraftYear(addYear);
    }
    setAddStep("rows");
  };

  const rejectOtherYear = (isoDate: string, allowedYear = addYear) => {
    if (isoDate && !isoDate.startsWith(String(allowedYear))) {
      message.error(
        `Invalid date range. Date must be within year ${allowedYear}.`,
      );
      return true;
    }
    return false;
  };

  const updateDraft = (key: string, patch: Partial<DraftHoliday>) => {
    if (patch.date) rejectOtherYear(patch.date);
    setDrafts((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  const reviewDrafts = () => {
    const filled = drafts.filter((row) => row.date || row.name.trim());
    if (filled.length === 0) {
      message.error("Please fill at least one holiday date and name before saving");
      return;
    }
    const seen = new Set<string>();
    const next: DraftHoliday[] = [];
    for (const row of filled) {
      const name = row.name.trim();
      if (!row.date || !name) {
        message.error("Each filled row needs both a date and a holiday name");
        return;
      }
      if (name.length > 100) {
        message.error("Holiday name must be 100 characters or less");
        return;
      }
      const isoDate = validatedDate(row.date);
      if (!isoDate) return;
      if (!isoDate.startsWith(String(addYear))) {
        message.error(
          `Invalid date range. Date must be within year ${addYear}.`,
        );
        return;
      }
      if (seen.has(isoDate) || holidayOnDate(isoDate)) {
        message.error(`A holiday already exists for ${dayjs(isoDate).format(DATE_FORMAT)}`);
        return;
      }
      seen.add(isoDate);
      next.push({ ...row, date: isoDate, name });
    }
    setReady(next);
    setAddOpen(false);
    setPreviewOpen(true);
  };

  const acceptDrafts = async () => {
    if (!canEditHolidays || ready.length === 0) return;
    setSaving(true);
    try {
      await dispatch(
        createBulkHolidays(ready.map((row) => ({ date: row.date, name: row.name }))),
      ).unwrap();
      message.success(ready.length === 1 ? "Holiday added" : "Holidays added");
      setYear(addYear);
      await dispatch(fetchHolidays(addYear));
      closeAdd();
    } catch (err: any) {
      message.error(typeof err === "string" ? err : err?.message || "Failed to add holidays");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (holiday: { id: number; dateValue: string; name: string }) => {
    if (!canEditHolidays) return;
    setEditingId(holiday.id);
    setEditDate(holiday.dateValue);
    setEditName(holiday.name);
    closeAdd();
  };

  const handleUpdate = async () => {
    if (!canEditHolidays || editingId == null) return;
    const name = editName.trim();
    if (!editDate || !name) {
      message.error("Date and holiday name are required");
      return;
    }
    if (name.length > 100) {
      message.error("Holiday name must be 100 characters or less");
      return;
    }
    const isoDate = validatedDate(editDate);
    if (!isoDate) return;
    if (!isoDate.startsWith(String(year))) {
      message.error(
        `Invalid date range. Date must be within year ${year}.`,
      );
      return;
    }
    if (holidayOnDate(isoDate, editingId)) {
      message.error(`A holiday already exists for ${dayjs(isoDate).format(DATE_FORMAT)}`);
      return;
    }
    setSaving(true);
    try {
      await dispatch(updateHoliday({ id: editingId, data: { date: isoDate, name } })).unwrap();
      message.success("Holiday updated");
      setEditingId(null);
      await dispatch(fetchHolidays(year));
    } catch (err: any) {
      message.error(typeof err === "string" ? err : err?.message || "Failed to update holiday");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-[#F4F7FE] font-sans min-h-full space-y-5">
      {/* Header — no outer card */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7551FF] to-[#4318FF] text-white shadow-lg shadow-[#4318FF]/30">
            <CalendarDays size={22} strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1B2559]">
              Holiday Management
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-[#707EAE]">
              {canEditHolidays
                ? "Add or update master holidays. Timesheets and leave use this list."
                : "View master holidays used by timesheets and leave."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-[#E0E5F2]">
            <label
              className="text-[11px] font-black uppercase tracking-wider text-[#707EAE]"
              htmlFor="holiday-year"
            >
              Year
            </label>
            <Select
              id="holiday-year"
              value={year}
              disabled={addOpen || previewOpen}
              onChange={(value) => setYear(value)}
              className="h-8 w-[100px]"
              popupMatchSelectWidth={120}
              options={YEAR_OPTIONS.map((option) => ({
                value: option,
                label: String(option),
                title: "",
              }))}
            />
          </div>
          <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-3 py-1.5 text-[11px] font-bold text-[#4318FF] ring-1 ring-[#4318FF]/15">
            {rows.length} {rows.length === 1 ? "holiday" : "holidays"}
          </span>
          {canEditHolidays && (
            <button
              type="button"
              onClick={openAdd}
              className="cursor-pointer inline-flex h-10 items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#7551FF] to-[#4318FF] px-4 text-sm font-bold text-white shadow-lg shadow-[#4318FF]/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all"
            >
              <Plus size={16} />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-3xl shadow-[0_18px_40px_-16px_rgba(67,24,255,0.15)] border border-white/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:text-base border-separate border-spacing-0">
            <thead>
              <tr className="bg-gradient-to-r from-[#5B2EFF] to-[#4318FF] text-white">
                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-wider w-[90px]">
                  SL No
                </th>
                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-wider w-[240px]">
                  Date
                </th>
                <th className="px-5 py-4 text-left text-[12px] font-bold uppercase tracking-wider">
                  Holiday
                </th>
                {canEditHolidays && (
                  <th className="px-5 py-4 text-right text-[12px] font-bold uppercase tracking-wider w-[200px]">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEditHolidays ? 4 : 3}
                    className="px-5 py-16 text-center text-[#A3AED0] font-semibold"
                  >
                    <Loader2 className="inline animate-spin mr-2 text-[#4318FF]" size={18} />
                    Loading holidays
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEditHolidays ? 4 : 3}
                    className="px-5 py-16 text-center"
                  >
                    <div className="inline-flex flex-col items-center gap-3">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F7FE] text-[#4318FF] ring-1 ring-[#4318FF]/10">
                        <CalendarDays size={24} />
                      </span>
                      <p className="text-sm font-semibold text-[#707EAE]">
                        {canEditHolidays
                          ? `No holidays for ${year}. Use Add to create one.`
                          : `No holidays for ${year}.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((holiday, index) => {
                  const isEditing = canEditHolidays && editingId === holiday.id;
                  return (
                    <tr
                      key={holiday.id}
                      className={`border-b border-[#F4F7FE] last:border-0 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                      } hover:bg-[#F1F4FF]`}
                    >
                      <td className="px-5 py-4 align-middle font-bold text-[#475569]">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        {isEditing ? (
                          <HolidayDateInput
                            value={editDate}
                            year={year}
                            onChange={(isoDate) => {
                              rejectOtherYear(isoDate, year);
                              setEditDate(isoDate);
                            }}
                            className="w-full"
                          />
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[#F4F7FE] px-3 py-1 text-xs font-bold text-[#4318FF] ring-1 ring-[#4318FF]/10">
                            {holiday.dateValue
                              ? dayjs(holiday.dateValue).format("DD MMM YYYY")
                              : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        {isEditing ? (
                          <input
                            value={editName}
                            maxLength={100}
                            onChange={(e) => setEditName(e.target.value)}
                            className="box-border h-10 w-full rounded-xl border border-[#4318FF]/40 bg-white px-3 text-sm font-semibold leading-10 text-[#2B3674] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                          />
                        ) : (
                          <span className="font-bold text-[#1B2559]">{holiday.name}</span>
                        )}
                      </td>
                      {canEditHolidays && (
                        <td className="px-5 py-4 text-right align-middle whitespace-nowrap">
                          {isEditing ? (
                            <div className="inline-flex h-10 items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={handleUpdate}
                                disabled={saving}
                                className="cursor-pointer h-10 rounded-xl bg-gradient-to-r from-[#7551FF] to-[#4318FF] px-4 text-sm font-bold text-white shadow-md shadow-[#4318FF]/25 hover:shadow-lg disabled:opacity-50 active:scale-95 transition-all"
                              >
                                {saving ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="cursor-pointer h-10 rounded-xl border border-[#E0E5F2] bg-white px-4 text-sm font-bold text-[#2B3674] hover:bg-[#F4F7FE] active:scale-95 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(holiday)}
                              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-[#F4F7FE] px-3 py-2 text-sm font-bold text-[#4318FF] ring-1 ring-[#4318FF]/10 hover:bg-[#EEF2FF] hover:ring-[#4318FF]/25 active:scale-95 transition-all"
                            >
                              <Pencil size={15} />
                              Edit
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canEditHolidays && addOpen &&
        createPortal(
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-[#1B2559]/45 backdrop-blur-md p-4 sm:p-6">
            <div
              className={`relative flex max-h-[min(75vh,560px)] w-full flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_24px_80px_-20px_rgba(67,24,255,0.35)] ${
                addStep === "year" ? "max-w-md" : "max-w-3xl"
              }`}
            >
              <div className="pointer-events-none absolute -top-16 right-0 h-36 w-36 rounded-full bg-[#4318FF]/12 blur-3xl" />
              <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-[#E0E5F2]/80 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7551FF] to-[#4318FF] text-white shadow-md shadow-[#4318FF]/25">
                    <Plus size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black tracking-tight text-[#1B2559]">
                        Add holidays
                      </h2>
                      {addStep === "rows" && (
                        <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-black text-[#4318FF] ring-1 ring-[#4318FF]/15">
                          {addYear}
                        </span>
                      )}
                    </div>
                    {addStep === "year" && (
                      <p className="text-xs font-medium text-[#707EAE] mt-0.5">
                        Select the year, then continue.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {addStep === "rows" && (
                    <button
                      type="button"
                      onClick={() => setDrafts((current) => [...current, blankRow()])}
                      className="cursor-pointer inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7551FF] to-[#4318FF] px-3 text-sm font-bold text-white shadow-md shadow-[#4318FF]/25 hover:shadow-lg active:scale-95 transition-all"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeAdd}
                    aria-label="Close"
                    className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#A3AED0] hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {addStep === "year" ? (
                <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-8">
                  <div className="flex flex-col items-center">
                    <label className="mb-2 text-sm font-semibold text-[#2B3674]" htmlFor="add-holiday-year">
                      Year
                    </label>
                    <Select
                      id="add-holiday-year"
                      value={addYear}
                      onChange={(value) => setAddYear(value)}
                      className="h-10 w-[160px]"
                      popupMatchSelectWidth={160}
                      getPopupContainer={() => document.body}
                      styles={{ popup: { root: { zIndex: 3100 } } }}
                      options={YEAR_OPTIONS.map((option) => ({
                        value: option,
                        label: String(option),
                        title: "",
                      }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-3">
                  <div className="mb-2 hidden grid-cols-[48px_180px_minmax(0,1fr)_40px] gap-3 px-1 text-sm font-semibold text-[#2B3674] md:grid">
                    <span className="text-center">SL No</span>
                    <span>Date</span>
                    <span>Holiday name</span>
                  </div>
                  <div className="space-y-3">
                    {drafts.map((row, index) => (
                      <div
                        key={row.key}
                        className="grid grid-cols-1 items-center gap-3 md:grid-cols-[48px_180px_minmax(0,1fr)_40px]"
                      >
                        <span className="text-center text-sm font-semibold text-[#2B3674]">{index + 1}</span>
                        <HolidayDateInput
                          value={row.date}
                          year={addYear}
                          subtle
                          onChange={(isoDate) => updateDraft(row.key, { date: isoDate })}
                        />
                        <input
                          value={row.name}
                          maxLength={100}
                          onChange={(e) => updateDraft(row.key, { name: e.target.value })}
                          className="h-10 w-full rounded-lg border border-black/30 bg-white px-3 text-base text-[#2B3674] focus:outline-none focus:ring-2 focus:ring-black/10"
                        />
                        <button
                          type="button"
                          aria-label="Remove row"
                          onClick={() =>
                            setDrafts((current) => current.filter((item) => item.key !== row.key))
                          }
                          className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#E31A1A] hover:bg-[#FEE2E2]"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative flex shrink-0 justify-end gap-2 border-t border-[#E0E5F2]/80 bg-[#F4F7FE]/50 px-5 py-4">
                {addStep === "rows" && (
                  <button
                    type="button"
                    onClick={() => setAddStep("year")}
                    className="cursor-pointer h-10 rounded-xl border border-[#E0E5F2] bg-white px-4 text-sm font-bold text-[#2B3674] hover:bg-[#EEF2FF] active:scale-95 transition-all"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={addStep === "year" ? continueToRows : reviewDrafts}
                  className="cursor-pointer h-10 rounded-xl bg-gradient-to-r from-[#7551FF] to-[#4318FF] px-5 text-sm font-bold text-white shadow-lg shadow-[#4318FF]/25 hover:shadow-xl active:scale-95 transition-all"
                >
                  {addStep === "year" ? "Next" : "Save"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {canEditHolidays && previewOpen &&
        createPortal(
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-[#1B2559]/45 backdrop-blur-md p-4 sm:p-6">
            <div className="relative flex max-h-[min(75vh,560px)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_24px_80px_-20px_rgba(67,24,255,0.35)]">
              <div className="pointer-events-none absolute -top-16 right-0 h-36 w-36 rounded-full bg-[#4318FF]/12 blur-3xl" />
              <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-[#E0E5F2]/80 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7551FF] to-[#4318FF] text-white shadow-md shadow-[#4318FF]/25">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black tracking-tight text-[#1B2559]">
                        Confirm holidays
                      </h2>
                      <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-black text-[#4318FF] ring-1 ring-[#4318FF]/15">
                        {addYear}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#707EAE] mt-0.5">
                      Total {ready.length} holiday{ready.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Edit holidays"
                  onClick={() => {
                    setPreviewOpen(false);
                    setAddStep("rows");
                    setAddOpen(true);
                  }}
                  className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F7FE] text-[#4318FF] ring-1 ring-[#4318FF]/15 hover:bg-[#EEF2FF] transition-colors"
                >
                  <Pencil size={16} />
                </button>
              </div>

              <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-4">
                <div className="mb-2 hidden grid-cols-[48px_120px_minmax(0,1fr)] gap-3 px-3 text-[11px] font-black uppercase tracking-wider text-[#707EAE] md:grid">
                  <span className="text-center">SL No</span>
                  <span>Date</span>
                  <span>Holiday name</span>
                </div>
                <div className="space-y-2.5">
                  {ready.map((row, index) => (
                    <div
                      key={row.key}
                      className="grid grid-cols-1 items-center gap-3 rounded-2xl border border-[#E0E5F2] bg-[#F4F7FE]/60 px-3 py-3 md:grid-cols-[48px_120px_minmax(0,1fr)]"
                    >
                      <span className="text-center text-sm font-bold text-[#475569]">
                        {index + 1}
                      </span>
                      <span className="inline-flex w-fit whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#4318FF] ring-1 ring-[#4318FF]/10">
                        {dayjs(row.date).format(DATE_FORMAT)}
                      </span>
                      <span className="min-w-0 break-all font-bold text-[#1B2559]">
                        {row.name}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-2xl bg-[#EEF2FF] px-3.5 py-3 text-xs font-medium text-[#2B3674] ring-1 ring-[#4318FF]/10">
                  Once saved, a holiday can be edited, but it cannot be deleted.
                </p>
              </div>

              <div className="relative flex shrink-0 justify-end gap-2 border-t border-[#E0E5F2]/80 bg-[#F4F7FE]/50 px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewOpen(false);
                    setAddStep("rows");
                    setAddOpen(true);
                  }}
                  className="cursor-pointer h-10 rounded-xl border border-[#E0E5F2] bg-white px-4 text-sm font-bold text-[#2B3674] hover:bg-[#EEF2FF] active:scale-95 transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={acceptDrafts}
                  disabled={saving}
                  className="cursor-pointer h-10 rounded-xl bg-gradient-to-r from-[#7551FF] to-[#4318FF] px-5 text-sm font-bold text-white shadow-lg shadow-[#4318FF]/25 hover:shadow-xl disabled:opacity-50 active:scale-95 transition-all"
                >
                  {saving ? "Saving..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default HolidayManagementPage;
