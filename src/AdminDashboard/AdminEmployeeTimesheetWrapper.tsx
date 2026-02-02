import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { getEntity } from "../reducers/employeeDetails.reducer";
import {
  ArrowLeft,
  Loader2,
  Lock,
  X,
  Calendar as CalendarIcon,
  ShieldAlert,
} from "lucide-react";
import MyTimesheet from "../EmployeeDashboard/MyTimesheet";
import {
  applyBlocker,
  fetchBlockers,
  deleteBlocker,
} from "../reducers/timesheetBlocker.reducer";

const AdminEmployeeTimesheetWrapper = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { entities, entity, loading } = useAppSelector(
    (state) => state.employeeDetails,
  );
  const { blockers } = useAppSelector((state) => state.timesheetBlocker);
  const { currentUser } = useAppSelector((state) => state.user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Read month and year from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const monthParam = queryParams.get("month");
  const yearParam = queryParams.get("year");

  // Initialize date based on query params or default to current date
  const initialDate = useMemo(() => {
    if (monthParam && yearParam) {
      const month = parseInt(monthParam, 10);
      const year = parseInt(yearParam, 10);
      if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
        return new Date(year, month - 1, 1);
      }
    }
    return new Date();
  }, [monthParam, yearParam]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (employeeId && employeeId.toLowerCase() !== "admin") {
      if (!entity || (entity.employeeId || entity.id) !== employeeId) {
        dispatch(getEntity(employeeId));
      }
    }
  }, [dispatch, employeeId]);

  const employee =
    entity && (entity.employeeId || entity.id) === employeeId
      ? entity
      : entities.find((e: any) => (e.employeeId || e.id) === employeeId);

  const handleBack = () => {
    // Extract month and year to pass back to the list
    const month = initialDate.getMonth() + 1;
    const year = initialDate.getFullYear();
    navigate(`/admin-dashboard/timesheet-list`, {
      state: { selectedMonth: month, selectedYear: year },
    });
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
        setIsModalOpen(false); // Return to timesheet view
      } catch (error) {
        alert("Failed to remove blocker");
      }
    }
  };

  if (loading && !employee) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#4318FF]" />
      </div>
    );
  }

  if (!employee && !loading) {
    return (
      <div className="p-8 text-center pt-[100px]">
        <p className="text-gray-500 mb-4">Employee not found</p>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-400 hover:text-[#4318FF] transition-colors group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm font-semibold tracking-wide">
            Back to employee list
          </span>
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F4F7FE] px-4 md:px-6 py-3 md:py-4 relative">
      {/* Premium Responsive Header */}
      <div className="mb-2 flex flex-col gap-2 bg-white/40 md:bg-transparent p-3 md:p-0 rounded-2xl md:rounded-none border border-white/50 md:border-none backdrop-blur-sm md:backdrop-blur-none shadow-sm md:shadow-none shrink-0">
        <div className="flex flex-col gap-1">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-gray-400 hover:text-[#4318FF] transition-colors group w-fit"
          >
            <ArrowLeft
              size={12}
              className="group-hover:-translate-x-1 transition-transform shrink-0"
            />
            <span className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase">
              Back to employee list
            </span>
          </button>

          <div className="flex items-center justify-between gap-4">
            <h2
              className={`font-black text-[#2B3674] truncate leading-tight ${isMobile ? "text-xl" : "text-2xl"}`}
            >
              {employee
                ? employee.fullName || employee.name || employee.employeeId
                : "Loading..."}
            </h2>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#4318FF] text-white rounded-xl text-[10px] md:text-[11px] font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95 transition-all shrink-0 uppercase tracking-widest"
            >
              <Lock size={12} strokeWidth={2.5} />
              <span>Block</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        <MyTimesheet
          employeeId={employeeId!}
          readOnly={false}
          now={initialDate}
          onBlockedClick={() => setIsModalOpen(true)}
          containerClassName="h-full overflow-hidden shadow-none border-none bg-transparent"
        />
      </div>

      {/* Responsive Block Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-[#1B254B]/40 backdrop-blur-sm animate-in fade-in duration-300 p-0 sm:p-4">
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

export default AdminEmployeeTimesheetWrapper;
