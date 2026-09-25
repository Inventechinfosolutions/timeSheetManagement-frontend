import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  ArrowLeft,
  Loader2,
  Calendar,
  FileSpreadsheet,
  Users,
  Building2,
  ChevronDown,
  ArrowRightLeft,
  RotateCw,
} from "lucide-react";
import { saveAs } from "file-saver";
import {
  fetchMonthlyAttendanceMatrix,
  downloadAttendanceReport,
} from "../reducers/employeeAttendance.reducer";
import { fetchDepartments } from "../reducers/masterDepartment.reducer";
import { UserType } from "../enums";
import { message } from "antd";

interface DayInfo {
  date: string;
  dayNum: number;
  dayLabel: string;
  dayName: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
}

interface EmployeeDailyStatus {
  text: string;
  type: string;
  color: string;
}

interface EmployeeRow {
  employeeId: string;
  fullName: string;
  department: string;
  dailyStatus: Record<string, EmployeeDailyStatus>;
  summary: {
    fullDays: number;
    wfh: number;
    clientVisit: number;
    halfDays: number;
    leaves: number;
    notUpdated: number;
    weekends: number;
    holidays: number;
  };
}

interface MatrixData {
  month: number;
  year: number;
  daysInMonth: number;
  days: DayInfo[];
  employees: EmployeeRow[];
}

const MonthlyAttendanceMatrix: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector((state: RootState) => state.user.currentUser);
  const { entity } = useAppSelector((state: RootState) => state.employeeDetails);
  const { departments } = useAppSelector((state: RootState) => state.masterDepartments);

  // Determine base path (admin vs manager)
  const isManager =
    location.pathname.startsWith("/manager-dashboard") ||
    currentUser?.userType === UserType.MANAGER ||
    Boolean(currentUser?.role && currentUser.role.toUpperCase().includes("MNG"));
  const basePath = isManager ? "/manager-dashboard" : "/admin-dashboard";

  // Check role: Only ADMIN and MANAGER allowed
  useEffect(() => {
    if (currentUser) {
      const allowed =
        currentUser.userType === UserType.ADMIN ||
        currentUser.userType === UserType.MANAGER ||
        (currentUser.role && currentUser.role.toUpperCase().includes("MNG"));
      if (!allowed) {
        navigate("/employee-dashboard", { replace: true });
      }
    }
  }, [currentUser, navigate]);

  // Initial Month & Year
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    return (location.state as any)?.month || new Date().getMonth() + 1;
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return (location.state as any)?.year || new Date().getFullYear();
  });

  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Detect manager's department
  const managerDepartment = useMemo(() => {
    if (entity?.department) return entity.department;
    if (entity?.department_name) return entity.department_name;
    if (matrixData?.employees && matrixData.employees.length > 0) {
      const found = matrixData.employees.find((e) => e.department && e.department.trim());
      if (found?.department) return found.department;
    }
    return "";
  }, [entity, matrixData]);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>(() => {
    if (isManager) {
      return entity?.department || entity?.department_name || "";
    }
    return "All Departments";
  });
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState<boolean>(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search term to trigger backend API call
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // For manager, auto-select their department when opening / data loaded
  useEffect(() => {
    if (isManager && managerDepartment && (!selectedDepartment || selectedDepartment === "All Departments")) {
      setSelectedDepartment(managerDepartment);
    }
  }, [isManager, managerDepartment, selectedDepartment]);

  // Fetch departments on mount
  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  // Close department dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Matrix Data from Backend with Search & Department filter
  const loadMatrixData = async (
    m: number,
    y: number,
    searchQuery?: string,
    deptFilter?: string,
  ) => {
    try {
      setLoading(true);
      const data = await fetchMonthlyAttendanceMatrix(m, y, searchQuery, deptFilter);
      setMatrixData(data);
    } catch (err: any) {
      console.error("Failed to load monthly attendance matrix:", err);
      message.error("Failed to load attendance matrix data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const deptToFilter = !isManager && selectedDepartment !== "All Departments" ? selectedDepartment : undefined;
    loadMatrixData(selectedMonth, selectedYear, debouncedSearchTerm, deptToFilter);
  }, [selectedMonth, selectedYear, debouncedSearchTerm, selectedDepartment, isManager]);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Excel Export Handler (direct download of original .xlsx)
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const blob = await downloadAttendanceReport(selectedMonth, selectedYear);
      saveAs(blob, `Attendance_${selectedMonth}_${selectedYear}.xlsx`);
      message.success("Attendance report downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      message.error("Failed to export Excel report");
    } finally {
      setIsExporting(false);
    }
  };

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    if (!matrixData?.employees) return [];
    return matrixData.employees.filter((emp) => {
      const matchesSearch =
        !searchTerm.trim() ||
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase().trim());

      const matchesDept =
        !selectedDepartment ||
        selectedDepartment === "All Departments" ||
        (emp.department && emp.department.trim().toLowerCase() === selectedDepartment.trim().toLowerCase()) ||
        (isManager && (!emp.department || emp.department.trim().toLowerCase() === selectedDepartment.trim().toLowerCase()));

      return matchesSearch && matchesDept;
    });
  }, [matrixData, searchTerm, selectedDepartment, isManager]);

  // Cell color helper matching Excel precisely
  const getCellBadgeClass = (cell?: EmployeeDailyStatus) => {
    if (!cell) {
      return "bg-[#FFF9C4] text-[#827717] border border-[#FFF176]";
    }

    switch (cell.type) {
      case "weekend":
        return "bg-[#ED3E3E] text-white font-bold border border-[#D32F2F]";
      case "holiday":
        return "bg-[#ADD8E6] text-[#0D47A1] font-semibold border border-[#90CAF9]";
      case "full_day":
        return "bg-[#90EE90] text-[#1B5E20] font-semibold border border-[#81C784]";
      case "wfh":
        return "bg-[#ADD8E6] text-[#0D47A1] font-semibold border border-[#81D4FA]";
      case "client_visit":
        return "bg-[#FFA07A] text-[#BF360C] font-semibold border border-[#FFAB91]";
      case "half_day":
        return "bg-[#FFFFE0] text-[#F57F17] font-semibold border border-[#FFF59D]";
      case "leave":
      case "absent":
        return "bg-[#ED3E3E] text-white font-bold border border-[#D32F2F]";
      case "not_updated":
        return "bg-[#FFFF00] text-[#3E2723] font-bold border border-[#FDD835]";
      case "inactive":
        return "bg-[#FFCDD2] text-[#B71C1C] font-medium border border-[#EF9A9A]";
      case "upcoming":
        return "bg-gray-100 text-gray-400 font-normal italic border border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#F4F7FE] min-h-screen font-sans">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate(`${basePath}/timesheet-list`)}
            className="flex items-center gap-2 text-xs font-bold text-[#4318FF] hover:text-[#3311CC] transition-colors mb-2 group cursor-pointer"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Timesheet List</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4318FF]/10 text-[#4318FF] flex items-center justify-center shadow-sm">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#2B3674] tracking-tight">
                Monthly Attendance Matrix
              </h1>
              <p className="text-xs md:text-sm text-gray-400 font-medium">
                Live interactive Excel grid of employee monthly attendance records
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Month selector & Export Excel */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month & Year Navigator */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl shadow-sm border border-gray-100">
            <button
              onClick={handlePrevMonth}
              disabled={loading}
              className="p-1.5 rounded-xl hover:bg-gray-100 active:scale-95 transition-all text-[#2B3674] disabled:opacity-50 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5 min-w-[140px] justify-center">
              <Calendar size={14} className="text-[#4318FF]" />
              <span className="text-sm font-bold text-[#2B3674]">
                {monthNames[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              disabled={loading}
              className="p-1.5 rounded-xl hover:bg-gray-100 active:scale-95 transition-all text-[#2B3674] disabled:opacity-50 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Export Excel Button (same download logic, untouched) */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#01B574] hover:bg-[#009e65] active:scale-95 text-white rounded-2xl shadow-lg shadow-green-500/20 font-bold text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            title="Download full monthly Excel spreadsheet"
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span>{isExporting ? "Exporting..." : "Export Excel"}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Legend Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="flex items-center bg-[#F4F7FE] rounded-xl px-4 py-2.5 w-full sm:w-72 border border-transparent focus-within:border-[#4318FF]/30 transition-all">
              <Search size={16} className="text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search employee name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-semibold text-[#2B3674] w-full placeholder:text-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setDebouncedSearchTerm("");
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Department Filter: Dropdown options only for Admin, Auto-selected department for Manager */}
            {!isManager ? (
              <div className="relative" ref={deptDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#F4F7FE] hover:bg-gray-100 rounded-xl text-sm font-bold text-[#2B3674] transition-all border border-transparent cursor-pointer"
                >
                  <Building2 size={14} className="text-[#4318FF]" />
                  <span>{selectedDepartment}</span>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform ${isDeptDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDeptDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-60 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => {
                        setSelectedDepartment("All Departments");
                        setIsDeptDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        selectedDepartment === "All Departments"
                          ? "bg-[#4318FF] text-white"
                          : "text-[#2B3674] hover:bg-gray-50"
                      }`}
                    >
                      All Departments
                    </button>
                    {departments.map((dept) => (
                      <button
                        key={dept.id}
                        onClick={() => {
                          setSelectedDepartment(dept.departmentName);
                          setIsDeptDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all truncate ${
                          selectedDepartment === dept.departmentName
                            ? "bg-[#4318FF] text-white"
                            : "text-[#2B3674] hover:bg-gray-50"
                        }`}
                      >
                        {dept.departmentName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* For Manager: Fixed display of their own auto-selected department */
              <div
                className="flex items-center gap-2 px-4 py-2.5 bg-[#F4F7FE] rounded-xl text-sm font-bold text-[#4318FF] border border-[#4318FF]/15 select-none shadow-sm"
                title="Your Assigned Department"
              >
                <Building2 size={14} className="text-[#4318FF]" />
                <span className="truncate max-w-[240px]">
                  {selectedDepartment || managerDepartment || "Department"}
                </span>
              </div>
            )}

            {/* Active employee count */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-[#4318FF] rounded-xl text-xs font-bold border border-blue-100">
              <Users size={14} />
              <span>{filteredEmployees.length} Employees</span>
            </div>
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={() => {
              const deptToFilter = !isManager && selectedDepartment !== "All Departments" ? selectedDepartment : undefined;
              loadMatrixData(selectedMonth, selectedYear, debouncedSearchTerm, deptToFilter);
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F4F7FE] text-[#4318FF] border border-[#4318FF]/20 hover:border-[#4318FF]/40 rounded-xl shadow-xs hover:shadow active:scale-95 transition-all text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
            title="Refresh Matrix"
          >
            <RotateCw size={13} className={loading ? "animate-spin" : ""} />
            <span>{loading ? "Refreshing..." : "Refresh Matrix"}</span>
          </button>
        </div>

        {/* Color Legend (matching Excel) */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2.5 text-xs">
          <span className="font-bold text-gray-400 uppercase tracking-wider text-[11px] mr-1">
            Legend:
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#90EE90]/40 text-[#1B5E20] font-bold border border-[#81C784]/60">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
            Full Day
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ADD8E6]/50 text-[#0D47A1] font-bold border border-[#81D4FA]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0288D1]" />
            WFH
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFA07A]/50 text-[#BF360C] font-bold border border-[#FFAB91]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E64A19]" />
            Client Visit
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFFFE0] text-[#B7950B] font-bold border border-[#FFF59D]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FBC02D]" />
            Half Day
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ED3E3E]/20 text-[#C62828] font-bold border border-[#EF9A9A]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D32F2F]" />
            Weekend
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ADD8E6]/60 text-[#1565C0] font-bold border border-[#90CAF9]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1976D2]" />
            Holiday
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFFF00]/40 text-[#827717] font-black border border-[#FDD835]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F57F17]" />
            Not Updated
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFCDD2]/60 text-[#B71C1C] font-bold border border-[#EF9A9A]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C2185B]" />
            Inactive
          </span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-white rounded-3xl shadow-[0px_18px_40px_rgba(112,144,176,0.12)] border border-gray-100 overflow-hidden mb-8">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 size={36} className="animate-spin text-[#4318FF]" />
            <p className="text-sm font-bold text-[#2B3674]">
              Loading {monthNames[selectedMonth - 1]} {selectedYear} Attendance Matrix...
            </p>
          </div>
        ) : !matrixData || filteredEmployees.length === 0 ? (
          <div className="py-20 text-center">
            <FileSpreadsheet size={42} className="mx-auto text-gray-300 mb-3" />
            <p className="text-base font-bold text-[#2B3674] mb-1">No attendance records found</p>
            <p className="text-xs text-gray-400">
              Try adjusting your search query or department filter for this month.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto overflow-y-auto max-h-[72vh] custom-scrollbar">
              <table className="w-full border-separate border-spacing-0 text-xs">
                <thead>
                  {/* Row 1: Days Numbers (e.g. 1-Sep, 2-Sep) */}
                  <tr className="bg-[#92D050] text-[#1B5E20]">
                    {/* Fixed Name Header */}
                    <th
                      rowSpan={2}
                      className="sticky left-0 top-0 z-30 bg-[#92D050] text-[#1B5E20] py-3 px-3 text-left font-black text-xs uppercase tracking-wider min-w-[150px] max-w-[170px] border-r border-[#81C784] shadow-[4px_0_12px_rgba(0,0,0,0.06)]"
                    >
                      Employee Name
                    </th>

                    {/* Day Headers (Row 1) */}
                    {matrixData.days.map((day) => (
                      <th
                        key={`num-${day.date}`}
                        className={`sticky top-0 z-20 py-2 px-2 text-center font-black whitespace-nowrap min-w-[95px] max-w-[110px] border-r border-b ${
                          day.isHoliday
                            ? "bg-[#ADD8E6] text-[#0D47A1] border-[#90CAF9]"
                            : day.isWeekend
                            ? "bg-[#ED3E3E] text-white border-[#D32F2F]"
                            : "bg-[#92D050] text-[#1B5E20] border-[#81C784]"
                        }`}
                      >
                        {day.dayLabel}
                      </th>
                    ))}

                    {/* Summary Columns - Sticky Right Header */}
                    <th
                      rowSpan={2}
                      className="sticky top-0 right-[264px] z-30 bg-[#2B3674] text-white py-3 px-1 text-center font-black min-w-[68px] max-w-[68px] border-l border-r border-gray-500 shadow-[-4px_0_8px_rgba(0,0,0,0.12)]"
                    >
                      Present
                    </th>
                    <th
                      rowSpan={2}
                      className="sticky top-0 right-[204px] z-30 bg-[#2B3674] text-white py-3 px-1 text-center font-black min-w-[60px] max-w-[60px] border-r border-gray-500"
                    >
                      WFH
                    </th>
                    <th
                      rowSpan={2}
                      className="sticky top-0 right-[148px] z-30 bg-[#2B3674] text-white py-3 px-1 text-center font-black min-w-[56px] max-w-[56px] border-r border-gray-500"
                    >
                      CV
                    </th>
                    <th
                      rowSpan={2}
                      className="sticky top-0 right-[84px] z-30 bg-[#2B3674] text-white py-3 px-1 text-center font-black min-w-[64px] max-w-[64px] border-r border-gray-500"
                    >
                      Leave
                    </th>
                    <th
                      rowSpan={2}
                      className="sticky top-0 right-0 z-30 bg-[#F57F17] text-white py-3 px-1 text-center font-black min-w-[84px] max-w-[84px]"
                    >
                      Not Updated
                    </th>
                  </tr>

                  {/* Row 2: Day Names (Monday, Tuesday, etc.) */}
                  <tr>
                    {matrixData.days.map((day) => (
                      <th
                        key={`name-${day.date}`}
                        className={`sticky top-[33px] z-20 py-1.5 px-2 text-center font-bold text-[11px] whitespace-nowrap border-r border-b ${
                          day.isHoliday
                            ? "bg-[#ADD8E6]/80 text-[#0D47A1] border-[#90CAF9]"
                            : day.isWeekend
                            ? "bg-[#ED3E3E]/90 text-white border-[#D32F2F]"
                            : "bg-[#FFFFE0] text-[#795548] border-[#FFE082]"
                        }`}
                      >
                        {day.dayName}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.map((emp, empIdx) => {
                    const isEven = empIdx % 2 === 0;
                    return (
                      <tr
                        key={emp.employeeId}
                        className={`transition-colors ${
                          isEven ? "bg-white hover:bg-blue-50/40" : "bg-[#F8F9FC] hover:bg-blue-50/50"
                        }`}
                      >
                        {/* Sticky Name Cell */}
                        <td
                          className={`sticky left-0 z-10 py-2 px-3 border-r border-b border-gray-100 min-w-[150px] max-w-[170px] shadow-[4px_0_12px_rgba(0,0,0,0.06)] ${
                            isEven ? "bg-white" : "bg-[#F8F9FC]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#4318FF]/10 text-[#4318FF] font-bold text-xs flex items-center justify-center shrink-0">
                              {emp.fullName.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[#2B3674] text-xs truncate leading-tight" title={emp.fullName}>
                                {emp.fullName}
                              </p>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {emp.employeeId}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Date Status Cells */}
                        {matrixData.days.map((day) => {
                          const status = emp.dailyStatus[day.date];
                          return (
                            <td
                              key={`${emp.employeeId}-${day.date}`}
                              className="py-1.5 px-1.5 border-r border-b border-gray-100 text-center align-middle"
                            >
                              <div
                                className={`py-1.5 px-1 rounded text-[11px] leading-tight truncate shadow-xs transition-all ${getCellBadgeClass(
                                  status
                                )}`}
                                title={`${emp.fullName} on ${day.dayLabel} (${day.dayName}): ${
                                  status?.text || "Not Updated"
                                }`}
                              >
                                {status?.text || "Not Updated"}
                              </div>
                            </td>
                          );
                        })}

                        {/* Summary Badges - Sticky Right */}
                        <td
                          className={`sticky right-[264px] z-10 py-2 px-1 text-center font-bold text-emerald-700 min-w-[68px] max-w-[68px] border-l border-r border-b border-gray-200 shadow-[-4px_0_8px_rgba(0,0,0,0.06)] ${
                            isEven ? "bg-[#F0FDF4]" : "bg-[#E6F8EB]"
                          }`}
                        >
                          {emp.summary.fullDays}
                        </td>
                        <td
                          className={`sticky right-[204px] z-10 py-2 px-1 text-center font-bold text-sky-700 min-w-[60px] max-w-[60px] border-r border-b border-gray-200 ${
                            isEven ? "bg-[#F0F9FF]" : "bg-[#E0F2FE]"
                          }`}
                        >
                          {emp.summary.wfh}
                        </td>
                        <td
                          className={`sticky right-[148px] z-10 py-2 px-1 text-center font-bold text-orange-700 min-w-[56px] max-w-[56px] border-r border-b border-gray-200 ${
                            isEven ? "bg-[#FFF7ED]" : "bg-[#FFEDD5]"
                          }`}
                        >
                          {emp.summary.clientVisit}
                        </td>
                        <td
                          className={`sticky right-[84px] z-10 py-2 px-1 text-center font-bold text-rose-700 min-w-[64px] max-w-[64px] border-r border-b border-gray-200 ${
                            isEven ? "bg-[#FFF1F2]" : "bg-[#FCE7E9]"
                          }`}
                        >
                          {emp.summary.leaves}
                        </td>
                        <td
                          className={`sticky right-0 z-10 py-2 px-1 text-center font-black text-amber-800 min-w-[84px] max-w-[84px] border-b border-gray-200 ${
                            isEven ? "bg-[#FFFBEB]" : "bg-[#FDF1D3]"
                          }`}
                        >
                          {emp.summary.notUpdated}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom scroll hint */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 font-medium">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={14} className="text-[#4318FF] animate-pulse" />
                <span>Scroll table horizontally to view all days of the month</span>
              </div>
              <div>
                Showing <span className="font-bold text-[#2B3674]">{filteredEmployees.length}</span> of{" "}
                <span className="font-bold text-[#2B3674]">{matrixData.employees.length}</span> employees
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyAttendanceMatrix;
