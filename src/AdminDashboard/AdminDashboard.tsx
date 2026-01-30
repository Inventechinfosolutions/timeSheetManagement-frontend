import { useState, useEffect, useMemo, useRef } from "react";
import Chart from "react-apexcharts";
import { useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { getEntities } from "../reducers/employeeDetails.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  Users,
  Search,
  Clock,
  FileText,
  TrendingUp,
  Filter,
  ChevronDown,
  Download,
  X,
  Check,
  ChevronRight,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import {
  fetchAllEmployeesMonthlyAttendance,
  fetchMonthlyAttendance,
  AttendanceStatus,
} from "../reducers/employeeAttendance.reducer";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import { downloadPdf } from "../utils/downloadPdf";
import { generateRangeEntries } from "../utils/attendanceUtils";
import { fetchUnreadNotifications } from "../reducers/leaveNotification.reducer";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Root States
  const { entities, totalItems } = useAppSelector(
    (state: RootState) => state.employeeDetails,
  );
  const { employeeRecords } = useAppSelector(
    (state: RootState) => state.attendance,
  );
  // @ts-ignore
  const { holidays } = useAppSelector(
    (state: RootState) => state.masterHolidays || { holidays: [] },
  );

  // Time-related constants
  const now = new Date();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
  const currentYear = now.getFullYear().toString();

  // Dashboard Stats & Cache State
  const [globalStatsCache, setGlobalStatsCache] = useState<{
    entities: any[];
    totalItems: number;
  } | null>(null);

  // Chart Logic States
  // Chart Logic States
  const [sortOption] = useState("hours_desc");
  // const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  // const sortDropdownRef = useRef<HTMLDivElement>(null);

  // const [comparisonDept] = useState("All");
  // const [isComparisonDeptOpen, setIsComparisonDeptOpen] = useState(false);
  // const comparisonDeptRef = useRef<HTMLDivElement>(null);

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
    firstDay.toISOString().split("T")[0],
  );
  const [exportEndDate, setExportEndDate] = useState(
    lastDay.toISOString().split("T")[0],
  );
  const [isExporting, setIsExporting] = useState(false);

  // Effects
  useEffect(() => {
    // Initial fetch for dashboard stats (Global Attendance)
    dispatch(
      fetchAllEmployeesMonthlyAttendance({
        month: currentMonth,
        year: currentYear,
      }),
    );
    // Initial fetch for global statistics cache
    dispatch(getEntities({ page: 1, limit: 1000 })).then((action: any) => {
      if (action.payload) {
        const data = action.payload;
        const entitiesList = Array.isArray(data) ? data : data.data || [];
        const totalCount = data.totalItems || data.total || entitiesList.length;
        setGlobalStatsCache({
          entities: entitiesList,
          totalItems: totalCount,
        });
      }
    });
    // Fetch holidays for PDF export
    dispatch(fetchHolidays());
  }, [dispatch, currentMonth, currentYear]);

  // Refresh admin notifications on load
  useEffect(() => {
    dispatch(fetchUnreadNotifications());
  }, [dispatch]);

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

      // Calculate months in range
      const monthsToFetch: { month: string; year: string }[] = [];
      const temp = new Date(start);
      temp.setDate(1);
      while (temp <= end) {
        monthsToFetch.push({
          month: (temp.getMonth() + 1).toString().padStart(2, "0"),
          year: temp.getFullYear().toString(),
        });
        temp.setMonth(temp.getMonth() + 1);
      }

      const endMonth = (end.getMonth() + 1).toString().padStart(2, "0");
      const endYear = end.getFullYear().toString();
      if (
        !monthsToFetch.some((m) => m.month === endMonth && m.year === endYear)
      ) {
        monthsToFetch.push({ month: endMonth, year: endYear });
      }

      for (const emp of selectedEntities) {
        const empId = emp.employeeId || emp.id;
        let allRecords: any[] = [];

        for (const { month, year } of monthsToFetch) {
          try {
            const result = await dispatch(
              fetchMonthlyAttendance({ employeeId: empId, month, year }),
            ).unwrap();
            if (result) allRecords = [...allRecords, ...result];
          } catch (e) {
            console.warn(
              `Failed to fetch records for ${empId} at ${month}/${year}`,
            );
          }
        }

        const entries = generateRangeEntries(
          start,
          end,
          new Date(),
          allRecords,
        );
        const totalHours = entries.reduce(
          (acc, curr) => acc + (curr.totalHours || 0),
          0,
        );

        downloadPdf({
          employeeName: emp.fullName || emp.name,
          employeeId: empId,
          department: emp.department,
          designation: emp.designation,
          month: rangeStr,
          entries: entries,
          totalHours: totalHours,
          holidays: holidays || [],
        });

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

  // Memoized Stats & Chart Data
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
      const rDateStr =
        r.workingDate instanceof Date
          ? r.workingDate.toISOString().split("T")[0]
          : String(r.workingDate).split("T")[0];
      return rDateStr === todayStr;
    });

    const todayPresent = todayRecords.filter((r) =>
      [AttendanceStatus.FULL_DAY, AttendanceStatus.HALF_DAY].includes(
        r.status as AttendanceStatus,
      ),
    ).length;

    const todayAbsent = todayRecords.filter(
      (r) => r.status === AttendanceStatus.LEAVE,
    ).length;

    return {
      totalHours: Math.round(totalMinutes / 60),
      todayPresent,
      totalAbsent: todayAbsent,
    };
  }, [employeeRecords]);

  const chartData = useMemo(() => {
    const daysInMonth = new Date(
      parseInt(currentYear),
      parseInt(currentMonth),
      0,
    ).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const globalEntities = globalStatsCache
      ? globalStatsCache.entities
      : entities;
    const filteredEntities = entities;

    // 1. Trend (Monthly Cumulative)
    const trendDailyHours = days.map((day) => {
      const dateStr = `${currentYear}-${currentMonth}-${day.toString().padStart(2, "0")}`;
      let totalDayHours = 0;
      globalEntities.forEach((emp: any) => {
        const empId = emp.employeeId || emp.id;
        const records = employeeRecords[empId] || [];
        const dayRecord = records.find((r) => {
          const rDate =
            r.workingDate instanceof Date
              ? r.workingDate.toISOString().split("T")[0]
              : String(r.workingDate).split("T")[0];
          return rDate === dateStr;
        });
        if (dayRecord) totalDayHours += dayRecord.totalHours || 0;
      });
      return parseFloat(totalDayHours.toFixed(1));
    });

    // 2. Employee Hours Comparison (Filtered)
    const empHours = filteredEntities
      .map((emp) => {
        const empId = emp.employeeId || emp.id;
        const records = employeeRecords[empId] || [];
        const total = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);
        return { name: emp.fullName || emp.name || "Unknown", hours: total };
      })
      .sort((a, b) => {
        if (sortOption === "hours_desc") return b.hours - a.hours;
        if (sortOption === "hours_asc") return a.hours - b.hours;
        return 0;
      });

    // 3. Donut (Global Distribution)
    const departmentsList = [
      "HR",
      "IT",
      "Sales",
      "Marketing",
      "Finance",
      "Engineering",
      "Design",
      "Admin",
    ];

    return {
      trend: {
        series: [{ name: "Total Hours", data: trendDailyHours }],
        options: {
          chart: {
            type: "area" as const,
            toolbar: { show: false },
            fontFamily: "DM Sans, sans-serif",
          },
          stroke: { curve: "smooth" as const, width: 3 },
          xaxis: {
            categories: days.map(String),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: "#A3AED0", fontSize: "12px" } },
          },
          yaxis: { labels: { style: { colors: "#A3AED0", fontSize: "12px" } } },
          colors: ["#4318FF"],
          fill: {
            type: "gradient",
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.7,
              opacityTo: 0.2,
              stops: [0, 90, 100],
            },
          },
          dataLabels: { enabled: false },
          grid: {
            borderColor: "rgba(163, 174, 208, 0.1)",
            strokeDashArray: 5,
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } },
          },
          tooltip: { theme: "dark" },
        },
      },
      comparison: {
        series: [{ name: "Total Hours", data: empHours.map((e) => e.hours) }],
        maxHours: Math.max(...empHours.map((e) => e.hours), 10),
        categories: empHours.map((e) => e.name),
        commonOptions: {
          chart: {
            type: "bar" as const,
            toolbar: { show: false },
            fontFamily: "DM Sans, sans-serif",
            animations: { enabled: false },
            stacked: true,
          },
          plotOptions: {
            bar: { borderRadius: 4, horizontal: true, barHeight: "50%" },
          },
          dataLabels: { enabled: false },
          colors: ["#05CD99"],
          grid: {
            borderColor: "rgba(163, 174, 208, 0.1)",
            strokeDashArray: 5,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } },
            padding: { top: 0, right: 0, bottom: 0, left: 10 },
          },
          tooltip: { theme: "dark" },
          xaxis: { min: 0 },
        },
      },
      donut: {
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
                    label: "Total Employees",
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
      },
    };
  }, [
    employeeRecords,
    entities,
    globalStatsCache,
    currentMonth,
    currentYear,
    sortOption,
  ]);

  const styles = {
    container:
      "p-4 md:p-8 bg-[#F4F7FE] min-h-screen font-['DM_Sans',sans-serif]",
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

        <div
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
        </div>

        <div
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
        </div>

        <div
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
        </div>
      </div>

      {/* Analytics Section */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[#2B3674]">
          Attendance Analytics
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin-dashboard/daily-attendance")}
            className="flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-[#4318FF] to-[#868CFF] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <TrendingUp size={16} />
            <span>View Daily Status</span>
          </button>
        </div>
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
              options={chartData.donut.options}
              series={chartData.donut.series}
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
                        {[
                          "All",
                          "HR",
                          "IT",
                          "Sales",
                          "Marketing",
                          "Finance",
                          "Engineering",
                          "Design",
                          "Admin",
                        ].map((d) => (
                          <button
                            key={d}
                            onClick={() => {
                              setModalDept(d);
                              setIsModalDeptOpen(false);
                            }}
                            className={`w-full text-left px-5 py-2 text-sm font-semibold hover:bg-gray-50 ${modalDept === d ? "text-[#4318FF] bg-[#4318FF]/5" : "text-[#2B3674]"}`}
                          >
                            {d === "All" ? "All" : d}
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
                        onChange={(e) => setExportStartDate(e.target.value)}
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
