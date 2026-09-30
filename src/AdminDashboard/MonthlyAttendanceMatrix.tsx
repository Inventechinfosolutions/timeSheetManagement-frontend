import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector, useDebounce } from "../hooks";
import { RootState } from "../store";
import {
  Download,
  ArrowLeft,
  Loader2,
  FileSpreadsheet,
  FileText,
  Users,
  Building2,
  RotateCw,
  Filter,
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
import {
  Tooltip,
  SearchBox,
  MonthNavigator,
  Dropdown,
  Button,
  Badge,
  InventechIconLoader,
} from "../components/ui";
import type { DropdownOption } from "../components/ui";

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
  const [debouncedSearchTerm, flushDebouncedSearchTerm] = useDebounce<string>(searchTerm, 400);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(() => {
    if (isManager) {
      return entity?.department || entity?.department_name || "";
    }
    return "All Departments";
  });
  // Status Filter: All, Submitted, Pending
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Status dropdown options
  const statusOptions: DropdownOption[] = useMemo(
    () => [
      {
        value: "All",
        label: "All Status",
        dotColor: "bg-[#4318FF]",
      },
      {
        value: "Submitted",
        label: "Submitted",
        dotColor: "bg-[#01B574]",
        badgeText: "All days filled",
        badgeClass: "bg-emerald-50 text-[#01B574] border border-emerald-200",
      },
      {
        value: "Pending",
        label: "Pending",
        dotColor: "bg-[#D97706]",
        badgeText: "Has missing days",
        badgeClass: "bg-amber-50 text-[#D97706] border border-amber-200",
      },
    ],
    [],
  );

  // Department dropdown options
  const departmentOptions: DropdownOption[] = useMemo(() => {
    return [
      { value: "All Departments", label: "All Departments" },
      ...departments.map((dept) => ({
        value: dept.departmentName,
        label: dept.departmentName,
      })),
    ];
  }, [departments]);


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

  // Fetch Matrix Data from Backend with Search, Department, and Status filter
  const loadMatrixData = async (
    m: number,
    y: number,
    searchQuery?: string,
    deptFilter?: string,
    statusFilter?: string,
  ) => {
    try {
      setLoading(true);
      const data = await fetchMonthlyAttendanceMatrix(m, y, searchQuery, deptFilter, statusFilter);
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
    const statusToFilter = selectedStatus !== "All" ? selectedStatus : undefined;
    loadMatrixData(selectedMonth, selectedYear, debouncedSearchTerm, deptToFilter, statusToFilter);
  }, [selectedMonth, selectedYear, debouncedSearchTerm, selectedDepartment, selectedStatus, isManager]);

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

  // PDF Export Handler - Always exports all employees for the selected month/year (unfiltered by UI filters)
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);

      // Fetch complete matrix data for the selected month/year without UI filters (search, department, status)
      const fullData = await fetchMonthlyAttendanceMatrix(
        selectedMonth,
        selectedYear,
        undefined,
        isManager ? managerDepartment : undefined,
        undefined,
      );

      const allEmployees = fullData?.employees || [];
      if (allEmployees.length === 0) {
        message.warning("No attendance data to export for this month");
        return;
      }

      // Calculate total stats across all employees
      const allTotalStats = allEmployees.reduce(
        (acc: any, emp: any) => ({
          present: acc.present + (emp.summary?.fullDays || 0),
          halfDay: acc.halfDay + (emp.summary?.halfDays || 0),
          wfh: acc.wfh + (emp.summary?.wfh || 0),
          cv: acc.cv + (emp.summary?.clientVisit || 0),
          leave: acc.leave + (emp.summary?.leaves || 0),
          notUpdated: acc.notUpdated + (emp.summary?.notUpdated || 0),
        }),
        { present: 0, halfDay: 0, wfh: 0, cv: 0, leave: 0, notUpdated: 0 },
      );

      downloadMatrixPdf({
        monthName: monthNames[selectedMonth - 1],
        month: selectedMonth,
        year: selectedYear,
        selectedDepartment: isManager ? (managerDepartment || "All Departments") : "All Departments",
        employees: allEmployees,
        totalStats: allTotalStats,
        daysInMonth: fullData.daysInMonth || matrixData?.daysInMonth || 30,
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

      const matchesStatus =
        !selectedStatus ||
        selectedStatus === "All" ||
        (selectedStatus === "Submitted" && (emp.summary?.notUpdated || 0) === 0) ||
        (selectedStatus === "Pending" && (emp.summary?.notUpdated || 0) > 0);

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [matrixData, searchTerm, selectedDepartment, selectedStatus, isManager]);

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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`${basePath}/timesheet-list`)}
          leftIcon={<ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />}
          className="text-[#4318FF] hover:text-[#3311CC] hover:bg-transparent !p-0 mb-4 group font-bold text-xs"
        >
          Back to Timesheet List
        </Button>

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
            {/* Quick Refresh & Reset Filters Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                flushDebouncedSearchTerm("");
                setSelectedStatus("All");
                const defaultDept = isManager ? managerDepartment || "" : "All Departments";
                setSelectedDepartment(defaultDept);
                loadMatrixData(
                  selectedMonth,
                  selectedYear,
                  undefined,
                  isManager ? managerDepartment : undefined,
                  undefined,
                );
              }}
              disabled={loading}
              title="Reset all filters and refresh matrix"
              className="p-2.5 h-[38px] w-[38px] !px-0 !py-0 shadow-2xs hover:shadow-xs"
            >
              <RotateCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>

            {/* Month Navigator */}
            <MonthNavigator
              month={selectedMonth}
              year={selectedYear}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
              disabled={loading}
            />

            {/* Export Excel Button */}
            <Button
              variant="success"
              size="lg"
              onClick={handleExportExcel}
              disabled={isExporting}
              loading={isExporting}
              leftIcon={<Download size={16} />}
              title="Download Excel report"
            >
              {isExporting ? "Exporting..." : "Export Excel"}
            </Button>

            {/* Download PDF Button */}
            <Button
              variant="danger"
              size="lg"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              loading={isExportingPdf}
              leftIcon={<FileText size={16} />}
              title="Download PDF report"
            >
              {isExportingPdf ? "Generating PDF..." : "Download PDF"}
            </Button>
          </div>
        </div>

        {/* Filter Bar & Legend Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-3.5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 gap-y-2.5">
            {/* Left Controls: Search, Status, Dept, Count */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Input */}
              <SearchBox
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => {
                  setSearchTerm("");
                  flushDebouncedSearchTerm("");
                }}
              />

              {/* Status Filter (All / Submitted / Pending) - Placed FIRST */}
              <Dropdown
                options={statusOptions}
                value={selectedStatus}
                onChange={setSelectedStatus}
                defaultValue="All"
                prefixIcon={<Filter size={13} />}
                allowClear
                className="shrink-0"
                menuClassName="w-60"
              />

              {/* Department Filter - Placed SECOND */}
              {!isManager ? (
                <Dropdown
                  options={departmentOptions}
                  value={selectedDepartment}
                  onChange={setSelectedDepartment}
                  defaultValue="All Departments"
                  prefixIcon={<Building2 size={13} />}
                  allowClear
                  className="shrink-0"
                  maxLabelWidth="max-w-[85px]"
                />
              ) : (
                <Tooltip color="#4318FF" title={selectedDepartment || managerDepartment || "Department"}>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F7FE] rounded-xl text-xs font-bold text-[#4318FF] border border-[#4318FF]/15 select-none"
                    title="Your Assigned Department"
                  >
                    <Building2 size={13} className="text-[#4318FF] shrink-0" />
                    <span className="truncate max-w-[85px]">
                      {selectedDepartment || managerDepartment || "Department"}
                    </span>
                  </div>
                </Tooltip>
              )}

              {/* Active employee count */}
              <Badge variant="count" className="px-2.5 py-1.5 rounded-xl text-xs shrink-0 font-bold">
                <Users size={13} className="mr-0.5" />
                <span>{filteredEmployees.length} Employees</span>
              </Badge>
            </div>

            {/* Right: Legend Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mr-0.5">
                Legend:
              </span>
              <Badge variant="full_day" showDot>
                Full Day
              </Badge>
              <Badge variant="wfh" showDot>
                WFH
              </Badge>
              <Badge variant="client_visit" showDot>
                Client Visit
              </Badge>
              <Badge variant="half_day" showDot>
                Half Day
              </Badge>
              <Badge variant="weekend" showDot>
                Weekend
              </Badge>
              <Badge variant="holiday" showDot>
                Holiday
              </Badge>
              <Badge variant="not_updated" showDot>
                Not Updated
              </Badge>
            </div>
          </div>
        </div>

        {/* Matrix Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8 min-h-[420px]">
          {loading ? (
            <div className="py-28 flex flex-col items-center justify-center">
              <InventechIconLoader
                size="md"
                text={`Loading ${monthNames[selectedMonth - 1]} ${selectedYear} Attendance Matrix...`}
              />
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
