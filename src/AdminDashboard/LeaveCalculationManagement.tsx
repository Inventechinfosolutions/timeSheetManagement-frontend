import { useEffect, useMemo, useState } from "react";
import { Modal } from "antd";
import dayjs from "dayjs";
import {
  ArrowLeft,
  CalendarCheck,
  Info,
  Loader2,
  Save,
  Search,
  Users,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  clearLeaveManagerEmployees,
  fetchLeaveDepartments,
  fetchLeaveManagerEmployees,
  saveLeaveEntries,
  updateLeaveCalculationType,
} from "../reducers/leaveManager.reducer";
import {
  LeaveCalculationType,
  LeaveDepartment,
  LeaveManagerEmployee,
} from "../types/leaveManager.types";
import Toast from "../components/Toast";

type ToastState = { message: string; type: "success" | "error" | "info" } | null;

const formatDate = (value: string | null) =>
  value ? dayjs(value).format("DD MMM YYYY") : "—";

const formatDays = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

const isValidLeaveValue = (raw: string) => {
  if (raw.trim() === "") return false;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= 366 && (value * 2) % 1 === 0;
};

const TypeToggle = ({
  value,
  disabled,
  onChange,
}: {
  value: LeaveCalculationType;
  disabled?: boolean;
  onChange: (next: LeaveCalculationType) => void;
}) => (
  <div className="inline-flex rounded-lg bg-[#F4F7FE] p-1">
    {(["AUTO", "MANUAL"] as LeaveCalculationType[]).map((option) => {
      const active = value === option;
      return (
        <button
          key={option}
          type="button"
          disabled={disabled || active}
          onClick={() => onChange(option)}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            active
              ? option === "MANUAL"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-[#4318FF] text-white shadow-sm"
              : "text-[#A3AED0] hover:text-[#2B3674]"
          } ${disabled && !active ? "cursor-not-allowed opacity-60" : ""}`}
        >
          {option === "AUTO" ? "Auto" : "Manual"}
        </button>
      );
    })}
  </div>
);

const LeaveCalculationManagement = () => {
  const dispatch = useAppDispatch();
  const { departments, departmentsLoading, employees, employeesLoading, saving } =
    useAppSelector((state) => state.leaveManager);

  const currentYear = dayjs().year();
  const [year, setYear] = useState(currentYear);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  useEffect(() => {
    dispatch(fetchLeaveDepartments(year));
  }, [dispatch, year]);

  useEffect(() => {
    if (selectedDepartment) {
      dispatch(fetchLeaveManagerEmployees({ department: selectedDepartment, year }));
    }
  }, [dispatch, selectedDepartment, year]);

  useEffect(() => {
    if (!employees) return;
    const next: Record<string, string> = {};
    employees.employees.forEach((e) => {
      next[e.employeeId] = e.totalLeavesTaken === null ? "" : String(e.totalLeavesTaken);
    });
    setInputs(next);
  }, [employees]);

  useEffect(() => () => {
    dispatch(clearLeaveManagerEmployees());
  }, [dispatch]);

  const handleTypeChange = (dept: LeaveDepartment, next: LeaveCalculationType) => {
    Modal.confirm({
      title: `Switch ${dept.departmentName} to ${next === "MANUAL" ? "Manual" : "Auto"}?`,
      content:
        next === "MANUAL"
          ? "Leave balances for this department will use the total leaves taken you enter for each employee. Approved leave after the entry date is added on top."
          : "Leave balances for this department will be calculated only from leave requests and attendance in the system. Entered totals are kept but ignored.",
      okText: "Yes, switch",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        setUpdatingId(dept.id);
        try {
          await dispatch(
            updateLeaveCalculationType({ id: dept.id, leaveCalculationType: next }),
          ).unwrap();
          setToast({
            message: `${dept.departmentName} now uses ${next === "MANUAL" ? "manual" : "automatic"} leave calculation`,
            type: "success",
          });
          if (next === "MANUAL") setSelectedDepartment(dept.departmentName);
        } catch (err: any) {
          setToast({ message: String(err || "Failed to update"), type: "error" });
        } finally {
          setUpdatingId(null);
        }
      },
    });
  };

  const isManual = employees?.leaveCalculationType === "MANUAL";

  const filteredEmployees = useMemo(() => {
    const list = employees?.employees || [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (e) =>
        e.fullName?.toLowerCase().includes(term) ||
        e.employeeId?.toLowerCase().includes(term) ||
        e.designation?.toLowerCase().includes(term),
    );
  }, [employees, search]);

  const changedEntries = useMemo(() => {
    if (!employees) return [];
    return employees.employees.filter((e) => {
      const raw = inputs[e.employeeId] ?? "";
      if (raw.trim() === "") return false;
      return e.totalLeavesTaken === null || Number(raw) !== e.totalLeavesTaken;
    });
  }, [employees, inputs]);

  const invalidCount = useMemo(
    () =>
      Object.values(inputs).filter((raw) => raw.trim() !== "" && !isValidLeaveValue(raw)).length,
    [inputs],
  );

  const availableFor = (e: LeaveManagerEmployee) => {
    const raw = inputs[e.employeeId] ?? "";
    const taken = raw.trim() !== "" && isValidLeaveValue(raw) ? Number(raw) : e.totalLeavesTaken ?? 0;
    const unchanged = e.totalLeavesTaken !== null && taken === e.totalLeavesTaken;
    // Re-saving resets the entry date to today, so later approved leave is only kept for unchanged rows
    const usedAfter = unchanged ? e.usedAfterEntry : 0;
    return Math.max(0, e.accrued - taken - usedAfter);
  };

  const handleSave = async () => {
    if (!selectedDepartment || changedEntries.length === 0 || invalidCount > 0) return;
    try {
      const result = await dispatch(
        saveLeaveEntries({
          year,
          entries: changedEntries.map((e) => ({
            employeeId: e.employeeId,
            totalLeavesTaken: Number(inputs[e.employeeId]),
          })),
        }),
      ).unwrap();
      setToast({
        message: `Saved leaves for ${result.saved} employee${result.saved === 1 ? "" : "s"}`,
        type: "success",
      });
      dispatch(fetchLeaveManagerEmployees({ department: selectedDepartment, year }));
      dispatch(fetchLeaveDepartments(year));
    } catch (err: any) {
      setToast({ message: String(err || "Failed to save"), type: "error" });
    }
  };

  const openDepartment = (name: string) => {
    setSearch("");
    setSelectedDepartment(name);
  };

  const backToDepartments = () => {
    setSelectedDepartment(null);
    dispatch(clearLeaveManagerEmployees());
  };

  const accruedLabel =
    employees && year === currentYear
      ? `Accrued till ${dayjs().format("MMM")}`
      : "Accrued (full year)";

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          {selectedDepartment && (
            <button
              type="button"
              onClick={backToDepartments}
              className="p-2 rounded-lg bg-white border border-gray-200 text-[#2B3674] hover:bg-[#F4F7FE]"
              aria-label="Back to departments"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#2B3674]">
              {selectedDepartment ? `${selectedDepartment} — Leaves Taken` : "Leave Management"}
            </h1>
            <p className="text-sm text-[#A3AED0]">
              {selectedDepartment
                ? "Enter each employee's total leaves taken this year. Approved leave after the entry date is added automatically."
                : "Choose how leave balance is calculated for each department."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[#2B3674]" htmlFor="leave-year">
            Year
          </label>
          <select
            id="leave-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-[#2B3674] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/30"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedDepartment ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-start gap-2 px-5 py-3 bg-[#F4F7FE] text-xs text-[#2B3674]">
            <Info size={14} className="mt-0.5 shrink-0 text-[#4318FF]" />
            <span>
              <b>Auto</b> calculates leaves from requests and attendance in the system.{" "}
              <b>Manual</b> is for departments that started using the system mid-year: enter the
              total leaves each employee has taken so far, and new approved leave is added on top.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#A3AED0] border-b border-gray-100">
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Employees</th>
                  <th className="px-5 py-3 font-semibold">Leave Calculation</th>
                  <th className="px-5 py-3 font-semibold">Entries ({year})</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {departmentsLoading && departments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-[#A3AED0]">
                      <Loader2 className="inline animate-spin mr-2" size={16} />
                      Loading departments…
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-[#A3AED0]">
                      No departments found
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => {
                    const manual = dept.leaveCalculationType === "MANUAL";
                    const complete =
                      dept.employeeCount > 0 && dept.manualEntriesCount >= dept.employeeCount;
                    return (
                      <tr
                        key={dept.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-[#F4F7FE]/50"
                      >
                        <td className="px-5 py-3">
                          <div className="font-semibold text-[#2B3674]">{dept.departmentName}</div>
                          <div className="text-xs text-[#A3AED0]">{dept.departmentCode}</div>
                        </td>
                        <td className="px-5 py-3 text-[#2B3674]">
                          <span className="inline-flex items-center gap-1.5">
                            <Users size={14} className="text-[#A3AED0]" />
                            {dept.employeeCount}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <TypeToggle
                              value={dept.leaveCalculationType}
                              disabled={updatingId === dept.id}
                              onChange={(next) => handleTypeChange(dept, next)}
                            />
                            {updatingId === dept.id && (
                              <Loader2 size={14} className="animate-spin text-[#A3AED0]" />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {manual ? (
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                complete
                                  ? "bg-green-50 text-green-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {dept.manualEntriesCount}/{dept.employeeCount} entered
                            </span>
                          ) : (
                            <span className="text-xs text-[#A3AED0]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {manual ? (
                            <button
                              type="button"
                              onClick={() => openDepartment(dept.departmentName)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#4318FF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3311DB]"
                            >
                              <CalendarCheck size={14} />
                              Enter Leaves
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openDepartment(dept.departmentName)}
                              className="text-xs font-semibold text-[#4318FF] hover:underline"
                            >
                              View
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
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3AED0]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, ID or designation"
                className="h-9 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm text-[#2B3674] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/30"
              />
            </div>
            {isManual && (
              <div className="flex items-center gap-3">
                {invalidCount > 0 && (
                  <span className="text-xs text-red-600">
                    Use 0 or more in steps of 0.5
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || changedEntries.length === 0 || invalidCount > 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#4318FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3311DB] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save{changedEntries.length > 0 ? ` (${changedEntries.length})` : ""}
                </button>
              </div>
            )}
          </div>

          {!isManual && employees && (
            <div className="flex items-start gap-2 px-5 py-3 bg-amber-50 text-xs text-amber-800">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>
                This department uses automatic calculation. Switch it to Manual to enter leaves
                taken.
              </span>
            </div>
          )}

          <div className="overflow-auto max-h-[65vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="text-left text-xs uppercase tracking-wide text-[#A3AED0] border-b border-gray-100">
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-5 py-3 font-semibold">ID</th>
                  <th className="px-5 py-3 font-semibold">Joining Date</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">{accruedLabel}</th>
                  <th className="px-5 py-3 font-semibold">Total Leaves Taken</th>
                  <th className="px-5 py-3 font-semibold">Approved After Entry</th>
                  <th className="px-5 py-3 font-semibold">Available</th>
                  <th className="px-5 py-3 font-semibold">Entered On</th>
                </tr>
              </thead>
              <tbody>
                {employeesLoading && !employees ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-[#A3AED0]">
                      <Loader2 className="inline animate-spin mr-2" size={16} />
                      Loading employees…
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-[#A3AED0]">
                      No active employees found
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((e) => {
                    const raw = inputs[e.employeeId] ?? "";
                    const invalid = raw.trim() !== "" && !isValidLeaveValue(raw);
                    const dirty = changedEntries.some((c) => c.employeeId === e.employeeId);
                    return (
                      <tr
                        key={e.employeeId}
                        className={`border-b border-gray-50 last:border-0 ${dirty ? "bg-amber-50/40" : ""}`}
                      >
                        <td className="px-5 py-3">
                          <div className="font-semibold text-[#2B3674]">{e.fullName}</div>
                          <div className="text-xs text-[#A3AED0]">{e.designation}</div>
                        </td>
                        <td className="px-5 py-3 text-[#2B3674]">{e.employeeId}</td>
                        <td className="px-5 py-3 text-[#2B3674]">{formatDate(e.joiningDate)}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              e.isIntern ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {e.isIntern ? "Intern · 1/mo" : "Full Time · 1.5/mo"}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-semibold text-[#2B3674]">{formatDays(e.accrued)}</td>
                        <td className="px-5 py-3">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={raw}
                            disabled={!isManual}
                            placeholder="0"
                            onChange={(ev) =>
                              setInputs((prev) => ({ ...prev, [e.employeeId]: ev.target.value }))
                            }
                            className={`h-9 w-24 rounded-lg border px-3 text-sm text-[#2B3674] focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-[#A3AED0] ${
                              invalid
                                ? "border-red-300 focus:ring-red-200"
                                : "border-gray-200 focus:ring-[#4318FF]/30"
                            }`}
                          />
                        </td>
                        <td className="px-5 py-3 text-[#2B3674]">
                          {e.totalLeavesTaken !== null && !dirty ? formatDays(e.usedAfterEntry) : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700">
                            {formatDays(availableFor(e))}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-[#A3AED0]">{formatDate(e.asOfDate)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default LeaveCalculationManagement;
