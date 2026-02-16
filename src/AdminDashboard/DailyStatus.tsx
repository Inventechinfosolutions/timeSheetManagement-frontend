import { RootState } from "../store";
import { getEntities } from "../reducers/employeeDetails.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  Search,
  Clock,
  Filter,
  ChevronDown,
  ArrowLeft,
  Download,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import {
  fetchAllEmployeesMonthlyAttendance,
  AttendanceStatus,
} from "../reducers/employeeAttendance.reducer";
import { downloadPdf } from "../utils/downloadPdf";
import { generateMonthlyEntries } from "../utils/attendanceUtils";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DailyStatusMobileCard from "./DailyStatusMobileCard";
import { fetchDepartments } from "../reducers/masterDepartment.reducer";

const DailyStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = location.pathname.startsWith("/manager-dashboard")
    ? "/manager-dashboard"
    : "/admin-dashboard";
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDept, setSelectedDept] = useState("All");
  const itemsPerPage = 10;
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedEmps, setSelectedEmps] = useState<Set<string>>(new Set());
  const [modalSearch, setModalSearch] = useState("");
  const [modalDept, setModalDept] = useState("All");
  const [isModalDeptOpen, setIsModalDeptOpen] = useState(false);
  const [exportStep, setExportStep] = useState<"employees" | "range">(
    "employees",
  );
  const modalDeptRef = useRef<HTMLDivElement>(null);

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

  const { departments } = useAppSelector(
    (state: RootState) => state.masterDepartments,
  );

  const { entities, totalItems } = useAppSelector(
    (state: RootState) => state.employeeDetails,
  );

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
    dispatch(fetchDepartments());
  }, [dispatch, currentMonth, currentYear]);

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

  // Export Logic
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

      const monthStr = start.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      for (const emp of selected) {
        const empId = emp.employeeId || emp.id;
        let records = employeeRecords[empId] || [];
        const entries = generateMonthlyEntries(start, new Date(), records);
        const totalHours = entries.reduce(
          (acc, curr) => acc + (curr.totalHours || 0),
          0,
        );

        downloadPdf({
          employeeName: emp.fullName || emp.name,
          employeeId: empId,
          department: emp.department,
          month: monthStr,
          entries: entries,
          totalHours: totalHours,
          holidays: [],
        });

        await new Promise((r) => setTimeout(r, 300));
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
    tableWrapper:
      "bg-white rounded-[20px] p-0 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] overflow-hidden border border-gray-100",
    th: "py-4 px-4 text-[13px] font-bold uppercase tracking-wider",
    td: "py-4 px-4 whitespace-nowrap text-sm text-[#2B3674] font-bold border-none",
    statusBadge: (status: string) => {
      const colors: any = {
        [AttendanceStatus.FULL_DAY]: "bg-[#D1FAE5] text-[#05CD99]",
        [AttendanceStatus.HALF_DAY]: "bg-[#FEF3C7] text-[#FFB020]",
        [AttendanceStatus.LEAVE]: "bg-[#FEE2E2] text-[#EE5D50]",
        [AttendanceStatus.NOT_UPDATED]: "bg-[#FEF3C7] text-[#FFB020]",
        [AttendanceStatus.HOLIDAY]: "bg-[#DBEAFE] text-[#1890FF]",
        [AttendanceStatus.WEEKEND]: "bg-[#FEE2E2] text-[#EE5D50]",
        [AttendanceStatus.PENDING]: "bg-[#FEF3C7] text-[#FFB020]",
      };
      return `px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${colors[status] || "bg-gray-100 text-gray-700"}`;
    },
  };

  return (
    <div className={styles.container}>
      {/* Filter Bar */}
      <div className="bg-white p-4 md:p-6 rounded-t-[24px] border-b border-gray-100 flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 md:items-center flex-1">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(basePath)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-[#4318FF] transition-all flex-shrink-0"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-xl font-bold text-[#2B3674] whitespace-nowrap">
              Daily Status
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Custom Modern Dropdown */}
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between sm:justify-start gap-2 px-5 py-2.5 bg-white rounded-full shadow-[0px_18px_40px_rgba(112,144,176,0.12)] text-[#2B3674] font-bold text-sm hover:bg-gray-50 transition-all border border-transparent focus:border-[#4318FF]/20"
              >
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-[#4318FF]" />
                  <span>
                    {selectedDept === "All" ? "All Departments" : selectedDept}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-[#A3AED0] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full sm:w-48 bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.1)] border border-white/20 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-1 mb-1">
                    <span className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest pl-2">
                      Departments
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDept("All");
                      setIsDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-5 py-2 text-sm font-semibold transition-colors
                      ${
                        selectedDept === "All"
                          ? "text-[#4318FF] bg-[#4318FF]/5"
                          : "text-[#2B3674] hover:bg-gray-50 hover:text-[#4318FF]"
                      }`}
                  >
                    All Departments
                  </button>
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => {
                        setSelectedDept(dept.departmentName);
                        setIsDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-5 py-2 text-sm font-semibold transition-colors
                        ${
                          selectedDept === dept.departmentName
                            ? "text-[#4318FF] bg-[#4318FF]/5"
                            : "text-[#2B3674] hover:bg-gray-50 hover:text-[#4318FF]"
                        }`}
                    >
                      {dept.departmentName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Box */}
            <div className="flex items-center bg-white rounded-full px-5 py-2.5 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] flex-1 border border-transparent focus-within:border-[#4318FF]/20 transition-all">
              <Search size={18} className="text-[#A3AED0] mr-2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-none outline-none bg-transparent text-[#2B3674] w-full text-sm font-semibold placeholder:text-[#A3AED0]/60"
              />
            </div>

            {/* Clear All Button */}
            {(searchTerm !== "" || selectedDept !== "All") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDept("All");
                  setCurrentPage(1);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-full hover:bg-gray-50 active:scale-95 transition-all text-sm font-bold border border-gray-200 whitespace-nowrap"
                title="Clear all filters"
              >
                <X size={16} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsExportModalOpen(true)}
          className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4318FF] to-[#868CFF] text-white rounded-xl text-[11px] font-black shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 tracking-widest uppercase group flex-shrink-0"
        >
          <Download size={16} className="group-hover:animate-bounce" />
          <span>Export Data</span>
        </button>
      </div>

      {/* Main Table */}
      <div className={`${styles.tableWrapper} hidden lg:block`}>
        <table className="w-full border-separate border-spacing-0">
          <thead className="bg-[#4318FF] text-white">
            <tr>
              <th className={`${styles.th} text-left pl-10`}>Employee</th>
              <th className={`${styles.th} text-center`}>ID</th>
              <th className={`${styles.th} text-center`}>Department</th>
              <th className={`${styles.th} text-center`}>Today's Hours</th>
              <th className={`${styles.th} text-center pr-10`}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {currentItems.map((emp, index) => (
              <tr
                key={emp.id}
                className={`group transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} hover:bg-[#F1F4FF] cursor-pointer`}
              >
                <td className={`${styles.td} pl-10`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4318FF] to-[#5BC4FF] flex items-center justify-center text-white font-black text-[10px]">
                      {emp.avatar}
                    </div>
                    <span className="font-bold">
                      {emp.fullName || emp.name}
                    </span>
                  </div>
                </td>
                <td
                  className={`${styles.td} text-center text-[#475569] font-semibold`}
                >
                  {emp.employeeId || emp.id}
                </td>
                <td className={`${styles.td} text-center`}>
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: emp.deptColor }}
                    ></div>
                    <span className="text-[#475569] font-semibold">
                      {emp.department}
                    </span>
                  </div>
                </td>
                <td className={`${styles.td} text-center`}>
                  <div className="flex flex-col gap-1 w-32 mx-auto">
                    <div className="flex justify-between text-[10px] font-bold text-[#A3AED0]">
                      <span>{emp.todayHours} / 9 Hrs</span>
                      <Clock size={10} className="text-[#A3AED0]" />
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#4318FF] to-[#5BC4FF] rounded-full"
                        style={{
                          width: `${Math.min((emp.todayHours / 9) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className={`${styles.td} text-center pr-10`}>
                  <span className={styles.statusBadge(emp.status)}>
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="block lg:hidden">
        {currentItems.length > 0 ? (
          <DailyStatusMobileCard employees={currentItems} />
        ) : (
          <div className="py-24 text-center text-[#A3AED0] font-bold bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col items-center gap-3">
              <Search size={40} className="text-[#E0E5F2]" />
              <span>No employees found matching your criteria</span>
            </div>
          </div>
        )}
      </div>

      {currentItems.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-6 lg:px-10 lg:pb-10 gap-6 border-t border-gray-50">
          <div className="text-sm font-bold text-[#A3AED0] text-center sm:text-left">
            Showing{" "}
            <span className="text-[#2B3674]">
              {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="text-[#2B3674]">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="text-[#2B3674]">{totalItems}</span> entries
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border border-[#E9EDF7] transition-all flex items-center justify-center
              ${
                currentPage === 1
                  ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                  : "bg-white text-[#4318FF] hover:bg-[#4318FF]/5 active:scale-90 shadow-sm"
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="bg-[#F4F7FE] px-4 py-1.5 rounded-xl border border-transparent">
              <span className="text-xs font-black text-[#2B3674] tracking-widest">
                {currentPage} / {totalPages > 0 ? totalPages : 1}
              </span>
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl border border-[#E9EDF7] transition-all flex items-center justify-center
              ${
                currentPage === totalPages
                  ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                  : "bg-white text-[#4318FF] hover:bg-[#4318FF]/5 active:scale-90 shadow-sm"
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Export Selection Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto pt-10 md:pt-4">
          <div
            className="fixed inset-0 bg-[#2B3674]/20 backdrop-blur-md"
            onClick={() => {
              setIsExportModalOpen(false);
              setExportStep("employees");
            }}
          ></div>

          <div
            className={`relative bg-white w-full transition-all duration-500 ease-in-out rounded-[24px] md:rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in flex flex-col ${
              exportStep === "employees"
                ? "max-w-3xl h-auto max-h-[90vh]"
                : "max-w-md h-auto max-h-[90vh]"
            }`}
          >
            {/* Modal Header */}
            <div className="p-4 md:p-8 border-b border-gray-100 flex justify-between items-center bg-white flex-shrink-0">
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
                  <h2 className="text-lg md:text-2xl font-black text-[#2B3674] leading-tight">
                    {exportStep === "employees"
                      ? "Select Employees"
                      : "Select Date Range"}
                  </h2>
                  <p className="text-[10px] md:text-sm font-bold text-[#A3AED0]">
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
              <div className="flex-1 flex flex-col min-h-0 px-4 md:px-10 py-4 md:py-6">
                {/* Modal Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-shrink-0 mb-4 md:mb-8">
                  <div className="relative" ref={modalDeptRef}>
                    <button
                      onClick={() => setIsModalDeptOpen(!isModalDeptOpen)}
                      className="w-full flex items-center justify-between sm:justify-start gap-2 px-5 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-[#2B3674] font-bold text-sm hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Filter size={16} className="text-[#4318FF]" />
                        <span>
                          {modalDept === "All" ? "All Departments" : modalDept}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`text-[#A3AED0] transition-transform ${isModalDeptOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isModalDeptOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[110]">
                        <button
                          onClick={() => {
                            setModalDept("All");
                            setIsModalDeptOpen(false);
                          }}
                          className={`w-full text-left px-5 py-2 text-sm font-semibold hover:bg-gray-50 ${modalDept === "All" ? "text-[#4318FF] bg-[#4318FF]/5" : "text-[#2B3674]"}`}
                        >
                          All Departments
                        </button>
                        {departments.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => {
                              setModalDept(d.departmentName);
                              setIsModalDeptOpen(false);
                            }}
                            className={`w-full text-left px-5 py-2 text-sm font-semibold hover:bg-gray-50 ${modalDept === d.departmentName ? "text-[#4318FF] bg-[#4318FF]/5" : "text-[#2B3674]"}`}
                          >
                            {d.departmentName}
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
                <div className="p-4 md:p-8 border-t border-gray-100 flex justify-between items-center bg-[#F8F9FC] flex-shrink-0">
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
              <div className="flex-1 flex flex-col px-6 md:px-12 py-6 md:py-12 bg-white min-h-0 justify-center overflow-y-auto">
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

export default DailyStatus;
