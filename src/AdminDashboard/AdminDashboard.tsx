import { useState, useEffect, useMemo, useRef } from "react";
import { RootState } from "../store";
import { getEntities } from "../reducers/employeeDetails.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  Users,
  Search,
  Clock,
  FileText,
  TrendingUp,
  Download,
  Filter,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import {
  fetchAllEmployeesMonthlyAttendance,
  fetchMonthlyAttendance,
  AttendanceStatus,
} from "../reducers/employeeAttendance.reducer";
/* New Import: fetchHolidays needed */
import { fetchHolidays } from "../reducers/masterHoliday.reducer"; // Fixed filename
import { downloadPdf } from "../utils/downloadPdf";
import {
  generateMonthlyEntries,
  generateRangeEntries,
} from "../utils/attendanceUtils";

const AdminDashboard = () => {
  /* ... hooks and state ... */
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDept, setSelectedDept] = useState("All");
  const itemsPerPage = 10;
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const departments = [
    "All",
    "HR",
    "IT",
    "Sales",
    "Marketing",
    "Finance",
    "Engineering",
    "Design",
    "Admin",
  ];

  const { entities, totalItems } = useAppSelector(
    (state: RootState) => state.employeeDetails,
  );
  
  // Select holidays from store
  // @ts-ignore - Assuming masterHolidays is in RootState
  const { holidays } = useAppSelector(
    (state: RootState) => state.masterHolidays || { holidays: [] },
  );

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedEmps, setSelectedEmps] = useState<Set<string>>(new Set());
  const [modalSearch, setModalSearch] = useState("");
  const [modalDept, setModalDept] = useState("All");
  const [isModalDeptOpen, setIsModalDeptOpen] = useState(false);
  const [exportStep, setExportStep] = useState<"employees" | "range">(
    "employees",
  );

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [exportStartDate, setExportStartDate] = useState(
    firstDay.toISOString().split("T")[0],
  );
  const [exportEndDate, setExportEndDate] = useState(
    lastDay.toISOString().split("T")[0],
  );
  const [isExporting, setIsExporting] = useState(false);

  const modalDeptRef = useRef<HTMLDivElement>(null);

  const { employeeRecords } = useAppSelector(
    (state: RootState) => state.attendance,
  );

  const now = new Date();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
  const currentYear = now.getFullYear().toString();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        modalDeptRef.current &&
        !modalDeptRef.current.contains(event.target as Node)
      ) {
        setIsModalDeptOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    dispatch(
      fetchAllEmployeesMonthlyAttendance({
        month: currentMonth,
        year: currentYear,
      }),
    );
    // Fetch holidays so they are available for PDF export
    dispatch(fetchHolidays());
  }, [dispatch, currentMonth, currentYear]);

  // ... (rest of effects)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    dispatch(
      getEntities({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        department: selectedDept === "All" ? undefined : selectedDept,
      }),
    );
  }, [dispatch, currentPage, debouncedSearchTerm, selectedDept]);

  // ... (stats calculation)
  // Aggregate stats from the bulk data
  const stats = useMemo(() => {
    const allAttendance = Object.values(employeeRecords).flat();
    const todayStr = new Date().toISOString().split("T")[0];

    if (!allAttendance.length)
      return { totalHours: 0, todayPresent: 0, totalAbsent: 0 };

    const totalMinutes = allAttendance.reduce(
      (acc, curr) => acc + (curr.totalHours || 0) * 60,
      0,
    );

    const todayRecords = allAttendance.filter((r) => {
      const workingDateStr =
        r.workingDate instanceof Date
          ? r.workingDate.toISOString().split("T")[0]
          : String(r.workingDate).split("T")[0];
      return workingDateStr === todayStr;
    });

    const todayPresentCount = todayRecords.filter((r) =>
      [AttendanceStatus.FULL_DAY, AttendanceStatus.HALF_DAY].includes(
        r.status as AttendanceStatus,
      ),
    ).length;

    const todayAbsentCount = todayRecords.filter(
      (r) => r.status === AttendanceStatus.LEAVE,
    ).length;

    return {
      totalHours: Math.round(totalMinutes / 60),
      todayPresent: todayPresentCount,
      totalAbsent: todayAbsentCount,
    };
  }, [employeeRecords]);

  // ... (employee mapping)
  const employees = entities.map((emp: any) => {
    const empId = emp.employeeId || emp.id;
    const empRecords = employeeRecords[empId] || [];

    // Get hours for today
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRecord = empRecords.find((r) => {
      const workingDateStr =
        r.workingDate instanceof Date
          ? r.workingDate.toISOString().split("T")[0]
          : String(r.workingDate).split("T")[0];
      return workingDateStr === todayStr;
    });
    const todayHours = todayRecord?.totalHours || 0;

    // Real status from database, defaulting to "Not Updated" if no record exists for today
    const status = todayRecord?.status || AttendanceStatus.NOT_UPDATED;

    return {
      ...emp,
      todayHours,
      status,
      avatar: emp.fullName?.charAt(0) || "U",
      deptColor:
        emp.department === "Engineering"
          ? "#3182CE"
          : emp.department === "Design"
            ? "#805AD5"
            : "#38A169",
    };
  });

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentItems = employees;

  const toggleEmp = (id: string) => {
    const next = new Set(selectedEmps);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedEmps(next);
  };

  const toggleAll = () => {
    if (selectedEmps.size === entities.length) setSelectedEmps(new Set());
    else setSelectedEmps(new Set(entities.map((e) => e.employeeId || e.id)));
  };

  const filteredModalEmps = entities.filter((emp) => {
    const matchesSearch = (emp.fullName || emp.name || "")
      .toLowerCase()
      .includes(modalSearch.toLowerCase());
    const matchesDept = modalDept === "All" || emp.department === modalDept;
    return matchesSearch && matchesDept;
  });

  const handleBulkExport = async () => {
    setIsExporting(true);
    try {
      const selected = entities.filter((e) =>
        selectedEmps.has(e.employeeId || e.id),
      );
      const start = new Date(exportStartDate);
      const end = new Date(exportEndDate);

      // Generate formatted month string for the PDF title
      const rangeStr = `${start.toLocaleDateString("en-US", { month: "short", year: "numeric", day: "numeric" })} to ${end.toLocaleDateString("en-US", { month: "short", year: "numeric", day: "numeric" })}`;

      // Calculate all month-years in the range
      const monthsToFetch: { month: string; year: string }[] = [];
      const current = new Date(start);
      // Set to 1st of month to avoid edge cases when iterating
      current.setDate(1);

      while (current <= end) {
        monthsToFetch.push({
          month: (current.getMonth() + 1).toString().padStart(2, "0"),
          year: current.getFullYear().toString(),
        });
        current.setMonth(current.getMonth() + 1);
      }
      // Also check the end date month just in case
      const endMonth = (end.getMonth() + 1).toString().padStart(2, "0");
      const endYear = end.getFullYear().toString();
      const lastInList = monthsToFetch[monthsToFetch.length - 1];
      if (
        !lastInList ||
        lastInList.month !== endMonth ||
        lastInList.year !== endYear
      ) {
        monthsToFetch.push({ month: endMonth, year: endYear });
      }

      for (const emp of selected) {
        const empId = emp.employeeId || emp.id;
        let allRecords: any[] = [];

        // Fetch missing months for this employee
        for (const { month, year } of monthsToFetch) {
          // We must fetch individually because employeeRecords usually only has ONE month loaded globally
          // or we can use unwrap to get raw data
          try {
            const result = await dispatch(
              fetchMonthlyAttendance({
                employeeId: empId,
                month,
                year,
              }),
            ).unwrap();
            if (result) {
              allRecords = [...allRecords, ...result];
            }
          } catch (e) {
            console.warn(`Failed to fetch data for ${empId} - ${month}/${year}`);
          }
        }

        // Generate entries for the FULL range
        const entries = generateRangeEntries(start, end, new Date(), allRecords);
        const totalHours = entries.reduce(
          (acc, curr) => acc + (curr.totalHours || 0),
          0,
        );

        downloadPdf({
          employeeName: emp.fullName || emp.name,
          employeeId: empId,
          department: emp.department,
          designation: emp.designation, // Added to fix "N/A"
          month: rangeStr, // Shows full range path
          entries: entries,
          totalHours: totalHours,
          holidays: holidays || [], // Passed holidays from store
        });

        // Small delay to prevent browser blocking multiple downloads
        await new Promise((r) => setTimeout(r, 500));
      }
      setIsExportModalOpen(false);
      setExportStep("employees");
      setSelectedEmps(new Set());
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  const styles = {
    container:
      "p-4 md:p-8 bg-[#F4F7FE] min-h-screen font-['DM_Sans',sans-serif]",
    cardGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8",
    statCard: (gradient: string) =>
      `relative overflow-hidden p-6 rounded-[24px] text-white shadow-xl ${gradient} transition-transform hover:-translate-y-1 duration-300`,
    glassInner:
      "absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl",
    tableWrapper:
      "bg-white rounded-[24px] shadow-[0px_18px_40px_rgba(112,144,176,0.08)] overflow-hidden",
    th: "px-6 py-2.5 text-[12px] font-bold text-[#A3AED0] uppercase tracking-wider",
    td: "px-6 py-3 whitespace-nowrap text-sm text-[#2B3674] font-medium border-none",
    statusBadge: (status: string) => {
      const colors: any = {
        [AttendanceStatus.FULL_DAY]: "bg-[#D1FAE5] text-[#05CD99]",
        [AttendanceStatus.HALF_DAY]: "bg-[#FEF3C7] text-[#FFB020]",
        [AttendanceStatus.LEAVE]: "bg-[#FEE2E2] text-[#EE5D50]",
        [AttendanceStatus.NOT_UPDATED]: "bg-[#FEF3C7] text-[#FFB020]",
        [AttendanceStatus.HOLIDAY]: "bg-[#DBEAFE] text-[#1890FF]",
        [AttendanceStatus.WEEKEND]: "bg-[#FEE2E2] text-[#EE5D50]", // Matching Leave style for Weekend as per MyTimesheet
        [AttendanceStatus.PENDING]: "bg-[#FEF3C7] text-[#FFB020]",
      };
      return `px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${colors[status] || "bg-gray-100 text-gray-700"}`;
    },
  };

  return (
    <div className={styles.container}>
      {/* Search and Branding could be in Header, assuming SidebarLayout handles it */}

      {/* Stats Cards */}
      <div className={styles.cardGrid}>
        {/* Card 1: Total Employees */}
        <div
          className={styles.statCard(
            "bg-gradient-to-br from-[#4318FF] to-[#5BC4FF]",
          )}
        >
          <div className={styles.glassInner}></div>
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-sm font-medium text-white/80">
              Total Employees
            </h4>
            <TrendingUp size={20} className="text-white/60" />
          </div>
          <h2 className="text-4xl font-black mb-1">{totalItems || 0}</h2>
          <p className="text-[11px] opacity-70 font-bold">+4.2% this month</p>
          <Users
            className="absolute bottom-4 right-4 text-white/20"
            size={48}
          />
        </div>

        {/* Card 2: Hours Worked */}
        <div
          className={styles.statCard(
            "bg-gradient-to-br from-[#868CFF] to-[#4318FF]",
          )}
        >
          <div className={styles.glassInner}></div>
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-sm font-medium text-white/80">Hours Worked</h4>
            <Clock size={20} className="text-white/60" />
          </div>
          <h2 className="text-4xl font-black mb-1">
            {stats.totalHours.toLocaleString()}
          </h2>
          <p className="text-[11px] opacity-70 font-bold">+8.5% vs last week</p>
          <Clock
            className="absolute bottom-4 right-4 text-white/20"
            size={48}
          />
        </div>

        {/* Card 3: Today Present */}
        <div
          className={styles.statCard(
            "bg-gradient-to-br from-[#05CD99] to-[#48BB78]",
          )}
        >
          <div className={styles.glassInner}></div>
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-sm font-medium text-white/80">Today Present</h4>
            <Users size={20} className="text-white/60" />
          </div>
          <h2 className="text-4xl font-black mb-1">{stats.todayPresent}</h2>
          <p className="text-[11px] opacity-70 font-bold">Active Now</p>
          <TrendingUp
            className="absolute bottom-4 right-4 text-white/20"
            size={48}
          />
        </div>

        {/* Card 4: Total Absent */}
        <div
          className={styles.statCard(
            "bg-gradient-to-br from-[#FF9060] to-[#FF5C00]",
          )}
        >
          <div className={styles.glassInner}></div>
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-sm font-medium text-white/80">Total Absent</h4>
            <Users size={20} className="text-white/60" />
          </div>
          <h2 className="text-4xl font-black mb-1">{stats.totalAbsent}</h2>
          <p className="text-[11px] opacity-70 font-bold">On Leave Today</p>
          <FileText
            className="absolute bottom-4 right-4 text-white/20"
            size={48}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-t-[24px] border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          {/* Custom Modern Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-[#2B3674] font-bold text-sm hover:bg-gray-50 transition-all focus:ring-2 ring-blue-50"
            >
              <Filter size={16} className="text-[#4318FF]" />
              <span>
                {selectedDept === "All" ? "All Departments" : selectedDept}
              </span>
              <ChevronDown
                size={16}
                className={`text-[#A3AED0] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-1 mb-1">
                  <span className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest pl-2">
                    Departments
                  </span>
                </div>
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => {
                      setSelectedDept(dept);
                      setIsDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-5 py-2 text-sm font-semibold transition-colors
                      ${
                        selectedDept === dept
                          ? "text-[#4318FF] bg-[#4318FF]/5"
                          : "text-[#2B3674] hover:bg-gray-50 hover:text-[#4318FF]"
                      }`}
                  >
                    {dept === "All" ? "All Departments" : dept}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-100 rounded-xl text-sm font-medium w-64 outline-none focus:ring-2 ring-blue-50"
            />
          </div>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-[#4318FF] to-[#868CFF] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 tracking-widest uppercase group"
        >
          <Download size={16} className="group-hover:animate-bounce" />
          <span>Export Data</span>
        </button>
      </div>

      {/* Main Table */}
      <div className={styles.tableWrapper}>
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-[#F8F9FC]">
            <tr>
              <th className={`${styles.th} text-left`}>Employee</th>
              <th className={`${styles.th} text-center`}>ID</th>
              <th className={`${styles.th} text-center`}>Department</th>
              <th className={`${styles.th} text-center`}>Today's Hours</th>
              <th className={`${styles.th} text-center`}>Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currentItems.map((emp, index) => (
              <tr
                key={emp.id}
                className={`${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]/50"} hover:bg-[#E9EDF7] hover:shadow-[0px_4px_25px_rgba(112,144,176,0.18)] hover:scale-[1.01] transition-all duration-300 cursor-pointer group`}
              >
                <td className={styles.td}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-xs">
                      {emp.avatar}
                    </div>
                    <span className="font-bold">
                      {emp.fullName || emp.name}
                    </span>
                  </div>
                </td>
                <td
                  className={`${styles.td} text-center text-gray-400 font-bold`}
                >
                  {emp.employeeId || emp.id}
                </td>
                <td className={`${styles.td} text-center`}>
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: emp.deptColor }}
                    ></div>
                    <span className="text-gray-600">{emp.department}</span>
                  </div>
                </td>
                <td className={`${styles.td} text-center`}>
                  <div className="flex flex-col gap-1 w-32 mx-auto">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>{emp.todayHours} / 9 Hrs</span>
                      <Clock size={10} className="text-gray-400" />
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-blue-400 to-cyan-400 rounded-full"
                        style={{ width: `${(emp.todayHours / 9) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className={`${styles.td} text-center`}>
                  <span className={styles.statusBadge(emp.status)}>
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400">
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-100 disabled:opacity-50 hover:bg-gray-50 transition-colors text-[#2B3674]"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-100 disabled:opacity-50 hover:bg-gray-50 transition-colors text-[#2B3674]"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Export Selection Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#2B3674]/20 backdrop-blur-md"
            onClick={() => {
              setIsExportModalOpen(false);
              setExportStep("employees");
            }}
          ></div>

          <div
            className={`relative bg-white w-full transition-all duration-500 ease-in-out rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in flex flex-col ${
              exportStep === "employees"
                ? "max-w-3xl h-[720px]"
                : "max-w-md h-[480px]"
            }`}
          >
            {/* Modal Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white flex-shrink-0">
              <div className="flex items-center gap-4">
                {exportStep === "range" && (
                  <button
                    onClick={() => setExportStep("employees")}
                    className="p-2 hover:bg-gray-100 rounded-full text-[#4318FF] transition-all active:scale-90"
                  >
                    <ArrowLeft size={24} />
                  </button>
                )}
                <div>
                  <h2 className="text-2xl font-black text-[#2B3674]">
                    {exportStep === "employees"
                      ? "Select Employees"
                      : "Select Date Range"}
                  </h2>
                  <p className="text-sm font-bold text-[#A3AED0]">
                    {exportStep === "employees"
                      ? "Choose employees to include in export"
                      : "Choose the period for attendance report"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsExportModalOpen(false);
                  setExportStep("employees");
                }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            {exportStep === "employees" ? (
              <div className="flex-1 flex flex-col min-h-0 px-10 py-6">
                {/* Modal Filters */}
                <div className="flex flex-wrap gap-4 items-center flex-shrink-0 mb-8">
                  <div className="relative" ref={modalDeptRef}>
                    <button
                      onClick={() => setIsModalDeptOpen(!isModalDeptOpen)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-[#2B3674] font-bold text-sm hover:bg-gray-50 transition-all"
                    >
                      <Filter size={16} className="text-[#4318FF]" />
                      <span>
                        {modalDept === "All" ? "All Departments" : modalDept}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-[#A3AED0] transition-transform ${isModalDeptOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isModalDeptOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[110]">
                        {departments.map((d) => (
                          <button
                            key={d}
                            onClick={() => {
                              setModalDept(d);
                              setIsModalDeptOpen(false);
                            }}
                            className={`w-full text-left px-5 py-2 text-sm font-semibold hover:bg-gray-50 ${modalDept === d ? "text-[#4318FF] bg-[#4318FF]/5" : "text-[#2B3674]"}`}
                          >
                            {d === "All" ? "All Departments" : d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative flex-1">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-medium outline-none shadow-sm focus:ring-2 ring-blue-50"
                    />
                  </div>
                </div>

                {/* Modal List */}
                <div className="flex-1 overflow-y-auto min-h-0 p-2">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr>
                        <th className="pb-2 w-12 text-center font-bold text-[#A3AED0] text-[11px] uppercase tracking-wider">
                          <div
                            onClick={toggleAll}
                            className={`w-5 h-5 rounded-md border-2 mx-auto flex items-center justify-center cursor-pointer transition-all ${selectedEmps.size === entities.length ? "bg-[#4318FF] border-[#4318FF]" : "border-gray-200 hover:border-[#4318FF]"}`}
                          >
                            {selectedEmps.size === entities.length && (
                              <Check size={14} className="text-white" />
                            )}
                          </div>
                        </th>
                        <th className="pb-2 text-left font-bold text-[#A3AED0] text-[11px] uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="pb-2 text-left font-bold text-[#A3AED0] text-[11px] uppercase tracking-wider">
                          Dept
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent">
                      {filteredModalEmps.map((emp) => {
                        const id = emp.employeeId || emp.id;
                        const isSelected = selectedEmps.has(id);
                        return (
                          <tr
                            key={id}
                            onClick={() => toggleEmp(id)}
                            className={`group cursor-pointer transition-all hover:bg-[#F4F7FE] ${isSelected ? "bg-[#4318FF]/5" : ""}`}
                          >
                            <td className="p-4 text-center border-b border-gray-50">
                              <div
                                className={`w-5 h-5 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${isSelected ? "bg-[#4318FF] border-[#4318FF]" : "border-gray-200 group-hover:border-[#4318FF]"}`}
                              >
                                {isSelected && (
                                  <Check size={14} className="text-white" />
                                )}
                              </div>
                            </td>
                            <td className="p-4 border-b border-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4318FF] to-[#5BC4FF] flex items-center justify-center text-white font-black text-[10px]">
                                  {emp.fullName?.charAt(0) || "U"}
                                </div>
                                <span className="font-bold text-[#2B3674] text-sm">
                                  {emp.fullName || emp.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-sm font-bold text-[#A3AED0] border-b border-gray-50">
                              {emp.department}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredModalEmps.length === 0 && (
                    <div className="py-20 text-center">
                      <p className="text-gray-400 font-bold">
                        No employees found matching your search.
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-8 border-t border-gray-100 flex justify-between items-center bg-[#F8F9FC] flex-shrink-0">
                  <span className="text-sm font-bold text-[#A3AED0]">
                    {selectedEmps.size} employees selected
                  </span>
                  <button
                    onClick={() => setExportStep("range")}
                    disabled={selectedEmps.size === 0}
                    className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 ${selectedEmps.size === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#4318FF] text-white shadow-lg shadow-blue-500/30 hover:-translate-y-1"}`}
                  >
                    <span>Next Step</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col px-12 py-12 bg-white min-h-0 justify-center">
                <div className="max-w-md mx-auto w-full flex flex-col gap-8">
                  {/* From Date */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest pl-1">
                      From Date
                    </label>
                    <div className="relative group">
                      <input
                        type="date"
                        value={exportStartDate}
                        onChange={(e) => setExportStartDate(e.target.value)}
                        className="w-full pl-6 pr-12 py-4 bg-[#F4F7FE] border-none rounded-[16px] text-[#2B3674] font-bold outline-none focus:ring-2 ring-blue-100 transition-all cursor-pointer appearance-none"
                      />
                      <Calendar
                        size={18}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2B3674]/50 pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* To Date */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest pl-1">
                      To Date
                    </label>
                    <div className="relative group">
                      <input
                        type="date"
                        value={exportEndDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                        className="w-full pl-6 pr-12 py-4 bg-[#F4F7FE] border-none rounded-[16px] text-[#2B3674] font-bold outline-none focus:ring-2 ring-blue-100 transition-all cursor-pointer appearance-none"
                      />
                      <Calendar
                        size={18}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2B3674]/50 pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Two-Line Footer */}
                  <div className="flex flex-col items-center gap-6 w-full pt-2">
                    {/* Upper Line: Selection Count Centered */}
                    <span className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest text-center">
                      {selectedEmps.size} employees selected
                    </span>

                    {/* Lower Line: Centered Buttons */}
                    <div className="flex items-center justify-center gap-12 w-full">
                      <button
                        onClick={() => setExportStep("employees")}
                        className="text-xs font-bold text-[#A3AED0] hover:text-[#2B3674] transition-all uppercase tracking-widest"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleBulkExport}
                        disabled={isExporting}
                        className="flex items-center gap-4 px-10 py-4 bg-gradient-to-r from-[#4318FF] to-[#868CFF] text-white rounded-[16px] font-black text-[11px] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-70 flex-shrink-0 tracking-widest uppercase"
                      >
                        <span>
                          {isExporting ? "GENERATING..." : "DOWNLOAD PDF"}
                        </span>
                        {!isExporting && <Download size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
