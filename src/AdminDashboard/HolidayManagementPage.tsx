import { useEffect, useMemo, useRef, useState } from "react";
import { DatePicker, Select, message } from "antd";
import dayjs from "dayjs";
import { ArrowLeft, CalendarDays, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
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
        popupStyle={{ zIndex: 1300 }}
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
  const navigate = useNavigate();
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
    dispatch(fetchHolidays());
  }, [dispatch]);

  const rows = useMemo(() => {
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
      message.error("Add at least one holiday");
      return;
    }
    const seen = new Set<string>();
    const next: DraftHoliday[] = [];
    for (const row of filled) {
      const name = row.name.trim();
      if (!row.date || !name) {
        message.error("Each row needs a date and a holiday name");
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
    if (ready.length === 0) return;
    setSaving(true);
    try {
      await dispatch(
        createBulkHolidays(ready.map((row) => ({ date: row.date, name: row.name }))),
      ).unwrap();
      message.success(ready.length === 1 ? "Holiday added" : "Holidays added");
      setYear(addYear);
      closeAdd();
    } catch (err: any) {
      message.error(typeof err === "string" ? err : err?.message || "Failed to add holidays");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (holiday: { id: number; dateValue: string; name: string }) => {
    setEditingId(holiday.id);
    setEditDate(holiday.dateValue);
    setEditName(holiday.name);
    closeAdd();
  };

  const handleUpdate = async () => {
    if (editingId == null) return;
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
    } catch (err: any) {
      message.error(typeof err === "string" ? err : err?.message || "Failed to update holiday");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin-dashboard")}
            className="cursor-pointer p-2 rounded-lg bg-white border border-gray-200 text-[#2B3674] hover:bg-[#F4F7FE]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#2B3674]">Holiday Management</h1>
            <p className="text-sm text-[#A3AED0]">
              Add or update master holidays. Timesheets and leave use this list.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[#2B3674]" htmlFor="holiday-year">
            Year
          </label>
          <Select
            id="holiday-year"
            value={year}
            disabled={addOpen || previewOpen}
            onChange={(value) => setYear(value)}
            className="h-9 w-[110px]"
            popupMatchSelectWidth={120}
            options={YEAR_OPTIONS.map((option) => ({
              value: option,
              label: String(option),
              title: "",
            }))}
          />
          <button
            type="button"
            onClick={openAdd}
            className="cursor-pointer inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#4318FF] px-3 text-sm font-bold text-white hover:bg-[#3311CC]"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead className="bg-[#4318FF] text-white">
              <tr className="text-left text-base tracking-wide text-white">
                <th className="px-5 py-4 font-semibold w-[90px]">SL No</th>
                <th className="px-5 py-4 font-semibold w-[240px]">Date</th>
                <th className="px-5 py-4 font-semibold">Holiday</th>
                <th className="px-5 py-4 font-semibold text-right w-[200px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-[#A3AED0]">
                    <Loader2 className="inline animate-spin mr-2" size={16} />
                    Loading holidays
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-[#A3AED0]">
                    <CalendarDays size={22} className="inline mr-2 text-[#4318FF]" />
                    No holidays for {year}. Use Add to create one.
                  </td>
                </tr>
              ) : (
                rows.map((holiday, index) => {
                  const isEditing = editingId === holiday.id;
                  return (
                    <tr
                      key={holiday.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-[#F4F7FE]/50"
                    >
                      <td className="px-5 py-4 align-middle font-semibold text-[#2B3674]">
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
                          <span className="font-semibold text-[#2B3674]">
                            {holiday.dateValue ? dayjs(holiday.dateValue).format("DD MMM YYYY") : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        {isEditing ? (
                          <input
                            value={editName}
                            maxLength={100}
                            onChange={(e) => setEditName(e.target.value)}
                            className="box-border h-10 w-full rounded-lg border border-[#4318FF] bg-white px-3 text-base leading-10 text-[#2B3674] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20"
                          />
                        ) : (
                          <span className="font-medium text-[#2B3674]">{holiday.name}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right align-middle whitespace-nowrap">
                        {isEditing ? (
                          <div className="inline-flex h-10 items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleUpdate}
                              disabled={saving}
                              className="cursor-pointer h-10 rounded-lg bg-[#4318FF] px-3 text-sm font-bold text-white hover:bg-[#3311CC] disabled:opacity-50"
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="cursor-pointer h-10 rounded-lg border border-[#4318FF] bg-white px-3 text-sm font-semibold text-[#4318FF] hover:bg-[#F4F7FE]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(holiday)}
                            className="cursor-pointer inline-flex items-center gap-1.5 text-base font-semibold text-[#4318FF] hover:underline"
                          >
                            <Pencil size={16} />
                            Edit
                          </button>
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

      {addOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1B2559]/40 p-4">
          <div
            className={`flex max-h-[90vh] w-full flex-col rounded-2xl bg-white shadow-[0px_18px_40px_rgba(112,144,176,0.18)] ${
              addStep === "year" ? "max-w-md" : "max-w-3xl"
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#2B3674]">Add holidays</h2>
                  {addStep === "rows" && (
                    <span className="rounded-[6px] bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-black text-[#1055E8]">
                      {addYear}
                    </span>
                  )}
                </div>
                {addStep === "year" && (
                  <p className="text-sm text-[#A3AED0]">Select the year, then continue.</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {addStep === "rows" && (
                  <button
                    type="button"
                    onClick={() => setDrafts((current) => [...current, blankRow()])}
                    className="cursor-pointer inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#4318FF] px-3 text-sm font-bold text-white hover:bg-[#3311CC]"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeAdd}
                  aria-label="Close"
                  className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#4318FF] text-[#4318FF] hover:bg-[#F4F7FE]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {addStep === "year" ? (
              <div className="flex flex-1 items-center justify-center px-5 py-10">
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
                    options={YEAR_OPTIONS.map((option) => ({
                      value: option,
                      label: String(option),
                      title: "",
                    }))}
                  />
                </div>
              </div>
            ) : (
              <div className="max-h-[620px] overflow-y-auto px-5 py-4">
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

            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
              {addStep === "rows" && (
                <button
                  type="button"
                  onClick={() => setAddStep("year")}
                  className="cursor-pointer h-10 rounded-lg border border-[#4318FF] bg-white px-4 text-sm font-semibold text-[#4318FF] hover:bg-[#F4F7FE]"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={addStep === "year" ? continueToRows : reviewDrafts}
                className="cursor-pointer h-10 rounded-lg bg-[#4318FF] px-5 text-sm font-bold text-white hover:bg-[#3311CC]"
              >
                {addStep === "year" ? "Next" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1B2559]/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_18px_40px_rgba(112,144,176,0.18)]">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#2B3674]">Confirm holidays</h2>
                  <span className="rounded-[6px] bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-black text-[#1055E8]">
                    {addYear}
                  </span>
                </div>
                <p className="text-sm text-[#A3AED0]">
                  Total {ready.length} holiday{ready.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Edit holidays"
                onClick={() => {
                  setPreviewOpen(false);
                  setAddStep("rows");
                  setAddOpen(true);
                }}
                className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#4318FF] text-[#4318FF] hover:bg-[#F4F7FE]"
              >
                <Pencil size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-4">
              <div className="mb-2 hidden grid-cols-[48px_120px_minmax(0,1fr)] gap-3 px-3 text-sm font-semibold text-[#2B3674] md:grid">
                <span className="text-center">SL No</span>
                <span>Date</span>
                <span>Holiday name</span>
              </div>
              <div className="space-y-3">
                {ready.map((row, index) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-1 items-center gap-3 rounded-lg border border-black/15 px-3 py-3 md:grid-cols-[48px_120px_minmax(0,1fr)]"
                  >
                    <span className="text-center text-sm font-semibold text-[#2B3674]">{index + 1}</span>
                    <span className="whitespace-nowrap font-semibold text-[#2B3674]">
                      {dayjs(row.date).format(DATE_FORMAT)}
                    </span>
                    <span className="min-w-0 break-all font-medium text-[#2B3674]">{row.name}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-lg bg-[#F4F7FE] px-3 py-3 text-sm text-[#2B3674]">
                Once saved, a holiday can be edited, but it cannot be deleted.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setPreviewOpen(false);
                  setAddStep("rows");
                  setAddOpen(true);
                }}
                className="cursor-pointer h-10 rounded-lg border border-[#4318FF] bg-white px-4 text-sm font-semibold text-[#4318FF] hover:bg-[#F4F7FE]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={acceptDrafts}
                disabled={saving}
                className="cursor-pointer h-10 rounded-lg bg-[#4318FF] px-5 text-sm font-bold text-white hover:bg-[#3311CC] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayManagementPage;
