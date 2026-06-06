import { useState, useEffect, useMemo, useRef } from "react";
import dayjs from "dayjs";
import Chart from "react-apexcharts";
import { useLocation } from "react-router-dom";
import { RootState } from "../store";
import { getEntities } from "../reducers/employeeDetails.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  Users,
  Search,
  Clock,
  TrendingUp,
  Filter,
  ChevronDown,
  Download,
  X,
  Check,
  ChevronRight,
  Calendar,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";
import { downloadAttendancePdfReport } from "../reducers/employeeAttendance.reducer";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import { saveAs } from "file-saver";
import { fetchDepartments } from "../reducers/masterDepartment.reducer";

const AdminDashboard = () => {
  const location = useLocation();

  const basePath = location.pathname.startsWith("/manager-dashboard")
    ? "/manager-dashboard"
    : "/admin-dashboard";
  const dispatch = useAppDispatch();

  // Root States
  const { entities, totalItems } = useAppSelector(
    (state: RootState) => state.employeeDetails,
  );
  // @ts-ignore
  const { holidays } = useAppSelector(
    (state: RootState) => state.masterHolidays || { holidays: [] },
  );
  const { departments } = useAppSelector(
    (state: RootState) => state.masterDepartments,
  );

  // Time-related constants
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentMonth = (selectedDate.getMonth() + 1)
    .toString()
    .padStart(2, "0");
  const currentYear = selectedDate.getFullYear().toString();
  const now = new Date();

  // Dashboard Stats & Cache State
  const [globalStatsCache, setGlobalStatsCache] = useState<{
    entities: any[];
    totalItems: number;
  } | null>(null);

  // Export Modal States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedEmps, setSelectedEmps] = useState<Set<string>>(new Set());
  const [modalSearch, setModalSearch] = useState("");
  const [modalDept, setModalDept] = useState("All");
  const [isModalDeptOpen, setIsModalDeptOpen] = useState(false);
  const [exportStep, setExportStep] = useState<"employees" | "range">(
    "employees",
  );
  const modalDeptRef = useRef<HTMLDivElement>(null);

  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [exportStartDate, setExportStartDate] = useState(
    dayjs(firstDay).format("YYYY-MM-DD"),
  );
  const [exportEndDate, setExportEndDate] = useState(
    dayjs(lastDay).format("YYYY-MM-DD"),
  );
  const [isExporting, setIsExporting] = useState(false);

  // Effects
  useEffect(() => {
    dispatch(getEntities({ page: 1, limit: 1000, userStatus: "ACTIVE" })).then(
      (action: any) => {
        if (action.payload) {
          const data = action.payload;
          const entitiesList = Array.isArray(data) ? data : data.data || [];
          const totalCount =
            data.totalItems || data.total || entitiesList.length;
          setGlobalStatsCache({
            entities: entitiesList,
            totalItems: totalCount,
          });
        }
      },
    );
    if (holidays.length === 0) {
      dispatch(fetchHolidays());
    }
    if (departments.length === 0) {
      dispatch(fetchDepartments());
    }
  }, [dispatch, holidays.length, departments.length]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  // Export Logic Helpers
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
      const selectedEntities = entities.filter((e) =>
        selectedEmps.has(e.employeeId || e.id),
      );
      const start = new Date(exportStartDate);
      const end = new Date(exportEndDate);

      const rangeStr = `${start.toLocaleDateString("en-US", { month: "short", year: "numeric", day: "numeric" })} to ${end.toLocaleDateString("en-US", { month: "short", year: "numeric", day: "numeric" })}`;

      for (const emp of selectedEntities) {
        const empId = emp.employeeId || emp.id;

        const blob = await downloadAttendancePdfReport(
          parseInt(currentMonth),
          parseInt(currentYear),
          empId,
          exportStartDate,
          exportEndDate,
        );

        saveAs(
          blob,
          `Attendance_${empId}_${exportStartDate}_to_${exportEndDate}.pdf`,
        );

        await new Promise((r) => setTimeout(r, 500));
      }

      setIsExportModalOpen(false);
      setExportStep("employees");
      setSelectedEmps(new Set());
    } catch (error) {
      console.error("Bulk export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  const chartData = useMemo(() => {
    const globalEntities = globalStatsCache
      ? globalStatsCache.entities
      : entities;

    let departmentsList = departments.map((d) => d.departmentName);

    const isManagerView = basePath === "/manager-dashboard";
    if (isManagerView) {
      const activeDepts = new Set(
        globalEntities.map((e: any) => e.department).filter(Boolean),
      );
      departmentsList = departmentsList.filter((d) => activeDepts.has(d));
    }

    return {
      series: departmentsList.map(
        (dept) =>
          globalEntities.filter((e: any) => e.department === dept).length,
      ),
      options: {
        labels: departmentsList,
        colors: [
          "#4318FF",
          "#6AD2FF",
          "#01B574",
          "#FFB547",
          "#EE5D50",
          "#7551FF",
          "#E312DC",
          "#A3AED0",
        ],
        chart: {
          type: "donut" as const,
          fontFamily: "DM Sans, sans-serif",
          toolbar: { show: false },
        },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                total: {
                  show: true,
                  showAlways: true,
                  label:
                    isManagerView && departmentsList.length === 1
                      ? departmentsList[0]
                      : "Total Employees",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#A3AED0",
                },
                value: {
                  show: true,
                  fontSize: "30px",
                  fontWeight: 700,
                  color: "#2B3674",
                },
              },
            },
          },
        },
        dataLabels: { enabled: false },
        legend: { position: "bottom" as const },
        tooltip: { theme: "dark" },
      },
    };
  }, [entities, globalStatsCache, departments, basePath]);

  const styles = {
    container: "p-4 md:p-8 bg-[#F4F7FE] font-['DM_Sans',sans-serif]",
    cardGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8",
    statCard: (gradient: string) =>
      `relative overflow-hidden p-6 rounded-[24px] text-white shadow-xl ${gradient} transition-transform hover:-translate-y-1 duration-300`,
    glassInner:
      "absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl",
  };

  return (
    <div
      className={`${styles.container} h-full overflow-y-auto custom-scrollbar`}
    >
      {/* Month Selector Section */}
      <div className="flex justify-center md:justify-end mb-6">
        <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-sm border border-gray-100/50 gap-2">
          <button
            onClick={() => {
              const prev = new Date(selectedDate);
              prev.setMonth(prev.getMonth() - 1);
              setSelectedDate(prev);
            }}
            className="p-1 hover:bg-gray-50 rounded-full transition-colors text-[#4318FF] hover:scale-110 active:scale-95"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>

          <span className="text-[#1B2559] font-bold min-w-[90px] text-center text-xs md:text-sm selection:bg-none tracking-tight">
            {selectedDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </span>

          <button
            onClick={() => {
              const next = new Date(selectedDate);
              next.setMonth(next.getMonth() + 1);
              setSelectedDate(next);
            }}
            className="p-1 hover:bg-gray-50 rounded-full transition-colors text-[#4318FF] hover:scale-110 active:scale-95"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className={styles.cardGrid}>
        <div
          className={styles.statCard(
            "bg-linear-to-br from-[#4318FF] to-[#5BC4FF]",
          )}
        >
          <div className={styles.glassInner} />
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-sm font-medium text-white/80">
              Total Employees
            </h1>
            <TrendingUp size={20} className="text-white/60" />
          </div>
          <h2 className="text-4xl font-black mb-1">
            {globalStatsCache ? globalStatsCache.totalItems : totalItems}
          </h2>
          <p className="text-[11px] opacity-70 font-bold">+4.2% this month</p>
          <Users
            className="absolute bottom-4 right-4 text-white/20"
            size={48}
          />
        </div>

        {/* <div
          className={styles.statCard(
            "bg-linear-to-br from-[#868CFF] to-[#4318FF]",
          )}
        >
          <div className={styles.glassInner} />
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-sm font-medium text-white/80">Hours Worked</h1>
            <Clock size={20} className="text-white/60" />
          </div>
          <h2 className="text-4xl font-black mb-1">
            {stats.totalHours.toLocaleString()}
          </h2>
          <p className="text-[11px] opacity-70 font-bold">Hours</p>
          <Clock
            className="absolute bottom-4 right-4 text-white/20"
            size={48}
          />
        </div> */}

        {/* <div
          className={styles.statCard(
            "bg-linear-to-br from-[#05CD99] to-[#48BB78]",
          )}
        >
          <div className={styles.glassInner} />
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-sm font-medium text-white/80">Today Present</h1>
            <Users size={20} className="text-white/60" />
          </div>
          <h2 className="text-4xl font-black mb-1">{stats.todayPresent}</h2>
          <p className="text-[11px] opacity-70 font-bold">Active Now</p>
          <TrendingUp
            className="absolute bottom-4 right-4 text-white/20"
            size={48}
          />
        </div> */}

        {/* <div
          className={styles.statCard(
            "bg-linear-to-br from-[#FF9060] to-[#FF5C00]",
          )}
        >
          <div className={styles.glassInner} />
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-sm font-medium text-white/80">Total Absent</h1>
            <Users size={20} className="text-white/60" />
          </div>
          <h2 className="text-4xl font-black mb-1">{stats.totalAbsent}</h2>
          <p className="text-[11px] opacity-70 font-bold">On Leave Today</p>
          <FileText
            className="absolute bottom-4 right-4 text-white/20"
            size={48}
          />
        </div> */}
      </div>

      {/* Analytics Section */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[#2B3674]">
          Attendance Analytics
        </h3>
        {/* <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`${basePath}/daily-attendance`)}
            className="flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-[#4318FF] to-[#868CFF] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <TrendingUp size={16} />
            <span>View Daily Status</span>
          </button>
        </div> */}
      </div>

      <div className="flex justify-center mb-20">
        {/* Donut Chart: Distribution */}
        <div className="bg-white p-6 rounded-[24px] shadow-[0px_18px_40px_rgba(112,144,176,0.08)] max-w-[700px] w-full">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-[#2B3674] flex items-center gap-2">
              Employee Distribution
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock size={16} className="text-gray-500" />
              </div>
            </h4>
          </div>
          <div className="h-[420px] w-full flex items-center justify-center">
            <Chart
              options={chartData.options}
              series={chartData.series}
              type="donut"
              height="100%"
              width="100%"
            />
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#2B3674]/20 backdrop-blur-md"
            onClick={() => {
              setIsExportModalOpen(false);
              setExportStep("employees");
            }}
          />
          <div
            className={`relative bg-white w-full transition-all duration-500 rounded-[32px] shadow-2xl overflow-hidden flex flex-col ${exportStep === "employees" ? "max-w-3xl h-[720px]" : "max-w-md h-[480px]"}`}
          >
            {/* Modal Header */}
            <div className="px-8 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                {exportStep === "range" && (
                  <button
                    onClick={() => setExportStep("employees")}
                    className="p-2 hover:bg-gray-100 rounded-full text-[#4318FF]"
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
                      ? "Choose employees to export"
                      : "Select report period"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsExportModalOpen(false);
                  setExportStep("employees");
                }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
              >
                <X size={24} />
              </button>
            </div>

            {exportStep === "employees" ? (
              <div className="flex-1 flex flex-col min-h-0 px-8 py-4">
                <div className="flex gap-4 items-center mb-4 shrink-0">
                  <div className="relative" ref={modalDeptRef}>
                    <button
                      onClick={() => setIsModalDeptOpen(!isModalDeptOpen)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-[#2B3674] font-bold text-sm"
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
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-110 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                          onClick={() => {
                            setModalDept("All");
                            setIsModalDeptOpen(false);
                          }}
                          className={`w-full text-left px-5 py-2 text-sm font-semibold hover:bg-gray-50 ${modalDept === "All" ? "text-[#4318FF] bg-[#4318FF]/5" : "text-[#2B3674]"}`}
                        >
                          All
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
                      placeholder="Search..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-medium outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr>
                        <th className="pb-2 w-12 text-center text-[#A3AED0] text-[11px] uppercase">
                          <div
                            onClick={toggleAll}
                            className={`w-5 h-5 rounded-md border-2 mx-auto flex items-center justify-center cursor-pointer ${selectedEmps.size === entities.length ? "bg-[#4318FF] border-[#4318FF]" : "border-gray-200"}`}
                          >
                            {selectedEmps.size === entities.length && (
                              <Check size={14} className="text-white" />
                            )}
                          </div>
                        </th>
                        <th className="pb-2 text-left text-[#A3AED0] text-[11px] uppercase">
                          Employee
                        </th>
                        <th className="pb-2 text-left text-[#A3AED0] text-[11px] uppercase">
                          Department
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredModalEmps.map((emp) => {
                        const id = emp.employeeId || emp.id;
                        const isSelected = selectedEmps.has(id);
                        return (
                          <tr
                            key={id}
                            onClick={() => toggleEmp(id)}
                            className={`cursor-pointer hover:bg-[#F4F7FE] ${isSelected ? "bg-[#4318FF]/5" : ""}`}
                          >
                            <td className="p-4 text-center border-b border-gray-50">
                              <div
                                className={`w-5 h-5 rounded-full border-2 mx-auto flex items-center justify-center ${isSelected ? "bg-[#4318FF] border-[#4318FF]" : "border-gray-200"}`}
                              >
                                {isSelected && (
                                  <Check size={14} className="text-white" />
                                )}
                              </div>
                            </td>
                            <td className="p-4 border-b border-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#F4F7FE] to-white flex items-center justify-center border border-white shrink-0 group-hover:scale-110 transition-transform">
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
                </div>
                <div className="px-8 py-3 border-t border-gray-100 flex justify-between items-center bg-[#F8F9FC] shrink-0">
                  <span className="text-sm font-bold text-gray-700">
                    {selectedEmps.size} selected
                  </span>
                  <button
                    onClick={() => setExportStep("range")}
                    disabled={selectedEmps.size === 0}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-sm transition-all ${selectedEmps.size === 0 ? "bg-gray-200 text-gray-400" : "bg-[#4318FF] text-white shadow-lg"}`}
                  >
                    Next Step <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col px-12 py-12 justify-center">
                <div className="max-w-md mx-auto w-full flex flex-col gap-8">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest pl-1">
                      From Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={exportStartDate}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          setExportStartDate(newStart);
                          if (exportEndDate && newStart && exportEndDate < newStart) {
                            setExportEndDate(newStart);
                          }
                        }}
                        className="w-full pl-6 pr-12 py-4 bg-[#F4F7FE] rounded-[16px] text-[#2B3674] font-bold outline-none cursor-pointer"
                      />
                      <Calendar
                        size={18}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2B3674]/50 pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest pl-1">
                      To Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={exportEndDate}
                        min={exportStartDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                        className="w-full pl-6 pr-12 py-4 bg-[#F4F7FE] rounded-[16px] text-[#2B3674] font-bold outline-none cursor-pointer"
                      />
                      <Calendar
                        size={18}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2B3674]/50 pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-6 pt-2">
                    <span className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">
                      {selectedEmps.size} selected
                    </span>
                    <div className="flex gap-12">
                      <button
                        onClick={() => setExportStep("employees")}
                        className="text-xs font-bold text-[#A3AED0] hover:text-[#2B3674] uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBulkExport}
                        disabled={isExporting}
                        className="flex items-center gap-4 px-10 py-4 bg-linear-to-r from-[#4318FF] to-[#868CFF] text-white rounded-[16px] font-black text-[11px] disabled:opacity-70 shadow-lg shadow-blue-500/20"
                      >
                        {isExporting ? "GENERATING..." : "DOWNLOAD PDF"}{" "}
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
