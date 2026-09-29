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
  FileText,
  Users,
  Building2,
  ChevronDown,
  RotateCw,
} from "lucide-react";
import { saveAs } from "file-saver";
import { downloadMatrixPdf } from "../utils/downloadMatrixPdf";
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

  // Check role: ADMIN, MANAGER, and RECEPTIONIST allowed
  useEffect(() => {
    if (currentUser) {
      const allowed =
        currentUser.userType === UserType.ADMIN ||
        currentUser.userType === UserType.MANAGER ||
        currentUser.userType === UserType.RECEPTIONIST ||
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
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

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

  // PDF Export Handler (calls separate downloadMatrixPdf utility)
  const handleExportPdf = () => {
    if (!matrixData || filteredEmployees.length === 0) {
      message.warning("No attendance data to export");
      return;
    }

    try {
      setIsExportingPdf(true);
      downloadMatrixPdf({
        monthName: monthNames[selectedMonth - 1],
        month: selectedMonth,
        year: selectedYear,
        selectedDepartment,
        employees: filteredEmployees,
        totalStats,
        daysInMonth: matrixData.daysInMonth,
      });
      message.success("Attendance PDF downloaded successfully!");
    } catch (err: any) {
      console.error("Failed to generate PDF:", err);
      message.error("Failed to generate PDF report");
    } finally {
      setIsExportingPdf(false);
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

  // Aggregate summary stats across visible employees
  const totalStats = useMemo(() => {
    if (!filteredEmployees.length) return { present: 0, halfDay: 0, wfh: 0, cv: 0, leave: 0, notUpdated: 0 };
    return filteredEmployees.reduce(
      (acc, emp) => ({
        present: acc.present + (emp.summary?.fullDays || 0),
        halfDay: acc.halfDay + (emp.summary?.halfDays || 0),
        wfh: acc.wfh + (emp.summary?.wfh || 0),
        cv: acc.cv + (emp.summary?.clientVisit || 0),
        leave: acc.leave + (emp.summary?.leaves || 0),
        notUpdated: acc.notUpdated + (emp.summary?.notUpdated || 0),
      }),
      { present: 0, halfDay: 0, wfh: 0, cv: 0, leave: 0, notUpdated: 0 },
    );
  }, [filteredEmployees]);

  // Cell status styling matching application design system
  const getCellBadgeClass = (cell?: EmployeeDailyStatus) => {
    if (!cell) {
      return "bg-[#FFEDD5] text-[#C2410C] border border-[#FB923C] font-semibold";
    }

    switch (cell.type) {
      case "weekend":
        return "bg-[#FFF0F0] text-[#DC2626] border border-[#FCA5A5] font-bold";
      case "holiday":
        return "bg-[#DBEAFE] text-[#1D4ED8] border border-[#93C5FD] font-bold";
      case "full_day":
        return "bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] font-bold";
      case "wfh":
        return "bg-[#E0F2FE] text-[#0369A1] border border-[#7DD3FC] font-semibold";
      case "client_visit":
        return "bg-[#FFF1E6] text-[#B45309] border border-[#FED7AA] font-semibold";
      case "half_day":
        return "bg-[#FEF08A] text-[#854D0E] border border-[#FACC15] font-bold";
      case "leave":
      case "absent":
        return "bg-[#FFF0F0] text-[#DC2626] border border-[#FCA5A5] font-bold";
      case "not_updated":
        return "bg-[#FFEDD5] text-[#C2410C] border border-[#FB923C] font-bold";
      case "inactive":
        return "bg-gray-100 text-gray-500 border border-gray-200 font-medium";
      case "upcoming":
        return "bg-gray-50 text-gray-400 border border-gray-200 font-normal italic";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  return (
    <div className="p-4 md:p-6 bg-[#F4F7FE] min-h-screen font-sans">
      <div className="max-w-[1600px] mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(`${basePath}/timesheet-list`)}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#4318FF] hover:text-[#3311CC] transition-colors mb-4 cursor-pointer group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Timesheet List</span>
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#4318FF]/10 text-[#4318FF] flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#2B3674] tracking-tight">
                Monthly Attendance Matrix
              </h1>
              <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">
                Live interactive attendance matrix for {monthNames[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
          </div>

          {/* Month Navigator & Export */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Refresh Button */}
            <button
              onClick={() => {
                const deptToFilter = !isManager && selectedDepartment !== "All Departments" ? selectedDepartment : undefined;
                loadMatrixData(selectedMonth, selectedYear, debouncedSearchTerm, deptToFilter);
              }}
              disabled={loading}
              className="p-2.5 bg-[#F4F7FE] hover:bg-gray-100 text-[#4318FF] border border-gray-200/80 rounded-xl shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Attendance Matrix"
            >
              <RotateCw size={16} className={loading ? "animate-spin" : ""} />
            </button>

            {/* Month Navigator */}
            <div className="flex items-center gap-1.5 bg-[#F4F7FE] px-3 py-1.5 rounded-xl border border-gray-200/80">
              <button
                onClick={handlePrevMonth}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-white active:scale-95 transition-all text-[#2B3674] disabled:opacity-50 cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-2 min-w-[140px] justify-center px-1">
                <Calendar size={14} className="text-[#4318FF]" />
                <span className="text-sm font-bold text-[#2B3674]">
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </span>
              </div>
              <button
                onClick={handleNextMonth}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-white active:scale-95 transition-all text-[#2B3674] disabled:opacity-50 cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Export Excel Button */}
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#01B574] hover:bg-[#009e65] active:scale-95 text-white rounded-xl shadow-sm font-bold text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title="Download Excel report"
            >
              {isExporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span>{isExporting ? "Exporting..." : "Export Excel"}</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] active:scale-95 text-white rounded-xl shadow-sm font-bold text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title="Download PDF report"
            >
              {isExportingPdf ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              <span>{isExportingPdf ? "Generating PDF..." : "Download PDF"}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Legend Bar (Single Row, No Overflow) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-6">
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
            {/* Left Controls: Search, Dept, Count */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Search Input */}
              <div className="flex items-center bg-[#F4F7FE] rounded-xl px-3 py-1.5 w-44 lg:w-56 border border-transparent focus-within:border-[#4318FF]/30 transition-all">
                <Search size={14} className="text-gray-400 mr-1.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Search name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-semibold text-[#2B3674] w-full placeholder:text-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setDebouncedSearchTerm("");
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Department Filter */}
              {!isManager ? (
                <div className="relative" ref={deptDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F7FE] hover:bg-gray-100 rounded-xl text-xs font-bold text-[#2B3674] transition-all border border-transparent cursor-pointer"
                  >
                    <Building2 size={13} className="text-[#4318FF]" />
                    <span className="max-w-[140px] truncate">{selectedDepartment}</span>
                    <ChevronDown
                      size={12}
                      className={`text-gray-400 transition-transform ${isDeptDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isDeptDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-60 overflow-y-auto custom-scrollbar">
                      <button
                        onClick={() => {
                          setSelectedDepartment("All Departments");
                          setIsDeptDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all truncate ${
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
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F7FE] rounded-xl text-xs font-bold text-[#4318FF] border border-[#4318FF]/15 select-none"
                  title="Your Assigned Department"
                >
                  <Building2 size={13} className="text-[#4318FF]" />
                  <span className="truncate max-w-[140px]">
                    {selectedDepartment || managerDepartment || "Department"}
                  </span>
                </div>
              )}

              {/* Active employee count */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-[#4318FF] rounded-xl text-xs font-bold border border-blue-100 shrink-0">
                <Users size={13} />
                <span>{filteredEmployees.length} Employees</span>
              </div>
            </div>

            {/* Right: Very Small Legend Badges */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mr-0.5">
                Legend:
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold border border-[#86EFAC]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                Full Day
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#E0F2FE] text-[#0369A1] text-[10px] font-bold border border-[#7DD3FC]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
                WFH
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FFF1E6] text-[#B45309] text-[10px] font-bold border border-[#FED7AA]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                Client Visit
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FEF08A] text-[#854D0E] text-[10px] font-bold border border-[#FACC15]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" />
                Half Day
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FFF0F0] text-[#DC2626] text-[10px] font-bold border border-[#FCA5A5]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                Weekend
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#DBEAFE] text-[#1D4ED8] text-[10px] font-bold border border-[#93C5FD]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                Holiday
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FFEDD5] text-[#C2410C] text-[10px] font-bold border border-[#FB923C]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
                Not Updated
              </span>
            </div>
          </div>
        </div>

        {/* Matrix Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
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
                    {/* Row 1: Date Labels (1-Sep, 2-Sep, etc.) */}
                    <tr className="h-9">
                      {/* Sticky Employee Name Header */}
                      <th
                        rowSpan={2}
                        className="sticky left-0 top-0 z-30 bg-[#2563EB] text-white py-2 px-3 text-left font-black text-xs uppercase tracking-wider min-w-[170px] max-w-[190px] border-r border-blue-400 shadow-[2px_0_6px_rgba(0,0,0,0.08)] align-middle"
                      >
                        Employee Name
                      </th>

                      {/* Day Columns */}
                      {matrixData.days.map((day) => (
                        <th
                          key={`num-${day.date}`}
                          className={`sticky top-0 z-20 py-2 px-2 text-center font-black whitespace-nowrap min-w-[96px] max-w-[110px] border-r border-b text-xs align-middle ${
                            day.isHoliday
                              ? "bg-[#0284C7] text-white border-sky-400"
                              : day.isWeekend
                              ? "bg-[#DC2626] text-white border-red-500"
                              : "bg-[#2563EB] text-white border-blue-400"
                          }`}
                        >
                          {day.dayLabel}
                        </th>
                      ))}

                      {/* Sticky Right Summary Headers */}
                      <th
                        rowSpan={2}
                        className="sticky top-0 right-[260px] z-30 bg-[#1E40AF] text-white py-2 px-1 text-center font-black min-w-[65px] max-w-[65px] border-l border-r border-blue-600 shadow-[-2px_0_6px_rgba(0,0,0,0.08)] align-middle"
                      >
                        Present
                      </th>
                      <th
                        rowSpan={2}
                        className="sticky top-0 right-[204px] z-30 bg-[#1E40AF] text-white py-2 px-1 text-center font-black min-w-[56px] max-w-[56px] border-r border-blue-600 align-middle"
                      >
                        WFH
                      </th>
                      <th
                        rowSpan={2}
                        className="sticky top-0 right-[152px] z-30 bg-[#1E40AF] text-white py-2 px-1 text-center font-black min-w-[52px] max-w-[52px] border-r border-blue-600 align-middle"
                      >
                        CV
                      </th>
                      <th
                        rowSpan={2}
                        className="sticky top-0 right-[88px] z-30 bg-[#1E40AF] text-white py-2 px-1 text-center font-black min-w-[64px] max-w-[64px] border-r border-blue-600 align-middle"
                      >
                        Leave
                      </th>
                      <th
                        rowSpan={2}
                        className="sticky top-0 right-0 z-30 bg-[#EA580C] text-white py-2 px-1 text-center font-black min-w-[88px] max-w-[88px] shadow-[-2px_0_6px_rgba(0,0,0,0.08)] align-middle"
                      >
                        Not Updated
                      </th>
                    </tr>

                    {/* Row 2: Day Names (Monday, Tuesday, etc.) */}
                    <tr className="h-7">
                      {matrixData.days.map((day) => (
                        <th
                          key={`name-${day.date}`}
                          className={`sticky top-[36px] z-20 py-1 px-2 text-center font-bold text-[11px] whitespace-nowrap border-r border-b align-middle ${
                            day.isHoliday
                              ? "bg-[#0369A1] text-sky-100 border-sky-400"
                              : day.isWeekend
                              ? "bg-[#B91C1C] text-red-100 border-red-600"
                              : "bg-[#1D4ED8] text-blue-100 border-blue-500"
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
                      const rowBg = isEven ? "bg-white" : "bg-[#F8F9FC]";
                      return (
                        <tr
                          key={emp.employeeId}
                          className={`group ${rowBg} hover:bg-blue-50/60 transition-colors`}
                        >
                          {/* Sticky Employee Name Cell */}
                          <td
                            className={`sticky left-0 z-10 py-2.5 px-3 border-r border-b border-gray-200 min-w-[170px] max-w-[190px] shadow-[2px_0_6px_rgba(0,0,0,0.04)] ${rowBg} group-hover:bg-[#F1F5FD] transition-colors`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4318FF] to-[#5BC4FF] flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                                {emp.fullName?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-[#2B3674] text-xs truncate leading-tight" title={emp.fullName}>
                                  {emp.fullName}
                                </p>
                                <span className="text-[10px] text-gray-400 font-semibold block">
                                  {emp.employeeId}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Daily Status Cells */}
                          {matrixData.days.map((day) => {
                            const status = emp.dailyStatus[day.date];
                            return (
                              <td
                                key={`${emp.employeeId}-${day.date}`}
                                className="py-1.5 px-1.5 border-r border-b border-gray-100 text-center align-middle"
                              >
                                <div
                                  className={`py-1.5 px-1 rounded-lg text-[11px] leading-tight truncate shadow-xs transition-all ${getCellBadgeClass(
                                    status
                                  )}`}
                                  title={`${emp.fullName} | ${day.dayLabel} (${day.dayName}): ${
                                    status?.text || "Not Updated"
                                  }`}
                                >
                                  {status?.text || "Not Updated"}
                                </div>
                              </td>
                            );
                          })}

                          {/* Summary Cells - Sticky Right with solid backgrounds */}
                          <td
                            className={`sticky right-[260px] z-10 py-2.5 px-1 text-center font-black text-emerald-700 min-w-[65px] max-w-[65px] border-l border-r border-b border-gray-200 shadow-[-2px_0_6px_rgba(0,0,0,0.04)] ${
                              isEven ? "bg-[#F0FDF4]" : "bg-[#DCFCE7]"
                            }`}
                          >
                            {emp.summary.fullDays}
                          </td>
                          <td
                            className={`sticky right-[204px] z-10 py-2.5 px-1 text-center font-black text-sky-700 min-w-[56px] max-w-[56px] border-r border-b border-gray-200 ${
                              isEven ? "bg-[#F0F9FF]" : "bg-[#E0F2FE]"
                            }`}
                          >
                            {emp.summary.wfh}
                          </td>
                          <td
                            className={`sticky right-[152px] z-10 py-2.5 px-1 text-center font-black text-amber-700 min-w-[52px] max-w-[52px] border-r border-b border-gray-200 ${
                              isEven ? "bg-[#FFFBEB]" : "bg-[#FEF3C7]"
                            }`}
                          >
                            {emp.summary.clientVisit}
                          </td>
                          <td
                            className={`sticky right-[88px] z-10 py-2.5 px-1 text-center font-black text-rose-700 min-w-[64px] max-w-[64px] border-r border-b border-gray-200 ${
                              isEven ? "bg-[#FFF1F2]" : "bg-[#FEE2E2]"
                            }`}
                          >
                            {emp.summary.leaves}
                          </td>
                          <td
                            className={`sticky right-0 z-10 py-2.5 px-1 text-center font-black text-amber-900 min-w-[88px] max-w-[88px] border-b border-gray-200 shadow-[-2px_0_6px_rgba(0,0,0,0.04)] ${
                              isEven ? "bg-[#FEF3C7]" : "bg-[#FDE68A]"
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

              {/* Table Footer Summary */}
              <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#2B3674]">{filteredEmployees.length}</span>
                  <span>Employees displayed</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyAttendanceMatrix;
