import { useState, useEffect, useMemo, useRef } from "react";
import dayjs from "dayjs";
import Chart from "react-apexcharts";
import { useLocation, useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { clearErrorMessage, getEntities, getEntity } from "../reducers/employeeDetails.reducer";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  Users,
  Briefcase,
  Filter,
  ChevronDown,
  Download,
  X,
  Check,
  ChevronRight,
  Calendar,
  ArrowLeft,
  Building2,
  ChevronUp,
  RefreshCw,
  UserCheck,
  Plane,
  ClipboardCheck,
  UserPlus,
  Lock,
} from "lucide-react";
import { message } from "antd";
import { UserType } from "../enums";
import { downloadAttendancePdfReport } from "../reducers/employeeAttendance.reducer";
import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import { saveAs } from "file-saver";
import { fetchDepartments } from "../reducers/masterDepartment.reducer";
import { fetchAdminDashboardSummary } from "../reducers/adminDashboard.reducer";
import { SearchBox } from "../components/ui";
import { getAllLeaveRequests } from "../reducers/leaveRequest.reducer";
import { isCeoUser, isGeneralManagerUser, isCeoOrGmUser } from "../utils/roleAccess";
import {
  fetchLockType,
  updateLockType,
} from "../reducers/managerMapping.reducer";
import TodaySnapshotCard from "./dashboard/TodaySnapshotCard";
import PendingApprovalsCard from "./dashboard/PendingApprovalsCard";
import EventsScroller from "./dashboard/EventsScroller";
import PendingApprovalsTable from "./dashboard/PendingApprovalsTable";
import { DashboardScope } from "../types/adminDashboard.types";

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const basePath = location.pathname.startsWith("/manager-dashboard")
    ? "/manager-dashboard"
    : "/admin-dashboard";
  const isManagerView = basePath === "/manager-dashboard";
  const dashboardScope: DashboardScope = isManagerView ? "manager" : "admin";
  const dispatch = useAppDispatch();

  const {
    scope: summaryScope,
    summary: storedSummary,
    loading: summaryLoading,
    error: summaryError,
  } = useAppSelector((state: RootState) => state.adminDashboard);
  const summary = summaryScope === dashboardScope ? storedSummary : null;
  const refreshSummary = () => dispatch(fetchAdminDashboardSummary({ scope: dashboardScope }));

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
  const { currentUser } = useAppSelector((state: RootState) => state.user);
  const isCeo = isCeoUser(currentUser);
  const isGm = isGeneralManagerUser(currentUser);
  const isCeoOrGm = isCeoOrGmUser(currentUser);

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
  const [managerLeave, setManagerLeave] = useState<any[]>([]);
  const [managerLeaveLoading, setManagerLeaveLoading] = useState(false);
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleManagerExpanded = (employeeId: string) => {
    setExpandedManagers((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

  const requestStatusClass = (status?: string) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("approved") && !s.includes("cancellation"))
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (s.includes("rejected"))
      return "bg-rose-50 text-rose-700 border-rose-100";
    if (s.includes("pending") || s.includes("applied"))
      return "bg-amber-50 text-amber-700 border-amber-100";
    if (s.includes("cancel"))
      return "bg-orange-50 text-orange-700 border-orange-100";
    return "bg-slate-50 text-slate-600 border-slate-100";
  };

  // Department Lock Type State & Handlers
  const [selectedLockDepartment, setSelectedLockDepartment] = useState("");
  const [isLockDeptOpen, setIsLockDeptOpen] = useState(false);
  const [activeLockType, setActiveLockType] = useState<"Weekly" | "Monthly">("Weekly");
  const [isUpdatingLock, setIsUpdatingLock] = useState(false);
  const [managerOwnDepartment, setManagerOwnDepartment] = useState("");
  const [managerDeptStatus, setManagerDeptStatus] = useState<
    "idle" | "loading" | "ready" | "missing"
  >("idle");

  const applyLockType = (lockType?: string) => {
    if (!lockType) return;
    setActiveLockType(lockType === "Monthly" ? "Monthly" : "Weekly");
  };

  useEffect(() => {
    if (!isManagerView) return;
    const lookupIds = Array.from(
      new Set(
        [currentUser?.employeeId, currentUser?.loginId]
          .filter((id): id is string => Boolean(id))
          .map(String),
      ),
    );
    if (lookupIds.length === 0) {
      setManagerDeptStatus("missing");
      return;
    }

    let cancelled = false;
    setManagerDeptStatus("loading");

    const readDepartment = (profile: any) =>
      String(
        profile?.department ??
          profile?.department_name ??
          profile?.departmentName ??
          "",
      ).trim();

    (async () => {
      for (const id of lookupIds) {
        try {
          const profile = await dispatch(getEntity(id)).unwrap();
          const dept = readDepartment(profile);
          if (dept) {
            if (!cancelled) {
              setManagerOwnDepartment(dept);
              setManagerDeptStatus("ready");
            }
            return;
          }
        } catch {
          if (!cancelled) dispatch(clearErrorMessage());
        }
      }
      if (!cancelled) {
        setManagerOwnDepartment("");
        setManagerDeptStatus("missing");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isManagerView, currentUser?.employeeId, currentUser?.loginId, dispatch]);

  useEffect(() => {
    if (!isManagerView || !managerOwnDepartment) return;
    setSelectedLockDepartment(managerOwnDepartment);
    dispatch(fetchLockType({ department: managerOwnDepartment })).then((res: any) => {
      applyLockType(res.payload?.lockType);
    });
  }, [isManagerView, managerOwnDepartment, dispatch]);

  useEffect(() => {
    if (isManagerView) return;
    if (departments.length > 0 && !selectedLockDepartment) {
      const defaultDept = departments[0].departmentName;
      setSelectedLockDepartment(defaultDept);
      dispatch(fetchLockType({ department: defaultDept })).then((res: any) => {
        applyLockType(res.payload?.lockType);
      });
    }
  }, [isManagerView, departments, selectedLockDepartment, dispatch]);

  const handleSelectLockDepartment = async (deptName: string) => {
    setSelectedLockDepartment(deptName);
    setIsLockDeptOpen(false);
    try {
      const res = await dispatch(
        fetchLockType({ department: deptName }),
      ).unwrap();
      if (res?.lockType) {
        setActiveLockType(
          res.lockType === "Monthly" ? "Monthly" : "Weekly",
        );
      }
    } catch (err) {
      console.error("Failed to fetch lock type for department:", err);
    }
  };

  const handleToggleLockType = async (type: "Weekly" | "Monthly") => {
    if (type === activeLockType) return;
    const targetDept = isManagerView
      ? managerOwnDepartment
      : selectedLockDepartment ||
        (departments.length > 0 ? departments[0].departmentName : "");

    if (!targetDept) return;

    // Immediately toggle state in UI
    setActiveLockType(type);
    if (targetDept && !selectedLockDepartment) {
      setSelectedLockDepartment(targetDept);
    }

    setIsUpdatingLock(true);
    try {
      await dispatch(
        updateLockType({
          lockType: type,
          department: targetDept,
          ...(isManagerView && currentUser?.loginId
            ? { managerId: currentUser.loginId }
            : {}),
        }),
      ).unwrap();
      message.success(
        `Lock type set to ${type}${targetDept ? ` for ${targetDept}` : ""}`,
      );
    } catch (err: any) {
      setActiveLockType(type === "Weekly" ? "Monthly" : "Weekly");
      message.error(err?.message || "Failed to update lock type");
    } finally {
      setIsUpdatingLock(false);
    }
  };

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

  useEffect(() => {
    dispatch(fetchAdminDashboardSummary({ scope: dashboardScope }));
  }, [dispatch, dashboardScope]);

  useEffect(() => {
    if (!isCeoOrGm) return;
    setManagerLeaveLoading(true);
    dispatch(
      getAllLeaveRequests({
        month: currentMonth,
        year: currentYear,
        role: "MANAGER",
        page: 1,
        limit: 200,
      }),
    ).then((action: any) => {
      if (getAllLeaveRequests.fulfilled.match(action)) {
        const payload = action.payload;
        const rows = Array.isArray(payload)
          ? payload
          : payload?.data || [];
        setManagerLeave(Array.isArray(rows) ? rows : []);
      } else {
        setManagerLeave([]);
      }
      setManagerLeaveLoading(false);
    });
  }, [dispatch, isCeoOrGm, currentMonth, currentYear]);

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

  const dashboardStats = useMemo(() => {
    const globalEntities = globalStatsCache
      ? globalStatsCache.entities
      : entities;
    const totalEmployees =
      globalStatsCache?.totalItems || totalItems || globalEntities.length;

    let departmentsList = departments.map((d) => d.departmentName);
    const isManagerView = basePath === "/manager-dashboard";
    if (isManagerView) {
      const activeDepts = new Set(
        globalEntities.map((e: any) => e.department).filter(Boolean),
      );
      departmentsList = departmentsList.filter((d) => activeDepts.has(d));
    }

    const deptBreakdown = departmentsList
      .map((dept) => ({
        name: dept,
        count: globalEntities.filter((e: any) => e.department === dept).length,
      }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);

    const topDept = deptBreakdown[0];
    const departmentCount = deptBreakdown.length;
    const avgPerDept =
      departmentCount > 0 ? Math.round(totalEmployees / departmentCount) : 0;

    const managerCount = globalEntities.filter(
      (employee: any) => String(employee.role || "").toUpperCase() === "MANAGER",
    ).length;

    return {
      totalEmployees,
      managerCount,
      departmentCount,
      topDept,
      avgPerDept,
      deptBreakdown,
      isManagerView,
    };
  }, [entities, globalStatsCache, departments, totalItems, basePath]);

  const managers = useMemo(() => {
    const globalEntities = globalStatsCache
      ? globalStatsCache.entities
      : entities;
    return globalEntities.filter(
      (employee: any) => String(employee.role || "").toUpperCase() === "MANAGER",
    );
  }, [entities, globalStatsCache]);

  const todayCounts = summary?.today.counts;
  const statCards: {
    label: string;
    value: string | number;
    sub: string;
    icon: typeof Users;
    color: string;
    onClick?: () => void;
  }[] = [
        {
          label: "Total Employees",
          value: summary?.totalEmployees ?? dashboardStats.totalEmployees,
          sub: isManagerView ? "" : "Active workforce",
          icon: Users,
          color: "bg-linear-to-r from-[#4318FF] to-[#868CFF]",
          onClick: isManagerView ? () => navigate(`${basePath}/employees`) : undefined,
        },
        ...(isCeoOrGm && !isManagerView
          ? [
              {
                label: "Managers",
                value: dashboardStats.managerCount,
                sub: "Active managers",
                icon: Briefcase,
                color: "bg-linear-to-r from-[#7551FF] to-[#6AD2FF]",
              },
            ]
          : []),
        {
          label: "Working Today",
          value: todayCounts
            ? todayCounts.office +
              todayCounts.wfh +
              todayCounts.clientVisit +
              todayCounts.halfDay
            : "–",
          sub: "Office, WFH & client visits",
          icon: UserCheck,
          color: "bg-linear-to-r from-[#01B574] to-[#4ADE80]",
        },
        {
          label: "On Leave Today",
          value: todayCounts?.onLeave ?? "–",
          sub: `${todayCounts?.notUpdated ?? 0} not updated yet`,
          icon: Plane,
          color: "bg-linear-to-r from-[#EE5D50] to-[#FF8A80]",
        },
        {
          label: "Pending Approvals",
          value: summary?.pendingApprovals.total ?? "–",
          sub: isManagerView ? "Awaiting your decision" : "Awaiting a decision",
          icon: ClipboardCheck,
          color: "bg-linear-to-r from-[#FFB547] to-[#FFD180]",
          onClick: () => navigate(`${basePath}/requests`),
        },
      ];

  const departmentCard = (
    <div className="bg-white p-5 md:p-6 rounded-2xl shadow-[0px_8px_24px_rgba(112,144,176,0.1)] border border-gray-100/80 h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-[#F4F7FE] text-[#4318FF]">
          <Building2 size={18} />
        </div>
        <div>
          <h4 className="text-base font-bold text-[#2B3674]">
            {isManagerView ? "Team by Department" : "Department Breakdown"}
          </h4>
          <p className="text-xs text-gray-400">
            {isManagerView ? "Your team members by department" : "Employee count by department"}
          </p>
        </div>
      </div>
      <div className="h-[380px] w-full flex items-center justify-center">
        {dashboardStats.deptBreakdown.length > 0 ? (
          <Chart
            options={chartData.options}
            series={chartData.series}
            type="donut"
            height="100%"
            width="100%"
          />
        ) : (
          <div className="text-center text-gray-400 text-sm">
            No department data available
          </div>
        )}
      </div>
    </div>
  );

  const chartColors = [
    "#4318FF",
    "#6AD2FF",
    "#01B574",
    "#FFB547",
    "#EE5D50",
    "#7551FF",
    "#E312DC",
    "#A3AED0",
  ];

  return (
    <div className="p-4 md:p-8 bg-[#F4F7FE] font-sans h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674]">
            {isManagerView
              ? "My Team Dashboard"
              : isCeo
                ? "CEO Dashboard"
                : isGm
                  ? "General Manager Dashboard"
                  : "Admin Dashboard"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {dayjs().format("dddd, D MMMM YYYY")} ·{" "}
            {isManagerView
              ? summary
                ? `${summary.totalEmployees} team ${summary.totalEmployees === 1 ? "member" : "members"}`
                : "Team overview"
              : "Organisation overview"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {summary?.generatedAt && (
            <span className="text-xs text-gray-400">
              Updated {dayjs(summary.generatedAt).format("h:mm A")}
            </span>
          )}
          <button
            onClick={refreshSummary}
            disabled={summaryLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-[#2B3674] font-bold text-sm hover:shadow-md transition-all disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={`text-[#4318FF] ${summaryLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Department & Lock Type Control Row */}
      {currentUser?.userType !== UserType.RECEPTIONIST && (
        <div className="flex flex-wrap items-end gap-4 mb-6">
          {/* Department Dropdown */}
          <div className="flex flex-col gap-1.5 min-w-[240px] sm:min-w-[280px] relative">
            <span className="text-sm font-bold text-[#5B6780] pl-1">
              Department
            </span>
            {isManagerView ? (
              <div className="w-full h-[52px] flex items-center gap-3 px-5 bg-white rounded-full shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 text-sm font-bold text-[#2B3674]">
                <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#1055E8] shrink-0">
                  <Briefcase size={16} />
                </div>
                <span className="truncate">
                  {managerOwnDepartment ||
                    (managerDeptStatus === "missing"
                      ? "Department unavailable"
                      : "Loading department…")}
                </span>
              </div>
            ) : (
            <button
              type="button"
              onClick={() => setIsLockDeptOpen(!isLockDeptOpen)}
              className="w-full h-[52px] flex items-center justify-between gap-3 px-5 bg-white rounded-full shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 hover:border-blue-200 transition-all text-sm font-bold text-[#2B3674] cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#1055E8] shrink-0">
                  <Briefcase size={16} />
                </div>
                <span className="truncate">
                  {selectedLockDepartment || "Select Department"}
                </span>
              </div>
              <ChevronDown
                size={18}
                className={`text-[#1055E8] shrink-0 transition-transform duration-200 ${
                  isLockDeptOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            )}

            {!isManagerView && isLockDeptOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsLockDeptOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0px_20px_40px_rgba(0,0,0,0.12)] border border-gray-100 p-2.5 z-50 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="mb-2 px-2 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#A3AED0]">
                      Select Department
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {departments.map((dept) => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() =>
                          handleSelectLockDepartment(dept.departmentName)
                        }
                        className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                          selectedLockDepartment === dept.departmentName
                            ? "bg-[#1055E8] text-white shadow-sm"
                            : "text-[#2B3674] hover:bg-[#F4F7FE]"
                        }`}
                      >
                        {dept.departmentName}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Lock Type Toggle Button */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-[#5B6780] pl-1">
              Lock Type
            </span>
            <div className="h-[52px] bg-white rounded-full shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-100/80 p-1 flex items-center">
              {/* Weekly Button */}
              <button
                type="button"
                disabled={isUpdatingLock || (isManagerView && !managerOwnDepartment)}
                onClick={() => handleToggleLockType("Weekly")}
                className={`h-full px-6 rounded-full font-bold text-[15px] sm:text-base flex items-center gap-2.5 transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeLockType === "Weekly"
                    ? "bg-[#1055E8] text-white shadow-[0px_2px_8px_rgba(16,85,232,0.3)]"
                    : "bg-transparent text-[#1B2559] hover:text-[#1055E8]"
                }`}
              >
                {activeLockType === "Weekly" ? (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2.5" />
                    <circle cx="10" cy="10" r="3.5" fill="currentColor" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="7.5" stroke="#CBD5E1" strokeWidth="2.5" />
                  </svg>
                )}
                <span>Weekly</span>
              </button>

              {/* Monthly Button */}
              <button
                type="button"
                disabled={isUpdatingLock || (isManagerView && !managerOwnDepartment)}
                onClick={() => handleToggleLockType("Monthly")}
                className={`h-full px-6 rounded-full font-bold text-[15px] sm:text-base flex items-center gap-2.5 transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeLockType === "Monthly"
                    ? "bg-[#1055E8] text-white shadow-[0px_2px_8px_rgba(16,85,232,0.3)]"
                    : "bg-transparent text-[#1B2559] hover:text-[#1055E8]"
                }`}
              >
                {activeLockType === "Monthly" ? (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="2.5" />
                    <circle cx="10" cy="10" r="3.5" fill="currentColor" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="7.5" stroke="#CBD5E1" strokeWidth="2.5" />
                  </svg>
                )}
                <span>Monthly</span>
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="h-[52px] bg-[#EEF2FF] border border-[#E0E7FF] rounded-2xl sm:rounded-full px-5 flex items-center gap-3 flex-1 min-w-[280px]">
            <Lock
              size={18}
              className="text-[#1055E8] shrink-0"
              strokeWidth={2.2}
            />
            <p className="text-xs sm:text-sm font-semibold text-[#1E40AF] truncate sm:whitespace-normal mb-0">
              Attendance will be locked for the selected department for the chosen period (Weekly / Monthly).
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 ${statCards.length > 4 ? "lg:grid-cols-3 xl:grid-cols-5" : "xl:grid-cols-4"}`}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            onClick={card.onClick}
            className={`bg-white rounded-2xl p-4 shadow-[0px_8px_24px_rgba(112,144,176,0.1)] hover:shadow-md transition-all group ${card.onClick ? "cursor-pointer" : ""}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div
                className={`p-2 rounded-lg ${card.color} text-white shadow-sm`}
              >
                <card.icon size={18} />
              </div>
              <span className="font-black text-[#2B3674] text-right leading-tight text-2xl">
                {card.value}
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#2B3674]">{card.label}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {summaryError && !summary && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-[#EE5D50]">
          <span>Couldn't load today's dashboard data: {summaryError}</span>
          <button onClick={refreshSummary} className="font-bold underline">
            Try again
          </button>
        </div>
      )}

      {!summary && summaryLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2 h-[460px] rounded-2xl bg-white animate-pulse" />
          <div className="h-[460px] rounded-2xl bg-white animate-pulse" />
        </div>
      )}

      {summary && isManagerView && summary.totalEmployees === 0 && (
        <div className="mb-10 bg-white rounded-2xl p-10 shadow-[0px_8px_24px_rgba(112,144,176,0.1)] border border-gray-100/80 flex flex-col items-center text-center">
          <span className="w-16 h-16 rounded-2xl bg-[#4318FF]/10 text-[#4318FF] flex items-center justify-center mb-4">
            <UserPlus size={28} />
          </span>
          <h3 className="text-lg font-bold text-[#2B3674]">No employees are mapped to you yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md">
            Once an administrator assigns team members to you in Manager Mapping, their attendance,
            requests and celebrations will show up here.
          </p>
        </div>
      )}

      {summary && !(isManagerView && summary.totalEmployees === 0) && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-2">
              <TodaySnapshotCard
                today={summary.today}
                totalEmployees={summary.totalEmployees}
                scope={dashboardScope}
                basePath={basePath}
              />
            </div>
            <EventsScroller
              events={summary.events.items}
              windowDays={summary.events.windowDays}
              subtitle={isManagerView ? "Team birthdays, anniversaries & holidays" : undefined}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-2">
              <PendingApprovalsCard
                data={summary.pendingApprovals}
                basePath={basePath}
                isTeam={isManagerView}
              />
            </div>
            {departmentCard}
          </div>

          {isManagerView ? (
            <div className="mb-10">
              <PendingApprovalsTable items={summary.pendingApprovals.items ?? []} basePath={basePath} />
            </div>
          ) : (
            <div className="mb-4" />
          )}
        </>
      )}

      {isCeoOrGm && !isManagerView && (
        <div className="mb-8 bg-white rounded-2xl shadow-[0px_8px_24px_rgba(112,144,176,0.1)] border border-gray-100/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#2B3674]">Manager Activity</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Click a manager to show or hide their leave requests this month
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin-dashboard/work-management")}
              className="text-sm font-semibold text-[#4318FF] hover:underline"
            >
              View all requests
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {managerLeaveLoading ? (
              <div className="px-5 py-6 text-sm text-gray-400">
                Loading manager activity...
              </div>
            ) : managers.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-400">
                No managers found
              </div>
            ) : (
              managers.map((manager: any) => {
                const employeeId = String(manager.employeeId);
                const leaves = managerLeave.filter(
                  (request) => request.employeeId === manager.employeeId,
                );
                const isExpanded = expandedManagers.has(employeeId);
                const requestCount = leaves.length;
                const preview =
                  leaves[0]?.requestType ||
                  leaves[0]?.title ||
                  "No leave this month";

                return (
                  <div key={employeeId} className="bg-white">
                    <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#F4F7FE]/70 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleManagerExpanded(employeeId)}
                        className="min-w-0 flex-1 flex items-center gap-3 text-left"
                        aria-expanded={isExpanded}
                      >
                        <span
                          className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border transition-colors ${
                            isExpanded
                              ? "bg-[#4318FF]/10 border-[#4318FF]/20 text-[#4318FF]"
                              : "bg-[#F4F7FE] border-transparent text-[#A3AED0]"
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-semibold text-[#2B3674] truncate">
                              {manager.fullName || employeeId}
                            </span>
                            <span className="text-[11px] font-medium text-gray-400">
                              {employeeId}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                requestCount > 0
                                  ? "bg-[#4318FF]/10 text-[#4318FF]"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {requestCount > 0
                                ? `${requestCount} request${requestCount === 1 ? "" : "s"}`
                                : "No requests"}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                            <span>{manager.department || "—"}</span>
                            {!isExpanded && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="truncate text-gray-600">
                                  {preview}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/admin-dashboard/timesheet/${employeeId}`)
                        }
                        className="shrink-0 text-sm font-semibold text-[#4318FF] hover:underline px-2 py-1"
                      >
                        Open timesheet
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-4 pl-[3.75rem]">
                        {requestCount === 0 ? (
                          <div className="rounded-xl border border-dashed border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-gray-500">
                            No leave, WFH, or client visit this month.
                          </div>
                        ) : (
                          <ul className="space-y-2">
                            {leaves.map((request: any, index: number) => (
                              <li
                                key={`${employeeId}-${request?.id || index}`}
                                className="rounded-xl border border-gray-100 bg-[#F8FAFC] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-[#2B3674]">
                                    {request?.requestType ||
                                      request?.title ||
                                      "Request"}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {request?.fromDate
                                      ? `${dayjs(request.fromDate).format("MMM D")} – ${dayjs(request.toDate || request.fromDate).format("MMM D, YYYY")}`
                                      : "Dates not set"}
                                  </p>
                                </div>
                                <span
                                  className={`shrink-0 inline-flex self-start sm:self-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${requestStatusClass(request?.status)}`}
                                >
                                  {request?.status || "—"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/admin-dashboard/employee-details/${employeeId}`,
                            )
                          }
                          className="mt-3 text-xs font-semibold text-[#4318FF] hover:underline"
                        >
                          View manager profile
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

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
                  <SearchBox
                    placeholder="Search by name or ID..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    onClear={() => setModalSearch("")}
                    containerClassName="flex-1"
                    variant="outlined"
                    inputSize="sm"
                  />
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
                        <th className="pb-2 w-14 text-center text-[#A3AED0] text-[11px] uppercase">
                          Sl No
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
                      {filteredModalEmps.map((emp, index) => {
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
                            <td className="p-4 text-center border-b border-gray-50 text-xs font-semibold text-[#475569]">
                              {index + 1}
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
                        className="flex items-center gap-4 px-10 py-4 bg-[#4318FF] text-white rounded-[16px] font-black text-[11px] disabled:opacity-70 shadow-lg shadow-blue-500/20"
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
