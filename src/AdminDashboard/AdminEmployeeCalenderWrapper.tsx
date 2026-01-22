import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import {
  fetchMonthlyAttendance,
  AttendanceStatus,
} from "../reducers/employeeAttendance.reducer";
import {
  ArrowLeft,
  Clock,
  CalendarCheck,
  Lock,
  ShieldAlert,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import AdminEmployeeCalendarView from "./AdminEmployeeCalendarView";
import MobileResponsiveCalendarPage from "../EmployeeDashboard/MobileResponsiveCalendarPage";
import {
  applyBlocker,
  fetchBlockers,
  deleteBlocker,
} from "../reducers/timesheetBlocker.reducer";

const AdminEmployeeCalenderWrapper = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [displayDate] = useState(new Date());

  const { records } = useAppSelector((state: RootState) => state.attendance);
  const { entities } = useAppSelector(
    (state: RootState) => state.employeeDetails,
  );
  const { blockers } = useAppSelector(
    (state: RootState) => state.timesheetBlocker,
  );
  const { currentUser } = useAppSelector((state) => state.user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (employeeId) {
      dispatch(fetchBlockers(employeeId));
      dispatch(
        fetchMonthlyAttendance({
          employeeId,
          month: (displayDate.getMonth() + 1).toString(),
          year: displayDate.getFullYear().toString(),
        }),
      );
    }
  }, [dispatch, employeeId, displayDate]);

  const employee = entities.find(
    (e: any) => (e.employeeId || e.id) === employeeId,
  );

  // Calculate metrics
  const presentDays = records.filter(
    (r) =>
      r.status === AttendanceStatus.FULL_DAY ||
      r.status === AttendanceStatus.HALF_DAY,
  ).length;

  const totalHours = records.reduce(
    (acc, curr) => acc + (curr.totalHours || 0),
    0,
  );
  const avgHours = totalHours.toFixed(1);

  const handleBack = () => {
    navigate("/admin-dashboard/working-details");
  };

  const handleApplyBlock = async () => {
    if (!fromDate || !toDate) {
      alert("Please select both dates");
      return;
    }
    try {
      await dispatch(
        applyBlocker({
          employeeId: employeeId!,
          blockedFrom: fromDate,
          blockedTo: toDate,
          reason: reason || "Admin Blocked",
          blockedBy: currentUser?.employeeId || "Admin",
        }),
      ).unwrap();
      setIsModalOpen(false);
      setFromDate("");
      setToDate("");
      setReason("");
      dispatch(fetchBlockers(employeeId!));
    } catch (error) {
      alert("Failed to apply blocker");
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (window.confirm("Are you sure you want to remove this blocker?")) {
      try {
        await dispatch(deleteBlocker(id)).unwrap();
        dispatch(fetchBlockers(employeeId!));
      } catch (error) {
        alert("Failed to remove blocker");
      }
    }
  };

  if (!employee) return null;

  return (
    <div className="flex flex-col bg-[#F4F7FE]">
      {/* Sticky Top Navigation & Header */}
      <div className="sticky top-0 z-30 bg-[#F4F7FE] px-4 md:px-8 py-4 border-b border-gray-100/80 backdrop-blur-md shadow-sm">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-gray-400 hover:text-[#4318FF] transition-colors group mb-1.5"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">
            Back to employee list
          </span>
        </button>

        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl md:text-4xl font-black text-[#2B3674] leading-tight truncate">
            {employee.fullName || employee.name}
          </h2>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4318FF] text-white rounded-xl text-[10px] md:text-xs font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95 transition-all shrink-0 uppercase tracking-widest"
          >
            <Lock size={12} strokeWidth={2.5} />
            <span>Block</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Section */}
      <div className="px-4 md:px-8 pt-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#E6FFFA] flex items-center justify-center text-[#01B574] shrink-0">
              <CalendarCheck size={24} />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-medium text-gray-500 mb-0.5">
                Total Present Days
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl md:text-3xl font-black text-[#2B3674]">
                  {presentDays}
                </h3>
                <span className="text-[10px] font-bold text-[#01B574] bg-[#E6FFFA] px-2 py-0.5 rounded-full">
                  Days
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#F4F7FE] flex items-center justify-center text-[#4318FF] shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-medium text-gray-500 mb-0.5">
                Total Working Hours
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl md:text-3xl font-black text-[#2B3674]">
                  {avgHours}
                </h3>
                <span className="text-[10px] font-bold text-[#4318FF] bg-[#F4F7FE] px-2 py-0.5 rounded-full">
                  Hours
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View (Now part of the outer scroll) */}
      <div className="shrink-0">
        {isMobile ? (
          <MobileResponsiveCalendarPage
            employeeId={employeeId}
            navigationPath="/admin-dashboard/timesheet/:employeeId"
          />
        ) : (
          <AdminEmployeeCalendarView />
        )}
      </div>
      {/* Responsive Block Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-2000 flex items-end sm:items-center justify-center bg-[#1B254B]/40 backdrop-blur-sm animate-in fade-in duration-300 p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 overflow-y-auto max-h-[95vh]">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 rounded-2xl">
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#2B3674]">
                    Block Timesheet
                  </h3>
                  <p className="text-xs text-gray-500 font-medium tracking-wide">
                    Select date range to restrict editing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Close modal"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
                    From Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#F4F7FE] border-none rounded-2xl text-sm text-[#2B3674] font-bold focus:ring-2 focus:ring-[#4318FF] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2B3674] ml-1">
                    To Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#F4F7FE] border-none rounded-2xl text-sm text-[#2B3674] font-bold focus:ring-2 focus:ring-[#4318FF] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2B3674] ml-1">
                  Block Reason
                </label>
                <textarea
                  placeholder="e.g. Monthly Payroll Verification"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-5 py-3 bg-[#F4F7FE] border-none rounded-2xl text-sm text-[#2B3674] font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-[#4318FF] transition-all min-h-[100px]"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleApplyBlock}
                  className="w-full py-4 bg-[#4318FF] text-white rounded-2xl font-bold shadow-lg shadow-[#4318FF]/20 hover:shadow-[#4318FF]/40 hover:-translate-y-0.5 active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  APPLY BLOCK <Lock size={16} />
                </button>
              </div>

              {/* Existing Blockers List */}
              {blockers.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-widest mb-4">
                    Active Locks
                  </h4>
                  <div className="space-y-3 max-h-[150px] overflow-y-auto no-scrollbar">
                    {blockers.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-red-600 uppercase">
                            {new Date(b.blockedFrom).toLocaleDateString()} -{" "}
                            {new Date(b.blockedTo).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {b.reason}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteBlock(b.id!)}
                          className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployeeCalenderWrapper;
